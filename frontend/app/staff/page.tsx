"use client"

import { useEffect, useMemo, useState } from "react"
import { api } from "@/lib/api"
import { StaffSidebar } from "@/components/sidebars/StaffSidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { CalendarDays, DollarSign, Smartphone, UserCheck } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AttendanceScanner } from "@/components/attendance-scanner"
import { FaceRecognition } from "@/components/face-recognition"

type AttendanceRecord = {
  _id: string
  date: string
  status: "Present" | "Absent"
}

type SalaryRecord = {
  _id: string
  month: string // "YYYY-MM"
  totalPresentDays: number
  calculatedAmount: number
  status: "Pending" | "Paid"
}

export default function StaffDashboardPage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [salaries, setSalaries] = useState<SalaryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [faceRecognitionMode, setFaceRecognitionMode] = useState<'register' | 'verify' | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)

        const [attData, salData] = await Promise.all([api.getMyAttendance(), api.getMySalary()])

        setAttendance(attData)
        setSalaries(salData)
      } catch (e: any) {
        setError(e.message ?? "Something went wrong loading your dashboard")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const presentCount = useMemo(
    () => attendance.filter((r) => r.status === "Present").length,
    [attendance],
  )

  const currentMonthSalary = useMemo(() => {
    const now = new Date()
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    return salaries.find((s) => s.month === key) || null
  }, [salaries])

  return (
    <SidebarProvider>
      <StaffSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Versai</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Staff Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl md:text-3xl font-bold font-serif tracking-tight">Your Work Summary</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              View your attendance and salary as calculated by the library system.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="inline-flex items-center gap-2"
                  onClick={() => setIsScannerOpen(true)}
                >
                  <Smartphone className="h-4 w-4" />
                  Mark attendance via QR
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-serif text-lg">Scan Daily QR Code</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Scan the QR code displayed on the admin dashboard to mark your attendance
                  </p>
                </DialogHeader>
                <AttendanceScanner
                  onScanSuccess={async (data) => {
                    try {
                      // Validate and mark attendance with QR token
                      await api.markQRAttendance({ qrToken: data, location: { lat: 0, lng: 0, address: 'QR Scan' } });
                      setIsScannerOpen(false);
                      // Refresh attendance data
                      const attData = await api.getMyAttendance();
                      setAttendance(attData);
                    } catch (e: any) {
                      alert('Error marking attendance: ' + e.message);
                    }
                  }}
                  onScanError={(error) => {
                    console.error('Scan error:', error);
                  }}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={faceRecognitionMode !== null} onOpenChange={(open) => !open && setFaceRecognitionMode(null)}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="inline-flex items-center gap-2"
                  onClick={async () => {
                    try {
                      // Check if user has registered face
                      const faceStatus = await api.getFaceStatus()
                      setFaceRecognitionMode(faceStatus.faceRegistered ? 'verify' : 'register')
                    } catch (e: any) {
                      alert('Error checking face registration status: ' + e.message)
                    }
                  }}
                >
                  <UserCheck className="h-4 w-4" />
                  Mark attendance via Face
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-serif text-lg">
                    {faceRecognitionMode === 'register' ? 'Register Your Face' : 'Verify Your Face'}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    {faceRecognitionMode === 'register'
                      ? 'Register your face for future attendance verification'
                      : 'Verify your face to mark attendance'
                    }
                  </p>
                </DialogHeader>
                {faceRecognitionMode && (
                  <FaceRecognition
                    mode={faceRecognitionMode}
                    onSuccess={async (result) => {
                      if (faceRecognitionMode === 'register') {
                        // Face registered successfully, now verify for attendance
                        setFaceRecognitionMode('verify')
                      } else {
                        // Face verified, mark attendance
                        try {
                          await api.markAttendance({ faceMatch: true, location: { lat: 0, lng: 0, address: 'Face recognition' } });
                          setFaceRecognitionMode(null);
                          // Refresh attendance data
                          const attData = await api.getMyAttendance();
                          setAttendance(attData);
                        } catch (e: any) {
                          alert('Error marking attendance: ' + e.message);
                        }
                      }
                    }}
                    onError={(error) => {
                      console.error('Face recognition error:', error);
                      alert('Face recognition failed: ' + error);
                    }}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
                <p className="text-sm text-muted-foreground">Loading your data…</p>
              </div>
            </div>
          ) : error ? (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-destructive text-sm">Unable to load dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-destructive/90">{error}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2">
                    <div>
                      <CardTitle className="font-serif text-base md:text-lg">Attendance</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">Last 60 days</p>
                    </div>
                    <UserCheck className="h-5 w-5 text-accent" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-2xl font-semibold">
                      {presentCount} <span className="text-sm font-normal text-muted-foreground">days</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This is the number of days you were marked present by the system.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2">
                    <div>
                      <CardTitle className="font-serif text-base md:text-lg">Current Month Salary</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">As calculated from attendance</p>
                    </div>
                    <DollarSign className="h-5 w-5 text-accent" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {currentMonthSalary ? (
                      <>
                        <div className="flex items-baseline justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Calculated amount</p>
                            <p className="text-lg font-semibold">
                              ₹{currentMonthSalary.calculatedAmount.toLocaleString()}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              currentMonthSalary.status === "Paid"
                                ? "border-emerald-500 text-emerald-600"
                                : "border-yellow-500 text-yellow-600"
                            }
                          >
                            {currentMonthSalary.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Present days this month: <span className="font-medium">{currentMonthSalary.totalPresentDays}</span>
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No salary calculation is available for the current month yet. Your admin can generate it from the
                        CRM.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif text-base md:text-lg">Salary History</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <p className="text-muted-foreground">
                      Recent months will appear here once your admin runs the salary calculation for those periods.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-2">
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle className="font-serif text-base md:text-lg">Salary by Month</CardTitle>
                </CardHeader>
                <CardContent>
                  {salaries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No salary records available yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead>Present days</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salaries.map((s) => (
                          <TableRow key={s._id}>
                            <TableCell>
                              <span className="inline-flex items-center gap-1 text-xs">
                                <CalendarDays className="h-3 w-3 text-muted-foreground" />
                                {s.month}
                              </span>
                            </TableCell>
                            <TableCell>{s.totalPresentDays}</TableCell>
                            <TableCell>₹{s.calculatedAmount.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  s.status === "Paid"
                                    ? "border-emerald-500 text-emerald-600"
                                    : "border-yellow-500 text-yellow-600"
                                }
                              >
                                {s.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}


