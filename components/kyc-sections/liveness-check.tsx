"use client"

import React, { useEffect, useRef, useReducer, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Camera, Video, StopCircle, CheckCircle2 } from "lucide-react"

interface LivenessCheckSectionProps {
  selfieVideo: File | null
  error?: string
  onCapture: (file: File | null) => void
}

type Indicators = {
  left: boolean
  right: boolean
  nod: boolean
}

type State = {
  modelsLoaded: boolean
  modelsLoading: boolean
  faceApiReady: boolean
  faceApiError: string | null
  indicators: Indicators
  isRecording: boolean
  remainingSec: number
  motionMessage: string | null
}

type Action =
  | { type: "models/loading" }
  | { type: "models/loaded" }
  | { type: "models/error"; payload: string }
  | { type: "faceapi/ready" }
  | { type: "indicator/update"; payload: Partial<Indicators> }
  | { type: "recording/start" }
  | { type: "recording/stop" }
  | { type: "timer/tick"; payload: number }
  | { type: "motion/message"; payload: string | null }

const INITIAL_STATE: State = {
  modelsLoaded: false,
  modelsLoading: false,
  faceApiReady: false,
  faceApiError: null,
  indicators: { left: false, right: false, nod: false },
  isRecording: false,
  remainingSec: 5,
  motionMessage: null,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "models/loading":
      return { ...state, modelsLoading: true, faceApiError: null }
    case "models/loaded":
      return { ...state, modelsLoading: false, modelsLoaded: true, faceApiError: null }
    case "models/error":
      return { ...state, modelsLoading: false, modelsLoaded: false, faceApiError: action.payload }
    case "faceapi/ready":
      return { ...state, faceApiReady: true }
    case "indicator/update":
      return { ...state, indicators: { ...state.indicators, ...action.payload } }
    case "recording/start":
      return { ...state, isRecording: true }
    case "recording/stop":
      return { ...state, isRecording: false }
    case "timer/tick":
      return { ...state, remainingSec: action.payload }
    case "motion/message":
      return { ...state, motionMessage: action.payload }
    default:
      return state
  }
}

