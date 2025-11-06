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

  // NEW: store captured file locally until user confirms saving
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [confirmed, setConfirmed] = useState<boolean>(false)
  const [acceptedInstructions, setAcceptedInstructions] = useState<boolean>(false)
  const [autoSaveCountdown, setAutoSaveCountdown] = useState<number | null>(null)

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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // if parent already provided video (e.g., restoring state), keep preview
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
    // start auto-save countdown when user accepts instructions and a captured file is present
    if (acceptedInstructions && capturedFile && !confirmed) {
      setAutoSaveCountdown(AUTO_SAVE_DELAY_SEC)
      let left = AUTO_SAVE_DELAY_SEC
      autoSaveTimerRef.current = window.setInterval(() => {
        left -= 1
        setAutoSaveCountdown(left > 0 ? left : 0)
        if (left <= 0) {
          // perform auto-save
          confirmAndSave()
          if (autoSaveTimerRef.current) {
            window.clearInterval(autoSaveTimerRef.current)
            autoSaveTimerRef.current = null
          }
        }
      }, 1000)
    } else {
      // if unchecked or no file, clear any running auto-save timer
      if (autoSaveTimerRef.current) {
        window.clearInterval(autoSaveTimerRef.current)
        autoSaveTimerRef.current = null
      }
      setAutoSaveCountdown(null)
    }
    // cleanup when acceptedInstructions/capturedFile changes
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
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
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
        const blob = new Blob(chunksRef.current, { type: "video/webm" })
        const file = new File([blob], `selfie-${Date.now()}.webm`, { type: "video/webm" })

        // store locally and show preview, DO NOT call onCapture until user confirms
        setCapturedFile(file)
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
        setIsPreviewReady(true)
        // stop camera preview when preview ready to reduce resource usage
        stopStream()
      }

      recorder.start()
      setIsRecording(true)
      setRemainingSec(MAX_DURATION_SEC)
      setAcceptedInstructions(false)

      // countdown & auto-stop
      let left = MAX_DURATION_SEC
      timerRef.current = window.setInterval(() => {
        left -= 1
        setRemainingSec(left)
        if (left <= 0) {
          stopRecording()
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
  }

  const retake = () => {
    // revoke previous preview to free memory
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
    // clear any pending auto-save timer
    if (autoSaveTimerRef.current) {
      window.clearInterval(autoSaveTimerRef.current)
      autoSaveTimerRef.current = null
    }
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
          Nehmen Sie ein 3–5 Sekunden langes Selfie-Video auf. Achten Sie auf gute Beleuchtung und schauen Sie in die Kamera.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label>Selfie-Video *</Label>
        <div className={`rounded-lg border ${error ? "border-destructive" : "border-input"} p-4 bg-muted/30`}>
          {!hasCamera && (
            <p className="text-sm text-destructive">Keine Kamera erkannt. Bitte erlauben Sie den Kamerazugriff.</p>
          )}

          {!recorderSupported && (
            <p className="text-sm text-destructive">Aufnahme im Browser nicht unterstützt. Bitte verwenden Sie einen aktuellen Browser.</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 items-start">
            <div className="aspect-video bg-black/80 rounded-md overflow-hidden">
              <video ref={videoRef} className="w-full h-full" playsInline muted />
            </div>

            <div className="space-y-3">
              {/* Controls when not recording and no captured preview */}
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

              {/* Recording state */}
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

              {/* Preview and confirmation flow */}
              {capturedFile && isPreviewReady && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Video bereit zur Überprüfung: {capturedFile.name}</span>
                  </div>

                  <div className="aspect-video bg-black/80 rounded-md overflow-hidden">
                    <video className="w-full h-full" src={previewUrl ?? URL.createObjectURL(capturedFile)} controls />
                  </div>

                  {/* Instructions checklist that user must accept before saving */}
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Bitte folgende Anweisungen befolgen:</div>
                    <ul className="list-disc list-inside text-sm">
                      <li>Gute Beleuchtung</li>
                      <li>Gesicht zentriert in der Kamera</li>
                      <li>Blick direkt in die Kamera</li>
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

                  {/* Auto-save status */}
                  {autoSaveCountdown !== null && !confirmed && (
                    <p className="text-xs text-muted-foreground">Automatisches Speichern in {autoSaveCountdown}s…</p>
                  )}

                  {!confirmed && (
                    <p className="text-xs text-muted-foreground">Hinweis: Ihr Video wird automatisch gespeichert, sobald Sie die Anweisungen bestätigen.</p>
                  )}
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
