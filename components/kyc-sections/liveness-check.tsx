"use client"

import React, { useEffect, useRef, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Camera, Video, StopCircle, CheckCircle2 } from "lucide-react"

interface LivenessCheckSectionProps {
  selfieVideo: File | null
  error?: string
  onCapture: (file: File | null) => void
}

export default function LivenessCheckSection({ selfieVideo, error, onCapture }: LivenessCheckSectionProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const autoSaveTimerRef = useRef<number | null>(null)

  const [hasCamera, setHasCamera] = useState<boolean>(true)
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [isPreviewReady, setIsPreviewReady] = useState<boolean>(false)
  const [recorderSupported, setRecorderSupported] = useState<boolean>(true)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [remainingSec, setRemainingSec] = useState<number>(5)

  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [confirmed, setConfirmed] = useState<boolean>(false)
  const [acceptedInstructions, setAcceptedInstructions] = useState<boolean>(false)
  const [autoSaveCountdown, setAutoSaveCountdown] = useState<number | null>(null)
  const [motionError, setMotionError] = useState<string | null>(null)

  // Visual indicators
  const [leftDetected, setLeftDetected] = useState<boolean>(false)
  const [rightDetected, setRightDetected] = useState<boolean>(false)
  const [nodDetected, setNodDetected] = useState<boolean>(false)

  // face-api.js state
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false)
  const [faceApiReady, setFaceApiReady] = useState<boolean>(false)
  const [faceApiError, setFaceApiError] = useState<string | null>(null)
  const faceapiRef = useRef<any>(null)
  const analyzingRef = useRef<boolean>(false)
  const baselineRef = useRef<{ noseX: number; noseY: number; eyeCenterY: number } | null>(null)
  const blinkStateRef = useRef<{ lastEAR: number; blinked: boolean }>({ lastEAR: 1, blinked: false })

  const selectedMimeRef = useRef<string | undefined>(undefined)

  const MAX_DURATION_SEC = 5
  const AUTO_SAVE_DELAY_SEC = 3

  useEffect(() => {
    return () => {
      stopRecording()
      stopStream()
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      if (autoSaveTimerRef.current) {
        window.clearInterval(autoSaveTimerRef.current)
        autoSaveTimerRef.current = null
      }
      stopFaceApiAnalysis()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selfieVideo && !capturedFile) {
      setCapturedFile(selfieVideo)
      const url = URL.createObjectURL(selfieVideo)
      setPreviewUrl(url)
      setIsPreviewReady(true)
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
      setFaceApiReady(true)
    } catch (e: any) {
      setFaceApiError(`face-api konnte nicht geladen werden: ${e?.message || String(e)}`)
      setFaceApiReady(false)
    }
  }

  const loadModels = async () => {
    await ensureFaceApi()
    if (!faceapiRef.current) return
    if (modelsLoaded) return

    const faceapi = faceapiRef.current
    const LOCAL_MODEL_URL = "/face-api/models"
    const CDN_MODEL_URL = "https://cdn.jsdelivr.net/npm/face-api.js/models"

    const tryLoad = async (url: string) => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(url),
        faceapi.nets.faceLandmark68Net.loadFromUri(url),
        faceapi.nets.faceExpressionNet.loadFromUri(url),
      ])
    }

    try {
      // Prefer local hosting for privacy and reliability; fall back to CDN
      try {
        await tryLoad(LOCAL_MODEL_URL)
        setModelsLoaded(true)
        setFaceApiError(null)
        return
      } catch (localErr) {
        // local failed, attempt CDN
      }

      try {
        await tryLoad(CDN_MODEL_URL)
        setModelsLoaded(true)
        setFaceApiError(null)
        return
      } catch (cdnErr: any) {
        throw cdnErr || new Error("Unbekannter Fehler beim Laden der Modelle")
      }
    } catch (e: any) {
      setFaceApiError(
        `Modelle konnten nicht geladen werden: ${e?.message || String(e)}.\nBitte stellen Sie sicher, dass die Modelle unter /face-api/models bereitgestellt sind oder die Anwendung Zugriff auf ${CDN_MODEL_URL} hat.`
      )
      setModelsLoaded(false)
    }
  }

  const chooseMimeType = (): string | undefined => {
    const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]
    for (const type of candidates) {
      if (!type) return undefined
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
      }
      setHasCamera(true)
      await loadModels()
    } catch (err) {
      setHasCamera(false)
      setFaceApiError("Keine Kamera erkannt oder Zugriff verweigert.")
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
    if (!faceapiRef.current || !modelsLoaded) return
    stopFaceApiAnalysis()

    // reset indicators
    setLeftDetected(false)
    setRightDetected(false)
    setNodDetected(false)
    baselineRef.current = null
    blinkStateRef.current = { lastEAR: 1, blinked: false }

    analyzingRef.current = true
    const faceapi = faceapiRef.current

    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 192, scoreThreshold: 0.5 })

    const analyze = async () => {
      if (!analyzingRef.current) return
      const v = videoRef.current
      if (!v || v.readyState < 2) {
        requestAnimationFrame(analyze)
        return
      }

      try {
        const result = await faceapi
          .detectSingleFace(v, options)
          .withFaceLandmarks()
          .withFaceExpressions()

        if (result && result.landmarks) {
          const lm = result.landmarks
          const positions = lm.positions

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
            baselineRef.current = { noseX: nose.x, noseY: nose.y, eyeCenterY }
          } else {
            const base = baselineRef.current
            const yaw = yawNorm
            const pitch = (nose.y - base.noseY) / Math.max(1, Math.abs(base.eyeCenterY - base.noseY))

            if (yaw < -0.10) setLeftDetected(true)
            if (yaw > 0.10) setRightDetected(true)
            if (pitch > 0.28) setNodDetected(true)
          }

          const leftEAR = computeEAR(leftEye)
          const rightEAR = computeEAR(rightEye)
          const ear = (leftEAR + rightEAR) / 2
          const prev = blinkStateRef.current.lastEAR
          if (prev > 0.24 && ear < 0.18) {
            blinkStateRef.current.blinked = true
          }
          blinkStateRef.current.lastEAR = ear
        }
      } catch {
        // ignore frame errors
      }

      requestAnimationFrame(analyze)
    }

    requestAnimationFrame(analyze)
  }

  const stopFaceApiAnalysis = () => {
    analyzingRef.current = false
  }

  const evaluateMotion = (): { passed: boolean; message?: string } => {
    const sawLeft = leftDetected
    const sawRight = rightDetected
    const sawNod = nodDetected

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

    if (!faceApiReady || !modelsLoaded) {
      setFaceApiError("Modelle werden noch geladen. Bitte warten Sie, bis \"Aufnahme starten\" aktiviert ist.")
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
          setMotionError(evaluation.message || "Bewegung nicht erkannt. Bitte erneut versuchen.")
          chunksRef.current = []
          setCapturedFile(null)
          setIsPreviewReady(false)
          await startStream()
          setTimeout(() => {
            setLeftDetected(false)
            setRightDetected(false)
            setNodDetected(false)
          }, 400)
          return
        }

        const mime = selectedMimeRef.current || (recorderRef.current && (recorderRef.current as any).mimeType) || "video/webm"
        const ext = mime.includes("mp4") ? ".mp4" : mime.includes("webm") ? ".webm" : ".webm"
        const blob = new Blob(chunksRef.current, { type: mime })
        const file = new File([blob], `selfie-${Date.now()}${ext}`, { type: mime })

        setCapturedFile(file)
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
        setIsPreviewReady(true)
        stopStream()
        setMotionError(null)
      }

      recorder.start()
      setIsRecording(true)
      setRemainingSec(MAX_DURATION_SEC)
      setAcceptedInstructions(false)
      setMotionError(null)

      setLeftDetected(false)
      setRightDetected(false)
      setNodDetected(false)

      if (faceApiReady) startFaceApiAnalysis()

      let left = MAX_DURATION_SEC
      timerRef.current = window.setInterval(() => {
        left -= 1
        setRemainingSec(left)
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
      setFaceApiError(`Aufnahme konnte nicht gestartet werden: ${e?.message || String(e)}`)
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
    setIsRecording(false)
    stopFaceApiAnalysis()
  }

  const retake = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setCapturedFile(null)
    setIsPreviewReady(false)
    setConfirmed(false)
    setAcceptedInstructions(false)
    setAutoSaveCountdown(null)
    setRemainingSec(MAX_DURATION_SEC)
    if (autoSaveTimerRef.current) {
      window.clearInterval(autoSaveTimerRef.current)
      autoSaveTimerRef.current = null
    }
    setMotionError(null)
    stopFaceApiAnalysis()
    startStream()
  }

  const confirmAndSave = () => {
    if (!capturedFile) return
    onCapture(capturedFile)
    setConfirmed(true)
    setAutoSaveCountdown(null)
  }

  const progressCount = Number(leftDetected) + Number(rightDetected) + Number(nodDetected)

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
        <div className={`rounded-lg border ${error || motionError ? "border-destructive" : "border-input"} p-4 bg-muted/30`}>
          {!hasCamera && (
            <p className="text-sm text-destructive">Keine Kamera erkannt. Bitte erlauben Sie den Kamerazugriff.</p>
          )}

          {!recorderSupported && (
            <p className="text-sm text-destructive">Aufnahme im Browser nicht unterstützt. Bitte verwenden Sie einen aktuellen Browser.</p>
          )}

          {faceApiError && (
            <p className="text-xs text-destructive whitespace-pre-line">{faceApiError}</p>
          )}

          {!modelsLoaded && mediaStreamRef.current && (
            <p className="text-xs text-muted-foreground">Lade Gesichtsmodelle…</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 items-start">
            <div className="relative aspect-video bg-black/80 rounded-md overflow-hidden">
              <video ref={videoRef} className="w-full h-full" playsInline muted />

              {!capturedFile && (
                <div className="absolute inset-0 pointer-events-none flex items-start justify-center p-4">
                  <div className="bg-background/60 backdrop-blur-sm rounded px-3 py-2 text-sm font-medium">
                    {isRecording ? (
                      <div>Bitte: Schauen Sie nach links, dann nach rechts und nicken Sie kurz.</div>
                    ) : (
                      <div>Bereit? Aktivieren Sie die Kamera und starten Sie die Aufnahme.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {!isRecording && !capturedFile && (
                <>
                  <Button type="button" onClick={startStream} className="w-full" variant="outline">
                    <Camera className="w-4 h-4 mr-2" /> Kamera aktivieren
                  </Button>

                  {mediaStreamRef.current && (
                    <Button
                      type="button"
                      onClick={startRecording}
                      className="w-full"
                      disabled={!modelsLoaded || !faceApiReady || !recorderSupported}
                      aria-label="Nächster Schritt"
                    >
                      <Video className="w-4 h-4 mr-2" /> Aufnahme starten
                    </Button>
                  )}
                </>
              )}

              {isRecording && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-foreground">
                    <span>Aufnahme läuft…</span>
                    <span className="font-medium">00:0{remainingSec}</span>
                  </div>
                  <Button type="button" onClick={stopRecording} className="w-full" variant="destructive">
                    <StopCircle className="w-4 h-4 mr-2" /> Aufnahme stoppen
                  </Button>

                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${leftDetected ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}`}>
                        {leftDetected ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs">L</span>}
                      </div>
                      <div className="text-xs mt-1">Links</div>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${nodDetected ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}`}>
                        {nodDetected ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs">N</span>}
                      </div>
                      <div className="text-xs mt-1">Nicken</div>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${rightDetected ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}`}>
                        {rightDetected ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs">R</span>}
                      </div>
                      <div className="text-xs mt-1">Rechts</div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="w-full h-2 bg-muted rounded overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${(progressCount / 3) * 100}%` }} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Fortschritt: {progressCount}/3</div>
                  </div>
                </div>
              )}

              {capturedFile && isPreviewReady && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Video bereit zur Überprüfung: {capturedFile.name}</span>
                  </div>

                  <div className="aspect-video bg-black/80 rounded-md overflow-hidden">
                    <video className="w-full h-full" src={previewUrl ?? URL.createObjectURL(capturedFile)} controls />
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
                    <Button type="button" variant="outline" onClick={retake} className="bg-transparent flex-1">
                      Neu aufnehmen
                    </Button>

                    {confirmed ? (
                      <Button type="button" variant="secondary" className="flex-1" disabled>
                        Gespeichert
                      </Button>
                    ) : (
                      <Button type="button" variant="secondary" onClick={confirmAndSave} className="flex-1" disabled={!acceptedInstructions}>
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

                  {motionError && <p className="text-xs text-destructive">{motionError}</p>}
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
