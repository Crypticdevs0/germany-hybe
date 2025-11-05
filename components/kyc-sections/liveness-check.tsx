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

  const [hasCamera, setHasCamera] = useState<boolean>(true)
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [isPreviewReady, setIsPreviewReady] = useState<boolean>(false)

  useEffect(() => {
    return () => {
      stopRecording()
      stopStream()
    }
  }, [])

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
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

    chunksRef.current = []
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9,opus" })
    recorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" })
      const file = new File([blob], `selfie-${Date.now()}.webm`, { type: "video/webm" })
      onCapture(file)
      setIsPreviewReady(true)
    }

    recorder.start()
    setIsRecording(true)
  }

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop()
    }
    setIsRecording(false)
  }

  const retake = () => {
    onCapture(null)
    setIsPreviewReady(false)
    startStream()
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

          <div className="grid gap-4 sm:grid-cols-2 items-start">
            <div className="aspect-video bg-black/80 rounded-md overflow-hidden">
              <video ref={videoRef} className="w-full h-full" playsInline muted />
            </div>

            <div className="space-y-3">
              {!isRecording && !selfieVideo && (
                <Button type="button" onClick={startStream} className="w-full" variant="outline">
                  <Camera className="w-4 h-4 mr-2" /> Kamera aktivieren
                </Button>
              )}

              {!isRecording && mediaStreamRef.current && !selfieVideo && (
                <Button type="button" onClick={startRecording} className="w-full">
                  <Video className="w-4 h-4 mr-2" /> Aufnahme starten
                </Button>
              )}

              {isRecording && (
                <Button type="button" onClick={stopRecording} className="w-full" variant="destructive">
                  <StopCircle className="w-4 h-4 mr-2" /> Aufnahme stoppen
                </Button>
              )}

              {selfieVideo && isPreviewReady && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm">Video erfasst: {selfieVideo.name}</span>
                  </div>
                  <div className="aspect-video bg-black/80 rounded-md overflow-hidden">
                    <video className="w-full h-full" src={URL.createObjectURL(selfieVideo)} controls />
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={retake} className="bg-transparent flex-1">
                      Neu aufnehmen
                    </Button>
                    <Button type="button" variant="secondary" onClick={stopStream} className="flex-1">
                      Kamera beenden
                    </Button>
                  </div>
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
