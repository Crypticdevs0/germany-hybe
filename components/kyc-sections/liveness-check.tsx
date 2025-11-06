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

// Modern liveness using TensorFlow face-landmarks-detection (MediaPipe FaceMesh runtime)
export default function LivenessCheckSection({ selfieVideo, error, onCapture }: LivenessCheckSectionProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const detectorRef = useRef<any | null>(null)
  const analyzingRef = useRef(false)
  const lastAnalyzeRef = useRef(0)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [acceptedInstructions, setAcceptedInstructions] = useState(false)

  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [motionMessage, setMotionMessage] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [remaining, setRemaining] = useState<number>(5)
  const [recorderSupported, setRecorderSupported] = useState(true)

  const INDICATOR = useRef({ left: false, right: false, nod: false })

  const MAX_DURATION_SEC = 5
  const ANALYZE_INTERVAL_MS = 120

  useEffect(() => {
    // preload detector in background
    (async () => await ensureDetector())()
    return () => cleanup()
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

  const ensureDetector = async () => {
    if (detectorRef.current) return
    try {
      setModelsLoading(true)
      // load tfjs webgl backend and the face-landmarks-detection model dynamically
      const tfBackend = await import("@tensorflow/tfjs-backend-webgl")
      const facemesh = await import("@tensorflow-models/face-landmarks-detection")
      // set backend
      if (tfBackend && tfBackend.setWebGLContext) {
        // some builds export differently; try standard ready
      }
      const tf = await import("@tensorflow/tfjs-core")
      try {
        await (tf as any).setBackend?.("webgl")
        await (tf as any).ready()
      } catch {
        // fallback: continue even if backend set fails
      }

      // create detector using MediaPipe FaceMesh (fast and accurate)
      const detector = await (facemesh as any).createDetector((facemesh as any).SupportedModels.MediaPipeFaceMesh, {
        runtime: "tfjs",
        maxFaces: 1,
        refineLandmarks: true,
      })
      detectorRef.current = detector
      setModelsLoaded(true)
      setModelsLoading(false)
    } catch (e: any) {
      console.error("liveness: failed to load detector", e)
      setModelsLoading(false)
      setMotionMessage("Modelle konnten nicht geladen werden. Bitte prüfen Sie Ihre Verbindung.")
    }
  }

  const startStream = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 }, audio: true })
      mediaStreamRef.current = s
      if (videoRef.current) {
        videoRef.current.srcObject = s
        await videoRef.current.play()
      }
      // ensure detector is ready
      await ensureDetector()
    } catch (e: any) {
      console.error("liveness: startStream", e)
      setMotionMessage("Kamera nicht verfügbar oder Zugriff verweigert.")
    }
  }

  const stopStream = () => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
    mediaStreamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    stopAnalysis()
  }

  const startAnalysis = () => {
    if (!detectorRef.current || !videoRef.current) return
    INDICATOR.current = { left: false, right: false, nod: false }
    analyzingRef.current = true

    const analyze = async () => {
      if (!analyzingRef.current) return
      const now = performance.now()
      if (now - lastAnalyzeRef.current < ANALYZE_INTERVAL_MS) {
        requestAnimationFrame(analyze)
        return
      }
      lastAnalyzeRef.current = now

      try {
        const faces = await detectorRef.current.estimateFaces(videoRef.current, { flipHorizontal: true })
        if (!faces || faces.length === 0) {
          setMotionMessage("Gesicht nicht erkannt. Bitte halten Sie Ihr Gesicht vor die Kamera.")
          requestAnimationFrame(analyze)
          return
        }

        const f = faces[0]
        // try to choose a nose-like keypoint
        const kp = (f.keypoints || []).find((k: any) => k.name && k.name.toLowerCase().includes("nose")) || f.keypoints?.[1]
        const bbox = f.boundingBox || f.box || null
        if (!kp || !bbox) {
          requestAnimationFrame(analyze)
          return
        }

        const faceCenterX = bbox.xMin + (bbox.xMax - bbox.xMin) / 2
        const faceWidth = Math.max(1, bbox.xMax - bbox.xMin)
        const yaw = (kp.x - faceCenterX) / faceWidth

        // baseline for pitch: compare nose y to top/bottom
        const faceCenterY = bbox.yMin + (bbox.yMax - bbox.yMin) / 2
        const pitch = (kp.y - faceCenterY) / Math.max(1, bbox.yMax - bbox.yMin)

        if (yaw < -0.12) INDICATOR.current.left = true
        if (yaw > 0.12) INDICATOR.current.right = true
        if (pitch > 0.18) INDICATOR.current.nod = true

        const missing: string[] = []
        if (!INDICATOR.current.left) missing.push("links schauen")
        if (!INDICATOR.current.right) missing.push("rechts schauen")
        if (!INDICATOR.current.nod) missing.push("nicken")

        if (missing.length === 0) setMotionMessage(null)
        else setMotionMessage(`Bitte noch: ${missing.join(", ")}`)
      } catch (e: any) {
        console.warn("liveness analyze error", e)
      }

      requestAnimationFrame(analyze)
    }

    requestAnimationFrame(analyze)
  }

  const stopAnalysis = () => {
    analyzingRef.current = false
  }

  const chooseMime = (): string | undefined => {
    const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
    for (const c of candidates) if ((typeof MediaRecorder !== "undefined") && MediaRecorder.isTypeSupported(c)) return c
    return undefined
  }

  const evaluateMotion = (): { passed: boolean; message?: string } => {
    const { left, right, nod } = INDICATOR.current
    if (left && right && nod) return { passed: true }
    const missing: string[] = []
    if (!left) missing.push("nach links schauen")
    if (!right) missing.push("nach rechts schauen")
    if (!nod) missing.push("nicken")
    return { passed: false, message: `Bitte führen Sie folgende Aktionen aus: ${missing.join(", ")}.` }
  }

  const startRecording = async () => {
    if (!mediaStreamRef.current) await startStream()
    const stream = mediaStreamRef.current
    if (!stream) return

    if (!detectorRef.current || !modelsLoaded) {
      setMotionMessage("Modelle werden noch geladen. Bitte warten.")
      return
    }

    if (typeof MediaRecorder === "undefined") {
      setRecorderSupported(false)
      return
    }

    const mime = chooseMime()
    chunksRef.current = []
    try {
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      recorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stopAnalysis()
        const evaluation = evaluateMotion()
        if (!evaluation.passed) {
          setMotionMessage(evaluation.message || "Bewegung nicht erkannt. Bitte erneut versuchen.")
          chunksRef.current = []
          setCapturedFile(null)
          setPreviewUrl((p) => {
            if (p) URL.revokeObjectURL(p)
            return null
          })
          await startStream()
          setTimeout(() => { INDICATOR.current = { left: false, right: false, nod: false } }, 400)
          setIsRecording(false)
          return
        }

        const blob = new Blob(chunksRef.current, { type: mime || "video/webm" })
        const ext = (mime && mime.includes("mp4")) ? ".mp4" : ".webm"
        const file = new File([blob], `selfie-${Date.now()}${ext}`, { type: mime || "video/webm" })
        setCapturedFile(file)
        setPreviewUrl((p) => { if (p) URL.revokeObjectURL(p); return URL.createObjectURL(file) })
        setIsRecording(false)
        stopStream()
        setMotionMessage(null)
      }

      recorder.start()
      setIsRecording(true)
      setMotionMessage(null)
      INDICATOR.current = { left: false, right: false, nod: false }
      if (modelsLoaded) startAnalysis()

      let left = MAX_DURATION_SEC
      setRemaining(left)
      const t = window.setInterval(() => {
        left -= 1
        setRemaining(left)
        if (left <= 0) {
          if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop()
          window.clearInterval(t)
        }
      }, 1000)
    } catch (e: any) {
      console.error("liveness startRecording", e)
      setRecorderSupported(false)
      setMotionMessage("Aufnahme konnte nicht gestartet werden.")
    }
  }

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop()
    setIsRecording(false)
    stopAnalysis()
  }

  const retake = () => {
    setPreviewUrl((p) => { if (p) URL.revokeObjectURL(p); return null })
    setCapturedFile(null)
    setConfirmed(false)
    setAcceptedInstructions(false)
    INDICATOR.current = { left: false, right: false, nod: false }
    setMotionMessage(null)
    stopAnalysis()
    startStream()
  }

  const confirmAndSave = () => {
    if (!capturedFile) return
    onCapture(capturedFile)
    setConfirmed(true)
  }

  const cleanup = () => {
    stopRecording()
    stopStream()
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    stopAnalysis()
    try { detectorRef.current?.dispose?.() } catch {}
  }

  return (
    <div className="space-y-4">
      <Alert className="border-primary bg-primary/10">
        <Camera className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm text-foreground">
          Nehmen Sie ein kurzes Selfie-Video auf und führen Sie die angezeigten Bewegungen aus.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label>Selfie-Video *</Label>
        <div className={`rounded-lg border ${error || motionMessage ? "border-destructive" : "border-input"} p-4 bg-muted/30`}>
          <div aria-live="polite" className="sr-only">
            {modelsLoading ? "Modelle werden geladen" : modelsLoaded ? "Modelle geladen" : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 items-start">
            <div className="relative aspect-video bg-black/80 rounded-md overflow-hidden focus:outline-none" tabIndex={-1}>
              <video ref={videoRef} className="w-full h-full" playsInline muted aria-hidden={!!capturedFile} />
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
                  <Button type="button" onClick={startStream} className="w-full" variant="outline" aria-label="Kamera aktivieren">
                    <Camera className="w-4 h-4 mr-2" /> Kamera aktivieren
                  </Button>

                  {mediaStreamRef.current && (
                    <Button type="button" onClick={startRecording} className="w-full" aria-label="Aufnahme starten">
                      <Video className="w-4 h-4 mr-2" /> Aufnahme starten
                    </Button>
                  )}

                  {!recorderSupported && (
                    <p className="text-sm text-destructive">Aufnahme im Browser nicht unterstützt. Bitte verwenden Sie einen aktuellen Browser.</p>
                  )}
                </>
              )}

              {isRecording && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-foreground">
                    <span>Aufnahme läuft…</span>
                    <span className="font-medium">00:0{remaining}</span>
                  </div>
                  <Button type="button" onClick={stopRecording} className="w-full" variant="destructive" aria-label="Aufnahme stoppen">
                    <StopCircle className="w-4 h-4 mr-2" /> Aufnahme stoppen
                  </Button>

                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${INDICATOR.current.left ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}`}>
                        {INDICATOR.current.left ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs">L</span>}
                      </div>
                      <div className="text-xs mt-1">Links</div>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${INDICATOR.current.nod ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}`}>
                        {INDICATOR.current.nod ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs">N</span>}
                      </div>
                      <div className="text-xs mt-1">Nicken</div>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${INDICATOR.current.right ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}`}>
                        {INDICATOR.current.right ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs">R</span>}
                      </div>
                      <div className="text-xs mt-1">Rechts</div>
                    </div>
                  </div>

                  {motionMessage && <p className="text-sm text-muted-foreground mt-2" aria-live="polite">{motionMessage}</p>}
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

                  {!confirmed && (
                    <p className="text-xs text-muted-foreground">Hinweis: Ihr Video wird automatisch gespeichert, sobald Sie die Anweisungen bestätigen.</p>
                  )}

                  {motionMessage && <p className="text-xs text-destructive">{motionMessage}</p>}
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
