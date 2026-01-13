"use client"

import { useEffect, useState } from "react"
import { AdminSidebar } from "@/components/sidebars/AdminSidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  QrCode,
  RefreshCw,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download
} from "lucide-react"
import { api } from "@/lib/api"
import QRCode from "qrcode"

type QRSession = {
  active: boolean
  qrToken?: string
  expiresAt?: string
  locationRequired?: boolean
  createdAt?: string
  message?: string
}

export default function AdminQRPage() {
  const [qrSession, setQrSession] = useState<QRSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [locationRequired, setLocationRequired] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchActiveQRSession()
  }, [])

  const fetchActiveQRSession = async () => {
    try {
      setLoading(true)
      const session = await api.getActiveQRSession()
      setQrSession(session)

      if (session.active && session.qrToken) {
        // Generate QR code data URL
        const qrData = JSON.stringify({
          token: session.qrToken,
          type: "attendance",
          locationRequired: session.locationRequired
        })
        const dataUrl = await QRCode.toDataURL(qrData, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        setQrDataUrl(dataUrl)
      }
    } catch (error: any) {
      toast.error("Failed to load QR session")
      console.error("Error fetching QR session:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateNewQR = async () => {
    try {
      setGenerating(true)

      // Generate new QR session via existing endpoint
      await api.createQRSession({
        locationRequired
      })

      toast.success("New QR session generated successfully")
      await fetchActiveQRSession() // Refresh the session
    } catch (error: any) {
      toast.error("Failed to generate QR session")
      console.error("Error generating QR:", error)
    } finally {
      setGenerating(false)
    }
  }

  const copyQRToken = async () => {
    if (qrSession?.qrToken) {
      try {
        await navigator.clipboard.writeText(qrSession.qrToken)
        toast.success("QR token copied to clipboard")
      } catch (error) {
        toast.error("Failed to copy token")
      }
    }
  }

  const downloadQR = () => {
    if (qrDataUrl) {
      const link = document.createElement('a')
      link.href = qrDataUrl
      link.download = `attendance-qr-${new Date().toISOString().split('T')[0]}.png`
      link.click()
      toast.success("QR code downloaded")
    }
  }

  const getTimeRemaining = () => {
    if (!qrSession?.expiresAt) return "00:00:00"

    const now = new Date().getTime()
    const expiry = new Date(qrSession.expiresAt).getTime()
    const remaining = Math.max(0, expiry - now)

    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000)

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const isExpired = () => {
    if (!qrSession?.expiresAt) return true
    return new Date(qrSession.expiresAt) <= new Date()
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Versai</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>QR Attendance Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold font-serif tracking-tight">QR Attendance Management</h1>
              <p className="text-muted-foreground">Generate and manage daily QR codes for attendance</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* QR Generation Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Generate Daily QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="location-required"
                    checked={locationRequired}
                    onCheckedChange={setLocationRequired}
                  />
                  <Label htmlFor="location-required" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Require location tracking
                  </Label>
                </div>

                <Button
                  onClick={generateNewQR}
                  disabled={generating}
                  className="w-full"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Generate New QR Code
                    </>
                  )}
                </Button>

                <p className="text-sm text-muted-foreground">
                  QR codes expire at the end of each day and prevent duplicate attendance.
                </p>
              </CardContent>
            </Card>

            {/* Current QR Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Current QR Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : qrSession?.active ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-green-700">Active QR Session</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Expires in:</span>
                        <span className={`font-mono ${isExpired() ? 'text-red-500' : 'text-green-600'}`}>
                          {getTimeRemaining()}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span>Location required:</span>
                        <Badge variant={qrSession.locationRequired ? "default" : "secondary"}>
                          {qrSession.locationRequired ? "Yes" : "No"}
                        </Badge>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span>Created:</span>
                        <span>{qrSession.createdAt ? new Date(qrSession.createdAt).toLocaleTimeString() : 'N/A'}</span>
                      </div>
                    </div>

                    {qrSession.qrToken && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyQRToken}
                          className="flex-1"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Token
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadQR}
                          disabled={!qrDataUrl}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download QR
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">No Active QR Session</h3>
                    <p className="text-sm text-muted-foreground">
                      Generate a new QR code to enable attendance scanning for today.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* QR Code Display */}
          {qrDataUrl && qrSession?.active && (
            <Card>
              <CardHeader>
                <CardTitle>Today's Attendance QR Code</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
                  <img
                    src={qrDataUrl}
                    alt="Attendance QR Code"
                    className="w-64 h-64"
                  />
                </div>

                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Students and staff can scan this QR code to mark their attendance.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Each user can only mark attendance once per day.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={downloadQR} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download High Quality
                  </Button>
                  <Button onClick={copyQRToken} variant="outline">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Token
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How QR Attendance Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <h4 className="font-medium">Generate QR</h4>
                  <p className="text-sm text-muted-foreground">
                    Admin generates a daily QR code that expires at midnight
                  </p>
                </div>

                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <h4 className="font-medium">Scan & Validate</h4>
                  <p className="text-sm text-muted-foreground">
                    Users scan QR code, system validates token and checks for duplicates
                  </p>
                </div>

                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <h4 className="font-medium">Mark Attendance</h4>
                  <p className="text-sm text-muted-foreground">
                    Attendance is recorded with timestamp and location (if required)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}