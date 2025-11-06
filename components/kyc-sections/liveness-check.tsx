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

  const MAX_DURATION_SEC = 5
  const AUTO_SAVE_DELAY_SEC = 3

  // Motion analysis refs
  const analysisRef = useRef<{
    running: boolean
    prevGray: Uint8ClampedArray | null
    minShiftX: number
    maxShiftX: number
    maxShiftY: number
    frames: number
    canvas: HTMLCanvasElement | null
    ctx: CanvasRenderingContext2D | null
  }>({ running: false, prevGray: null, minShiftX: 0, maxShiftX: 0, maxShiftY: 0, frames: 0, canvas: null, ctx: null })

  useEffect(() => {
    return () => {
      stopRecording()
      stopStream()
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      if (autoSaveTimerRef.current) {
        window.clearInterval(autoSaveTimerRef.current)
        autoSaveTimerRef.current = null
      }
      stopAnalysis()
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

  const chooseMimeType = (): string | undefined => {
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "",
    ]

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
    } catch {
      setHasCamera(false)
    }
  }

  const stopStream = () => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
    mediaStreamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const startAnalysis = () => {
    stopAnalysis()
    const canvas = document.createElement("canvas")
    const width = 160
    const height = 120
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    analysisRef.current = {
      running: true,
      prevGray: null,
      minShiftX: 0,
      maxShiftX: 0,
      maxShiftY: 0,
      frames: 0,
      canvas,
      ctx,
    }

    const analyze = () => {
      if (!analysisRef.current.running) return
      const v = videoRef.current
      if (!v || v.readyState < 2) {
        requestAnimationFrame(analyze)
        return
      }
      const { ctx } = analysisRef.current
      if (!ctx) return
      try {
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height)
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const gray = new Uint8ClampedArray(canvas.width * canvas.height)
        for (let i = 0, j = 0; i < img.data.length; i += 4, j++) {
          // luminance
          gray[j] = (img.data[i] * 0.3 + img.data[i + 1] * 0.59 + img.data[i + 2] * 0.11) | 0
        }

        const prev = analysisRef.current.prevGray
        if (prev) {
          let sum = 0
          let sumX = 0
          let sumY = 0
          let maxDiff = 0
          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              const idx = y * canvas.width + x
              const d = Math.abs(gray[idx] - prev[idx])
              if (d > 20) {
                sum += d
                sumX += x * d
                sumY += y * d
                if (d > maxDiff) maxDiff = d
              }
            }
          }

          if (sum > 1000) {
            const cx = sumX / sum
            const cy = sumY / sum
            const nx = (cx - canvas.width / 2) / (canvas.width / 2) // -1..1
            const ny = (cy - canvas.height / 2) / (canvas.height / 2)
            if (nx < analysisRef.current.minShiftX) analysisRef.current.minShiftX = nx
            if (nx > analysisRef.current.maxShiftX) analysisRef.current.maxShiftX = nx
            if (Math.abs(ny) > Math.abs(analysisRef.current.maxShiftY)) analysisRef.current.maxShiftY = ny
            analysisRef.current.frames += 1
          }
        }

        analysisRef.current.prevGray = gray
      } catch (err) {
        // ignore errors during analysis
      }
      requestAnimationFrame(analyze)
    }

    requestAnimationFrame(analyze)
  }

  const stopAnalysis = () => {
    analysisRef.current.running = false
    analysisRef.current.prevGray = null
    if (analysisRef.current.canvas) {
      analysisRef.current.canvas.width = 0
      analysisRef.current.canvas.height = 0
    }
    analysisRef.current.canvas = null
    analysisRef.current.ctx = null
  }

  const evaluateMotion = (): { passed: boolean; message?: string } => {
    // require noticeable horizontal movement (left and right) and some vertical nod
    const minX = analysisRef.current.minShiftX
    const maxX = analysisRef.current.maxShiftX
    const maxY = Math.abs(analysisRef.current.maxShiftY)

    const HORIZ_THRESHOLD = 0.18 // 18% of frame width
    const VERT_THRESHOLD = 0.12 // 12% of frame height

    const sawLeft = minX < -HORIZ_THRESHOLD
    const sawRight = maxX > HORIZ_THRESHOLD
    const sawNod = maxY > VERT_THRESHOLD

    if (sawLeft && sawRight && sawNod) {
      return { passed: true }
    }

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

    if (typeof MediaRecorder === "undefined") {
      setRecorderSupported(false)
      return
    }

    chunksRef.current = []
    const mimeType = chooseMimeType()

    try {
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      recorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stopAnalysis()
        const evaluation = evaluateMotion()
        if (!evaluation.passed) {
          setMotionError(evaluation.message || "Bewegung nicht erkannt. Bitte erneut versuchen.")
          // clear captured since motion failed
          chunksRef.current = []
          setCapturedFile(null)
          setIsPreviewReady(false)
          // reopen stream for retry
          await startStream()
          return
        }

        const blob = new Blob(chunksRef.current, { type: "video/webm" })
        const file = new File([blob], `selfie-${Date.now()}.webm`, { type: "video/webm" })

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

      // start motion analysis in parallel
      startAnalysis()

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
    } catch {
      setRecorderSupported(false)
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
    stopAnalysis()
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
    stopAnalysis()
    startStream()
  }

  const confirmAndSave = () => {
    if (!capturedFile) return
    onCapture(capturedFile)
    setConfirmed(true)
    setAutoSaveCountdown(null)
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
        <div className={`rounded-lg border ${error || motionError ? "border-destructive" : "border-input"} p-4 bg-muted/30`}>
          {!hasCamera && (
            <p className="text-sm text-destructive">Keine Kamera erkannt. Bitte erlauben Sie den Kamerazugriff.</p>
          )}

          {!recorderSupported && (
            <p className="text-sm text-destructive">Aufnahme im Browser nicht unterstützt. Bitte verwenden Sie einen aktuellen Browser.</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 items-start">
            <div className="relative aspect-video bg-black/80 rounded-md overflow-hidden">
              <video ref={videoRef} className="w-full h-full" playsInline muted />

              {/* Instruction overlay during live stream / recording */}
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
                    <Button type="button" onClick={startRecording} className="w-full">
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
