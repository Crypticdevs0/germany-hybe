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

// Lightweight fallback liveness section without TensorFlow/MediaPipe
// Allows users to upload or record a short video using the browser MediaRecorder
export default function LivenessCheckSection({ selfieVideo, error, onCapture }: LivenessCheckSectionProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [acceptedInstructions, setAcceptedInstructions] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [remaining, setRemaining] = useState<number>(5)
  const [recorderSupported, setRecorderSupported] = useState(true)
  const [motionMessage, setMotionMessage] = useState<string | null>(null)

  const MAX_DURATION_SEC = 5

  useEffect(() => {
    if (selfieVideo && !capturedFile) {
      setCapturedFile(selfieVideo)
      const url = URL.createObjectURL(selfieVideo)
      setPreviewUrl(url)
      setConfirmed(true)
    }

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      stopStream()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfieVideo])

  const startStream = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 }, audio: true })
      mediaStreamRef.current = s
      if (videoRef.current) {
        videoRef.current.srcObject = s
        await videoRef.current.play()
      }
    } catch (e: any) {
      console.error("liveness: startStream", e)
      setMotionMessage("Kamera nicht verfügbar oder Zugriff verweigert.")
    }
  }

  const stopStream = () => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
    mediaStreamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }

  const chooseMime = (): string | undefined => {
    const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
    for (const c of candidates) if ((typeof MediaRecorder !== "undefined") && MediaRecorder.isTypeSupported(c)) return c
    return undefined
  }

  const startRecording = async () => {
    if (!mediaStreamRef.current) await startStream()
    const stream = mediaStreamRef.current
    if (!stream) return

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
  }

  const handleFileInput = (f?: File) => {
    if (!f) return
    setCapturedFile(f)
    setPreviewUrl((p) => { if (p) URL.revokeObjectURL(p); return URL.createObjectURL(f) })
    setConfirmed(false)
  }

  const retake = () => {
    setPreviewUrl((p) => { if (p) URL.revokeObjectURL(p); return null })
    setCapturedFile(null)
    setConfirmed(false)
    setAcceptedInstructions(false)
    setMotionMessage(null)
    stopStream()
  }

  const confirmAndSave = () => {
    if (!capturedFile) return
    onCapture(capturedFile)
    setConfirmed(true)
  }

  return (
    <div className="space-y-4">
      <Alert className="border-primary bg-primary/10">
        <Camera className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm text-foreground">
          Laden Sie ein kurzes Selfie-Video hoch oder nehmen Sie eines mit Ihrer Kamera auf.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label>Selfie-Video *</Label>
        <div className={`rounded-lg border ${error || motionMessage ? "border-destructive" : "border-input"} p-4 bg-muted/30`}>
          <div className="grid gap-4 sm:grid-cols-2 items-start">
            <div className="relative aspect-video bg-black/80 rounded-md overflow-hidden focus:outline-none" tabIndex={-1}>
              <video ref={videoRef} className="w-full h-full" playsInline muted aria-hidden={!!capturedFile} />

              {!capturedFile && (
                <div className="absolute inset-0 pointer-events-none flex items-start justify-center p-4">
                  <div className="bg-background/60 backdrop-blur-sm rounded px-3 py-2 text-sm font-medium">
                    {isRecording ? (
                      <div>Aufnahme läuft…</div>
                    ) : (
                      <div>Bereit? Aktivieren Sie die Kamera oder laden Sie ein Video hoch.</div>
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

                  <div className="mt-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="file" accept="video/*" onChange={(e) => handleFileInput(e.target.files?.[0])} className="hidden" />
                      <Button type="button" variant="outline" className="w-full">Video hochladen</Button>
                    </label>
                  </div>

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
