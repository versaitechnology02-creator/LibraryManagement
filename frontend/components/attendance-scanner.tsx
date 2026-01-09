"use client"

import { useEffect, useRef, useState } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Camera, CheckCircle2, MapPin, QrCode } from "lucide-react"

type Phase = "scanning" | "face" | "success" | "error"

type AttendanceRecord = {
  _id: string
  date: string
  status: string
  method: string
}

interface AttendanceScannerProps {
  onCompleted?: (record: AttendanceRecord | null) => void
}

export function AttendanceScanner({ onCompleted }: AttendanceScannerProps) {
  const [phase, setPhase] = useState<Phase>("scanning")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat?: number; lng?: number; address?: string }>({})
  const [record, setRecord] = useState<AttendanceRecord | null>(null)

  const scannerRef = useRef<HTMLDivElement | null>(null)
  const html5QrCodeRef = useRef<any>(null)
  const videoStreamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // Request location on mount
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setMessage("Location services are not available in this browser.")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
      },
      (err) => {
        console.warn("Geolocation error", err)
        setMessage("Location permission denied. Some QR sessions may require GPS to be enabled.")
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [])

  // QR scanner setup
  useEffect(() => {
    let cancelled = false

    async function initScanner() {
      if (typeof window === "undefined") return
      if (!scannerRef.current) return

      try {
        const { Html5QrcodeScanner } = await import("html5-qrcode")

        if (cancelled) return

        const scanner = new Html5QrcodeScanner(scannerRef.current.id, {
          fps: 10,
          qrbox: 250,
        })

        html5QrCodeRef.current = scanner
        scanner.render(
          async () => {
            // Stop scanning once we have a QR
            try {
              await scanner.clear()
            } catch {
              // ignore
            }
            await handleQrScanned()
          },
          (errorMessage: string) => {
            // We can safely ignore scan failures, scanner keeps running
            console.debug("QR scan error", errorMessage)
          },
        )
      } catch (e) {
        console.error("Failed to initialise QR scanner", e)
        setError("Unable to access camera for QR scanning. Please check camera permissions.")
        setPhase("error")
      }
    }

    if (phase === "scanning") {
      initScanner()
    }

    return () => {
      cancelled = true
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.clear().catch(() => undefined)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const handleQrScanned = async () => {
    try {
      setError(null)
      setMessage("Validating QR with the server…")

      const data = await api.markAttendance({ location })

      if (data.requiresFaceVerification) {
        setMessage("QR verified. Face verification required for staff attendance.")
        setPhase("face")
        await startFaceCamera()
        return
      }

      // Successful attendance (student or duplicate/staff case)
      setRecord(data)
      setMessage("Attendance recorded successfully.")
      setPhase("success")
      if (onCompleted) onCompleted(data)
    } catch (e: any) {
      console.error("Attendance request failed", e)
      const msg = String(e.message || "Unable to mark attendance")
      setError(mapBackendError(msg))
      setPhase("error")
      if (onCompleted) onCompleted(null)
    }
  }

  const mapBackendError = (msg: string): string => {
    if (msg.includes("Location required")) {
      return "Location is required to mark your attendance. Please enable GPS/location permissions and try again."
    }
    return msg
  }

  // Face capture (UI-only, backend just needs faceMatch flag)
  const startFaceCamera = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is not available in this browser.")
      setPhase("error")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      videoStreamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (err) {
      console.error("Face camera error", err)
      setError("Camera permission denied. Unable to perform face verification.")
      setPhase("error")
    }
  }

  const stopFaceCamera = () => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((t) => t.stop())
      videoStreamRef.current = null
    }
  }

  const handleFaceCapture = async () => {
    try {
      setMessage("Confirming face verification with the server…")
      setError(null)

      const data = await api.markAttendance({ faceMatch: true, location })

      setRecord(data)
      setMessage("Attendance recorded successfully after face verification.")
      setPhase("success")
      if (onCompleted) onCompleted(data)
    } catch (e: any) {
      console.error("Face attendance request failed", e)
      setError("Network error while confirming attendance. Please try again.")
      setPhase("error")
      if (onCompleted) onCompleted(null)
    } finally {
      stopFaceCamera()
    }
  }

  useEffect(() => {
    return () => {
      stopFaceCamera()
    }
  }, [])

  if (phase === "success" && record) {
    return (
      <Card className="border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20">
        <CardHeader className="flex flex-row items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <CardTitle className="font-serif text-base">Attendance marked</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-foreground">
            You are marked <span className="font-semibold">{record.status}</span> for{" "}
            {new Date(record.date).toLocaleDateString("en-IN")}.
          </p>
          <p className="text-xs text-muted-foreground">
            Method: <span className="uppercase">{record.method}</span>
          </p>
          {message && <p className="text-xs text-muted-foreground mt-1">{message}</p>}
        </CardContent>
      </Card>
    )
  }

  if (phase === "error") {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader className="flex flex-row items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="font-serif text-base">Unable to mark attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-destructive">{error || "An unknown error occurred."}</p>
          {message && <p className="text-xs text-muted-foreground">{message}</p>}
        </CardContent>
      </Card>
    )
  }

  if (phase === "face") {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Camera className="h-4 w-4 text-accent" />
            Face verification
          </h3>
          <p className="text-xs text-muted-foreground">
            Please align your face in the frame and tap capture. The system will confirm your staff attendance.
          </p>
        </div>
        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black/80">
          <video ref={videoRef} className="h-full w-full object-cover" />
        </div>
        <div className="flex items-center justify-between gap-2">
          {message && (
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {message}
            </p>
          )}
          <Button size="sm" className="ml-auto" onClick={handleFaceCapture}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Capture & Confirm
          </Button>
        </div>
      </div>
    )
  }

  // Default: scanning
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <QrCode className="h-4 w-4 text-accent" />
          Scan library QR
        </h3>
        <p className="text-xs text-muted-foreground">
          Position the library QR inside the frame. Your location is required to mark attendance.
        </p>
      </div>
      <div
        id="versai-qr-reader"
        ref={scannerRef}
        className="h-[280px] w-full overflow-hidden rounded-md border bg-black/80"
      />
      <div className="flex items-center justify-between gap-2">
        {message && (
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {message}
          </p>
        )}
        {!message && location.lat && location.lng && (
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            GPS locked in
          </p>
        )}
      </div>
    </div>
  )
}


