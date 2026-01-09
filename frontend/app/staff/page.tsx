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

          <div className="flex justify-end">
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
                  <DialogTitle className="font-serif text-lg">Scan QR & verify face</DialogTitle>
                </DialogHeader>
                <AttendanceScanner
                  onCompleted={() => {
                    setIsScannerOpen(false)
                    // Refresh attendance quietly
                    fetch("/api/attendance/me")
                      .then((res) => (res.ok ? res.json() : Promise.reject()))
                      .then((data) => setAttendance(data))
                      .catch(() => undefined)
                  }}
                />
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


