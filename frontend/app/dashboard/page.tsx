"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Suspense } from "react"
import { api } from "@/lib/api"
import { AdminSidebar } from "@/components/sidebars/AdminSidebar"
import { PaymentSummary } from "@/components/payment-summary"
import { ShiftManager } from "@/components/shift-manager"
import { StudentTable } from "@/components/student-table"
import { DeskGrid } from "@/components/desk-grid"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { CheckSquare } from "lucide-react";
import { Monitor } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Search, Bell, User, Users as UsersIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type DashboardData = {
  students: any[]
  desks: any[]
  shifts: any[]
  stats: {
    totalRevenue: number
    pendingAmount: number
    activeMemberships: number
    occupiedDesks: number
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [students, desks, shifts, payments, attendanceToday] = await Promise.all([
          api.getStudents(),
          api.getDesks(),
          api.getShifts(),
          api.getPayments(),
          api.getAttendance(),
        ])

        const totalRevenue = payments.reduce((acc: number, p: any) => acc + p.amount, 0)
        const pendingAmount = students.reduce((acc: number, s: any) => acc + (s.dueAmount || 0), 0)

        setData({
          students: students.slice(0, 5),
          desks,
          shifts,
          stats: {
            totalRevenue,
            pendingAmount,
            activeMemberships: students.filter((s: any) => s.status === "Active").length,
            occupiedDesks: desks.filter((d: any) => d.status === "Occupied").length,
          },
        })

        // We keep attendanceToday only for KPI display and not in shared data structure for now.
        ;(window as any).__versai_attendanceTodayCount = Array.isArray(attendanceToday) ? attendanceToday.length : 0
      } catch (error) {
        console.error("[versai] Dashboard fetch error:", error)
        setError("Unable to load dashboard data. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <p className="text-muted-foreground animate-pulse font-serif">Loading Versai Dashboard...</p>
        </div>
      </div>
    )
  }

  const attendanceTodayCount =
    typeof window !== "undefined" && (window as any).__versai_attendanceTodayCount
      ? (window as any).__versai_attendanceTodayCount
      : 0

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <Suspense fallback={null}>
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Versai</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Admin Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex items-center gap-4 flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Global search (Students, Desks, Shifts)..."
                  className="w-full bg-muted/50 pl-9 focus-visible:ring-accent"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent" />
              </Button>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <div className="flex items-center gap-3 pl-2">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-sm font-medium">Admin User</span>
                  <span className="text-xs text-muted-foreground">Super Admin</span>
                </div>
                <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                  <User className="h-5 w-5" />
                </div>
              </div>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-8 p-6 lg:p-10">
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-bold font-serif tracking-tight text-foreground">Overview</h1>
              <p className="text-lg text-muted-foreground">
                Welcome back. Here&apos;s what&apos;s happening at the library today.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {data && (
              <PaymentSummary
                stats={{
                  totalRevenue: data.stats.totalRevenue,
                  pendingAmount: data.stats.pendingAmount,
                  recentTransactionsCount: data.stats.activeMemberships,
                  paymentEfficiency: 92, // Static for now; backend could provide this later.
                }}
              />
            )}

            {data && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Students</p>
                      <p className="mt-1 text-2xl font-semibold">{data.stats.activeMemberships}</p>
                    </div>
                    <UsersIcon className="h-6 w-6 text-accent" />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Active memberships currently in the system.</p>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Attendance Today</p>
                      <p className="mt-1 text-2xl font-semibold">{attendanceTodayCount}</p>
                    </div>
                    <CheckSquare className="h-6 w-6 text-accent" />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Combined student and staff attendance records for today.
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Desks Occupied</p>
                      <p className="mt-1 text-2xl font-semibold">
                        {data.stats.occupiedDesks} / {data.desks.length}
                      </p>
                    </div>
                    <Monitor className="h-6 w-6 text-accent" />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Live utilization of study desks.</p>
                </div>
              </div>
            )}

            {data && (
              <>
                <div className="grid gap-8 lg:grid-cols-7">
                  <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-semibold font-serif">Desk Layout</h2>
                      <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                        {data.stats.occupiedDesks} / {data.desks.length} Occupied
                      </Badge>
                    </div>
                    <DeskGrid desks={data.desks} />
                  </div>
                  <div className="lg:col-span-3 flex flex-col gap-4">
                    <h2 className="text-2xl font-semibold font-serif">Shift Status</h2>
                    <ShiftManager shifts={data.shifts} />
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold font-serif">Recent Admissions</h2>
                    <Button variant="link" className="text-accent" asChild>
                      <a href="/dashboard/students">View all students</a>
                    </Button>
                  </div>
                  <StudentTable students={data.students} />
                </div>
              </>
            )}
          </div>
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  )
}
