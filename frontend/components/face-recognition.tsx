"use client"

import { useEffect, useRef, useState } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Camera, CheckCircle2, User, Loader2 } from "lucide-react"
import * as faceapi from "face-api.js"

type FaceRecognitionPhase = "loading" | "ready" | "capturing" | "processing" | "success" | "error"

interface FaceRecognitionProps {
  mode: "register" | "verify"
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
}

export function FaceRecognition({ mode, onSuccess, onError }: FaceRecognitionProps) {
  const [phase, setPhase] = useState<FaceRecognitionPhase>("loading")
  const [message, setMessage] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [modelsLoaded, setModelsLoaded] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setMessage("Loading face recognition models...")

        // Load models from CDN (you can host these locally for production)
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights'),
          faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights'),
          faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights'),
        ])

        setModelsLoaded(true)
        setPhase("ready")
        setMessage("Face recognition ready. Click 'Start Camera' to begin.")
      } catch (err) {
        console.error("Failed to load face recognition models:", err)
        setError("Failed to load face recognition models. Please refresh and try again.")
        setPhase("error")
        if (onError) onError("Failed to load face recognition models")
      }
    }

    loadModels()
  }, [onError])

  const startCamera = async () => {
    try {
      setPhase("capturing")
      setMessage("Starting camera...")
      setError("")

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" }
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setMessage("Camera started. Position your face in the frame and click 'Capture Face'.")
      }
    } catch (err) {
      console.error("Camera access failed:", err)
      setError("Camera access denied. Please allow camera permissions and try again.")
      setPhase("error")
      if (onError) onError("Camera access denied")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const captureFace = async () => {
    if (!videoRef.current || !modelsLoaded) return

    try {
      setPhase("processing")
      setMessage("Detecting and analyzing face...")

      // Detect face
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        setError("No face detected. Please ensure your face is clearly visible and try again.")
        setPhase("capturing")
        return
      }

      // Draw detection box on canvas for visual feedback
      if (canvasRef.current) {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (ctx) {
          canvas.width = videoRef.current.videoWidth
          canvas.height = videoRef.current.videoHeight

          // Draw the video frame
          ctx.drawImage(videoRef.current, 0, 0)

          // Draw detection box
          const box = detection.detection.box
          ctx.strokeStyle = '#00ff00'
          ctx.lineWidth = 3
          ctx.strokeRect(box.x, box.y, box.width, box.height)

          // Draw landmarks
          faceapi.draw.drawFaceLandmarks(canvas, detection)
        }
      }

      setMessage("Face detected successfully. Processing...")

      if (mode === "register") {
        // Register face
        await api.registerFace(Array.from(detection.descriptor))
        setPhase("success")
        setMessage("Face registered successfully!")
        if (onSuccess) onSuccess({ registered: true })
      } else {
        // Verify face
        const result = await api.verifyFace(Array.from(detection.descriptor))

        if (result.verified) {
          setPhase("success")
          setMessage(`Face verified! Confidence: ${(result.confidence * 100).toFixed(1)}%`)
          if (onSuccess) onSuccess(result)
        } else {
          setError(`Face verification failed. Confidence too low: ${(result.confidence * 100).toFixed(1)}%`)
          setPhase("capturing")
          if (onError) onError("Face verification failed")
        }
      }

    } catch (err: any) {
      console.error("Face processing failed:", err)
      setError("Face processing failed. Please try again.")
      setPhase("capturing")
      if (onError) onError(err.message || "Face processing failed")
    }
  }

  const reset = () => {
    setPhase("ready")
    setMessage("Face recognition ready. Click 'Start Camera' to begin.")
    setError("")
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  if (phase === "loading") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground text-center">{message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (phase === "error") {
    return (
      <Card className="w-full max-w-md mx-auto border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Face Recognition Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive mb-4">{error}</p>
          <Button onClick={reset} variant="outline" className="w-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (phase === "success") {
    return (
      <Card className="w-full max-w-md mx-auto border-green-500/50 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            {mode === "register" ? "Face Registered" : "Face Verified"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-700 mb-4">{message}</p>
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full rounded-lg border"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {mode === "register" ? "Register Face" : "Verify Face"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <div className="text-sm text-center text-muted-foreground">
            {message}
          </div>
        )}

        {error && (
          <div className="text-sm text-center text-destructive bg-destructive/10 p-2 rounded">
            {error}
          </div>
        )}

        <div className="relative">
          <video
            ref={videoRef}
            className="w-full rounded-lg border bg-black"
            style={{ maxWidth: '100%', height: 'auto' }}
            muted
            playsInline
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>

        <div className="flex gap-2">
          {phase === "ready" && (
            <Button onClick={startCamera} className="flex-1">
              <Camera className="h-4 w-4 mr-2" />
              Start Camera
            </Button>
          )}

          {phase === "capturing" && (
            <>
              <Button onClick={captureFace} className="flex-1">
                <User className="h-4 w-4 mr-2" />
                Capture Face
              </Button>
              <Button onClick={stopCamera} variant="outline">
                Stop
              </Button>
            </>
          )}

          {phase === "processing" && (
            <Button disabled className="flex-1">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </Button>
          )}
        </div>

        {phase !== "ready" && (
          <Button onClick={reset} variant="outline" className="w-full">
            Reset
          </Button>
        )}
      </CardContent>
    </Card>
  )
}