export default function LivenessCheckSection({ selfieVideo, error, onCapture }: LivenessCheckSectionProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const startButtonRef = useRef<HTMLButtonElement | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const autoSaveTimerRef = useRef<number | null>(null)

  const faceapiRef = useRef<any | null>(null)
  const analyzingRef = useRef<boolean>(false)
  const lastAnalyzeRef = useRef<number>(0)
  const baselineRef = useRef<{ noseY: number; eyeCenterY: number } | null>(null)
  const blinkStateRef = useRef<{ lastEAR: number; blinked: boolean }>({ lastEAR: 1, blinked: false })
  const selectedMimeRef = useRef<string | undefined>(undefined)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [confirmed, setConfirmed] = useState<boolean>(false)
  const [acceptedInstructions, setAcceptedInstructions] = useState<boolean>(false)
  const [autoSaveCountdown, setAutoSaveCountdown] = useState<number | null>(null)
  const [recorderSupported, setRecorderSupported] = useState<boolean>(true)

  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)

  const MAX_DURATION_SEC = 5
  const AUTO_SAVE_DELAY_SEC = 3
  const ANALYZE_INTERVAL_MS = 150 // throttle analysis to every 150ms

  useEffect(() => {
    // pre-emptively attempt to load face-api library in background
    (async () => {
      await ensureFaceApi()
    })()
    return () => {
      cleanupAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selfieVideo && !capturedFile) {
      setCapturedFile(selfieVideo)
      const url = URL.createObjectURL(selfieVideo)
      setPreviewUrl(url)
      setConfirmed(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfieVideo])

  useEffect(() => {
    if (acceptedInstructions && capturedFile && !confirmed) {
      setAutoSaveCountdown(AUTO_SAVE_DELAY_SEC)
      let left = AUTO_SAVE_DELAY_SEC
      autoSaveTimerRef.current = window.setInterval(() => {
        left -= 1
        setAutoSaveCountdown(left > 0 ? left : 0)
        if (left <= 0) {
          confirmAndSave()
          if (autoSaveTimerRef.current) {
            window.clearInterval(autoSaveTimerRef.current)
            autoSaveTimerRef.current = null
          }
        }
      }, 1000)
    } else {
      if (autoSaveTimerRef.current) {
        window.clearInterval(autoSaveTimerRef.current)
        autoSaveTimerRef.current = null
      }
      setAutoSaveCountdown(null)
    }
    return () => {
      if (autoSaveTimerRef.current) {
        window.clearInterval(autoSaveTimerRef.current)
        autoSaveTimerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptedInstructions, capturedFile, confirmed])

  const ensureFaceApi = async () => {
    if (faceapiRef.current) return
    try {
      const faceapi = await import("face-api.js")
      faceapiRef.current = faceapi
      // try to set tf backend for better perf when available
      try {
        if (faceapi && faceapi.tf && faceapi.tf.setBackend) {
          // prefer webgl, fallback to cpu
          await faceapi.tf.setBackend("webgl").catch(() => faceapi.tf.setBackend("cpu"))
        }
      } catch {
        // ignore backend selection errors
      }
      dispatch({ type: "faceapi/ready" })
    } catch (e: any) {
      dispatch({ type: "models/error", payload: `face-api konnte nicht geladen werden: ${e?.message || String(e)}` })
    }
  }

  const loadModels = async (retries = 2) => {
    if (!faceapiRef.current) await ensureFaceApi()
    const faceapi = faceapiRef.current
    if (!faceapi) return
    if (state.modelsLoaded) return

    dispatch({ type: "models/loading" })

    const LOCAL_MODEL_URL = "/face-api/models"
    const CDN_MODEL_URL = "https://cdn.jsdelivr.net/npm/face-api.js/models"

    const tryLoad = async (url: string) => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(url),
        faceapi.nets.faceLandmark68Net.loadFromUri(url),
        faceapi.nets.faceExpressionNet.loadFromUri(url),
      ])
    }

    let attempt = 0
    let lastErr: any = null
    while (attempt <= retries) {
      try {
        if (attempt === 0) {
          // prefer local
          await tryLoad(LOCAL_MODEL_URL)
        } else {
          await tryLoad(CDN_MODEL_URL)
        }
        dispatch({ type: "models/loaded" })
        // focus start button for accessibility
        setTimeout(() => startButtonRef.current?.focus(), 50)
        return
      } catch (err) {
        lastErr = err
        attempt += 1
        // exponential backoff
        await new Promise((r) => setTimeout(r, 300 * attempt))
      }
    }

    dispatch({ type: "models/error", payload: `Modelle konnten nicht geladen werden: ${lastErr?.message || String(lastErr)}. Bitte prüfen Sie /face-api/models oder Netzwerkzugriff.` })
  }

  const chooseMimeType = (): string | undefined => {
    const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]
    for (const type of candidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) return type
    }
    return undefined
  }

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      })
      mediaStreamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        videoRef.current.setAttribute("aria-live", "polite")
        videoRef.current.setAttribute("aria-label", "Live-Kamera Vorschau")
      }
      // load models after camera access for better UX
      await loadModels()
    } catch (err: any) {
      dispatch({ type: "models/error", payload: "Keine Kamera erkannt oder Zugriff verweigert." })
    }
  }

  const stopStream = () => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
    mediaStreamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const computeEAR = (pts: { x: number; y: number }[]) => {
    const dist = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y)
    const ear = (dist(pts[1], pts[5]) + dist(pts[2], pts[4])) / (2 * dist(pts[0], pts[3]))
    return ear
  }

  const startFaceApiAnalysis = () => {
    if (!faceapiRef.current || !state.modelsLoaded) return
    stopFaceApiAnalysis()

    // reset
    baselineRef.current = null
    blinkStateRef.current = { lastEAR: 1, blinked: false }
    dispatch({ type: "indicator/update", payload: { left: false, right: false, nod: false } })

    analyzingRef.current = true
    const faceapi = faceapiRef.current

    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 })

    const analyze = async () => {
      if (!analyzingRef.current) return

      const now = performance.now()
      if (now - lastAnalyzeRef.current < ANALYZE_INTERVAL_MS) {
        requestAnimationFrame(analyze)
        return
      }
      lastAnalyzeRef.current = now

      const v = videoRef.current
      if (!v || v.readyState < 2) {
        requestAnimationFrame(analyze)
        return
      }

      try {
        // wrap in tf.tidy if available to reduce memory growth
        if (faceapi.tf && faceapi.tf.tidy) {
          await faceapi.tf.tidy(async () => {
            const result = await faceapi.detectSingleFace(v, options).withFaceLandmarks()
            handleResult(result)
          })
        } else {
          const result = await faceapi.detectSingleFace(v, options).withFaceLandmarks()
          handleResult(result)
        }
      } catch (err) {
        // cheap error reporting to state
        dispatch({ type: "motion/message", payload: "Fehler bei der Analyse des Videoframes." })
      }

      requestAnimationFrame(analyze)
    }

    const handleResult = (result: any) => {
      if (!result || !result.landmarks) return
      const positions = result.landmarks.positions

      const leftEyeIdx = [36, 37, 38, 39, 40, 41]
      const rightEyeIdx = [42, 43, 44, 45, 46, 47]
      const leftEye = leftEyeIdx.map((i) => positions[i])
      const rightEye = rightEyeIdx.map((i) => positions[i])

      const nose = positions[30]
      const jawLeft = positions[3]
      const jawRight = positions[13]

      const faceCenterX = (jawLeft.x + jawRight.x) / 2
      const yawNorm = (nose.x - faceCenterX) / (jawRight.x - jawLeft.x)

      const eyeCenterY = (leftEye[0].y + rightEye[3].y) / 2

      if (!baselineRef.current) {
        baselineRef.current = { noseY: nose.y, eyeCenterY }
        return
      }

      const base = baselineRef.current
      const yaw = yawNorm
      const pitch = (nose.y - base.noseY) / Math.max(1, Math.abs(base.eyeCenterY - base.noseY))

      const updates: Partial<Indicators> = {}
      if (yaw < -0.10) updates.left = true
      if (yaw > 0.10) updates.right = true
      if (pitch > 0.28) updates.nod = true

      if (Object.keys(updates).length > 0) dispatch({ type: "indicator/update", payload: updates })

      const leftEAR = computeEAR(leftEye)
      const rightEAR = computeEAR(rightEye)
      const ear = (leftEAR + rightEAR) / 2
      const prev = blinkStateRef.current.lastEAR
      if (prev > 0.24 && ear < 0.18) blinkStateRef.current.blinked = true
      blinkStateRef.current.lastEAR = ear

      // update motion message to guide the user
      const { left, right, nod } = { ...state.indicators, ...updates }
      const missing: string[] = []
      if (!left) missing.push("links schauen")
      if (!right) missing.push("rechts schauen")
      if (!nod) missing.push("nicken")
      if (missing.length === 0) {
        dispatch({ type: "motion/message", payload: null })
      } else {
        dispatch({ type: "motion/message", payload: `Bitte noch: ${missing.join(", ")}` })
      }
    }

    requestAnimationFrame(analyze)
  }

  const stopFaceApiAnalysis = () => {
    analyzingRef.current = false
    // attempt to release tf memory if available
    try {
      const tf = faceapiRef.current?.tf
      if (tf && tf.engine && tf.engine().dispose) {
        // not all tf versions expose this; try safe cleanup
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        ;(tf as any).dispose?.()
      }
    } catch {
      // ignore
    }
  }

  const evaluateMotion = (): { passed: boolean; message?: string } => {
    const sawLeft = state.indicators.left
    const sawRight = state.indicators.right
    const sawNod = state.indicators.nod

    if (sawLeft && sawRight && sawNod) return { passed: true }

    const missing: string[] = []
    if (!sawLeft) missing.push("nach links schauen")
    if (!sawRight) missing.push("nach rechts schauen")
    if (!sawNod) missing.push("nicken")

    return { passed: false, message: `Bitte führen Sie folgende Aktionen aus: ${missing.join(", ")}.` }
  }

  const startRecording = async () => {
    if (!mediaStreamRef.current) {
      await startStream()
    }
    const stream = mediaStreamRef.current
    if (!stream) return

    if (!state.faceApiReady || !state.modelsLoaded) {
      dispatch({ type: "models/error", payload: "Modelle werden noch geladen. Bitte warten Sie." })
      return
    }

    if (typeof MediaRecorder === "undefined") {
      setRecorderSupported(false)
      return
    }

    chunksRef.current = []
    const mimeType = chooseMimeType()
    selectedMimeRef.current = mimeType

    try {
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      recorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stopFaceApiAnalysis()
        const evaluation = evaluateMotion()
        if (!evaluation.passed) {
          dispatch({ type: "motion/message", payload: evaluation.message || "Bewegung nicht erkannt. Bitte erneut versuchen." })
          chunksRef.current = []
          setCapturedFile(null)
          setPreviewUrl((p) => {
            if (p) URL.revokeObjectURL(p)
            return null
          })
          await startStream()
          setTimeout(() => dispatch({ type: "indicator/update", payload: { left: false, right: false, nod: false } }), 400)
          dispatch({ type: "recording/stop" })
          return
        }

        const mime = selectedMimeRef.current || ((recorderRef.current as any)?.mimeType as string) || "video/webm"
        const ext = mime.includes("mp4") ? ".mp4" : mime.includes("webm") ? ".webm" : ".webm"
        const blob = new Blob(chunksRef.current, { type: mime })
        const file = new File([blob], `selfie-${Date.now()}${ext}`, { type: mime })

        setCapturedFile(file)
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return URL.createObjectURL(file)
        })
        dispatch({ type: "recording/stop" })
        stopStream()
        dispatch({ type: "motion/message", payload: null })
      }

      recorder.start()
      dispatch({ type: "recording/start" })
      dispatch({ type: "motion/message", payload: null })
      dispatch({ type: "indicator/update", payload: { left: false, right: false, nod: false } })

      // start face analysis only if models are ready
      if (state.faceApiReady && state.modelsLoaded) startFaceApiAnalysis()

      let left = MAX_DURATION_SEC
      dispatch({ type: "timer/tick", payload: left })
      timerRef.current = window.setInterval(() => {
        left -= 1
        dispatch({ type: "timer/tick", payload: left })
        if (left <= 0) {
          if (recorderRef.current && recorderRef.current.state !== "inactive") {
            recorderRef.current.stop()
          }
          if (timerRef.current) {
            window.clearInterval(timerRef.current)
            timerRef.current = null
          }
        }
      }, 1000)
    } catch (e: any) {
      setRecorderSupported(false)
      dispatch({ type: "models/error", payload: `Aufnahme konnte nicht gestartet werden: ${e?.message || String(e)}` })
    }
  }

  const stopRecording = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop()
    }
    dispatch({ type: "recording/stop" })
    stopFaceApiAnalysis()
  }

  const retake = () => {
    setPreviewUrl((p) => {
      if (p) URL.revokeObjectURL(p)
      return null
    })
    setCapturedFile(null)
    setConfirmed(false)
    setAcceptedInstructions(false)
    setAutoSaveCountdown(null)
    dispatch({ type: "indicator/update", payload: { left: false, right: false, nod: false } })
    dispatch({ type: "motion/message", payload: null })
    stopFaceApiAnalysis()
    // restart stream so user can try again
    startStream()
  }

  const confirmAndSave = () => {
    if (!capturedFile) return
    onCapture(capturedFile)
    setConfirmed(true)
    setAutoSaveCountdown(null)
  }

  const cleanupAll = () => {
    stopRecording()
    stopStream()
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    if (autoSaveTimerRef.current) {
      window.clearInterval(autoSaveTimerRef.current)
      autoSaveTimerRef.current = null
    }
    stopFaceApiAnalysis()
  }

  const evaluateMissingActions = () => {
    const { left, right, nod } = state.indicators
    const missing: string[] = []
    if (!left) missing.push("links")
    if (!right) missing.push("rechts")
    if (!nod) missing.push("nicken")
    return missing
  }

  return (
    <div className="space-y-4">
      <Alert className="border-primary bg-primary/10">
        <Camera className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm text-foreground">
          Nehmen Sie ein 3–5 Sekunden langes Selfie-Video auf. Folgen Sie den Anweisungen auf dem Bildschirm.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label>Selfie-Video *</Label>
        <div className={`rounded-lg border ${error || state.motionMessage ? "border-destructive" : "border-input"} p-4 bg-muted/30`}>
          {/* Accessibility: status region */}
          <div aria-live="polite" className="sr-only">
            {state.faceApiError || (state.modelsLoading ? "Modelle werden geladen" : state.modelsLoaded ? "Modelle geladen" : null)}
          </div>

          {!state.modelsLoaded && state.modelsLoading && (
            <p className="text-xs text-muted-foreground">Modelle werden geladen…</p>
          )}

          {state.faceApiError && (
            <p className="text-xs text-destructive whitespace-pre-line" role="alert">{state.faceApiError}</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 items-start">
            <div className="relative aspect-video bg-black/80 rounded-md overflow-hidden focus:outline-none" tabIndex={-1}>
              <video ref={videoRef} className="w-full h-full" playsInline muted aria-hidden={!!capturedFile} />

              {!capturedFile && (
                <div className="absolute inset-0 pointer-events-none flex items-start justify-center p-4">
                  <div className="bg-background/60 backdrop-blur-sm rounded px-3 py-2 text-sm font-medium">
                    {state.isRecording ? (
                      <div>Bitte: Schauen Sie nach links, dann nach rechts und nicken Sie kurz.</div>
                    ) : (
                      <div>Bereit? Aktivieren Sie die Kamera und starten Sie die Aufnahme.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {!state.isRecording && !capturedFile && (
                <>
                  <Button
                    type="button"
                    onClick={startStream}
                    className="w-full"
                    variant="outline"
                    aria-label="Kamera aktivieren"
                  >
                    <Camera className="w-4 h-4 mr-2" /> Kamera aktivieren
                  </Button>

                  {mediaStreamRef.current && (
                    <Button
                      type="button"
                      onClick={startRecording}
                      className="w-full"
                      disabled={!state.modelsLoaded || !state.faceApiReady || !recorderSupported}
                      aria-disabled={!state.modelsLoaded || !state.faceApiReady || !recorderSupported}
                      aria-label={state.modelsLoaded ? "Aufnahme starten" : "Aufnahme nicht möglich, Modelle werden geladen"}
                      ref={startButtonRef}
                    >
                      <Video className="w-4 h-4 mr-2" /> Aufnahme starten
                    </Button>
                  )}

                  {!recorderSupported && (
                    <p className="text-sm text-destructive">Aufnahme im Browser nicht unterstützt. Bitte verwenden Sie einen aktuellen Browser.</p>
                  )}
                </>
              )}

              {state.isRecording && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-foreground">
                    <span>Aufnahme läuft…</span>
                    <span className="font-medium">00:0{state.remainingSec}</span>
                  </div>
                  <Button type="button" onClick={stopRecording} className="w-full" variant="destructive" aria-label="Aufnahme stoppen">
                    <StopCircle className="w-4 h-4 mr-2" /> Aufnahme stoppen
                  </Button>

                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${state.indicators.left ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}`}>
                        {state.indicators.left ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs">L</span>}
                      </div>
                      <div className="text-xs mt-1">Links</div>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${state.indicators.nod ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}`}>
                        {state.indicators.nod ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs">N</span>}
                      </div>
                      <div className="text-xs mt-1">Nicken</div>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${state.indicators.right ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}`}>
                        {state.indicators.right ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs">R</span>}
                      </div>
                      <div className="text-xs mt-1">Rechts</div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="w-full h-2 bg-muted rounded overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${(Number(state.indicators.left) + Number(state.indicators.right) + Number(state.indicators.nod)) / 3 * 100}%` }} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Fortschritt: {Number(state.indicators.left) + Number(state.indicators.right) + Number(state.indicators.nod)}/3</div>
                  </div>

                  {state.motionMessage && (
                    <p className="text-sm text-muted-foreground mt-2" aria-live="polite">{state.motionMessage}</p>
                  )}
                </div>
              )}

              {capturedFile && previewUrl && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Video bereit zur Überprüfung: {capturedFile.name}</span>
                  </div>

                  <div className="aspect-video bg-black/80 rounded-md overflow-hidden">
                    <video className="w-full h-full" src={previewUrl} controls aria-label="Vorschau des aufgenommenen Videos" />
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Bitte folgende Anweisungen befolgen:</div>
                    <ul className="list-disc list-inside text-sm">
                      <li>Gute Beleuchtung</li>
                      <li>Gesicht zentriert in der Kamera</li>
                      <li>Schauen Sie links, schauen Sie rechts und nicken Sie kurz</li>
                    </ul>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={acceptedInstructions}
                        onChange={(e) => setAcceptedInstructions(e.target.checked)}
                        className="rounded"
                        aria-label="Anweisungen befolgt"
                      />
                      <span>Ich habe die Anweisungen befolgt</span>
                    </label>
                  </div>

                  <div className="flex gap-3 items-center">
                    <Button type="button" variant="outline" onClick={retake} className="bg-transparent flex-1" aria-label="Neu aufnehmen">
                      Neu aufnehmen
                    </Button>

                    {confirmed ? (
                      <Button type="button" variant="secondary" className="flex-1" disabled aria-label="Gespeichert">
                        Gespeichert
                      </Button>
                    ) : (
                      <Button type="button" variant="secondary" onClick={confirmAndSave} className="flex-1" disabled={!acceptedInstructions} aria-label="Speichern">
                        Speichern
                      </Button>
                    )}
                  </div>

                  {autoSaveCountdown !== null && !confirmed && (
                    <p className="text-xs text-muted-foreground">Automatisches Speichern in {autoSaveCountdown}s…</p>
                  )}

                  {!confirmed && (
                    <p className="text-xs text-muted-foreground">Hinweis: Ihr Video wird automatisch gespeichert, sobald Sie die Anweisungen bestätigen.</p>
                  )}

                  {state.motionMessage && <p className="text-xs text-destructive">{state.motionMessage}</p>}
                </div>
              )}

              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
