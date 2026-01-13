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
        const [students, desks, shifts, stats] = await Promise.all([
          api.getStudents(),
          api.getDesks(),
          api.getShifts(),
          api.getSystemStats(), // WHY: Fetch pre-calculated stats from backend for accuracy and performance
        ])

        setData({
          students: students.slice(0, 5),
          desks,
          shifts,
          stats: {
            totalRevenue: stats.totalRevenue,
            pendingAmount: stats.pendingFees,
            activeMemberships: stats.activeStudents,
            occupiedDesks: stats.deskOccupancy.occupied,
          },
        })

        // Store additional stats for components
        ;(window as any).__versai_stats = stats
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
    typeof window !== "undefined" && (window as any).__versai_stats
      ? (window as any).__versai_stats.attendanceToday
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
            {/* Header Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold font-serif tracking-tight text-foreground">
                    Library Overview
                  </h1>
                  <p className="text-base text-muted-foreground mt-1">
                    Monitor operations, track performance, and manage your library efficiently
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Last updated:</span>
                  <span className="font-medium">{new Date().toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Error:</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {data && (
              <>
                {/* Financial Overview */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold font-serif text-foreground">Financial Overview</h2>
                  <PaymentSummary
                    stats={{
                      totalRevenue: data.stats.totalRevenue,
                      pendingAmount: data.stats.pendingAmount,
                      recentTransactionsCount: data.stats.activeMemberships,
                      paymentEfficiency: 92,
                    }}
                  />
                </div>

                {/* Operations Overview */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold font-serif text-foreground">Operations Overview</h2>
                  <div className="grid gap-6 md:grid-cols-4">
                    {/* Active Students */}
                    <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 shadow-sm transition-all hover:shadow-md dark:from-blue-950/20 dark:to-blue-900/10">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                            Active Students
                          </p>
                          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                            {data.stats.activeMemberships}
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            Currently enrolled members
                          </p>
                        </div>
                        <div className="rounded-full bg-blue-500/10 p-3">
                          <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
                    </div>

                    {/* Today's Attendance */}
                    <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-green-50 to-green-100/50 p-6 shadow-sm transition-all hover:shadow-md dark:from-green-950/20 dark:to-green-900/10">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-green-700 dark:text-green-300 uppercase tracking-wide">
                            Today's Attendance
                          </p>
                          <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                            {attendanceTodayCount}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Students & staff present today
                          </p>
                        </div>
                        <div className="rounded-full bg-green-500/10 p-3">
                          <CheckSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-green-500 to-green-600" />
                    </div>

                    {/* Desk Utilization */}
                    <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-purple-50 to-purple-100/50 p-6 shadow-sm transition-all hover:shadow-md dark:from-purple-950/20 dark:to-purple-900/10">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                            Desk Utilization
                          </p>
                          <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                            {data.stats.occupiedDesks} / {data.desks.length}
                          </p>
                          <p className="text-xs text-purple-600 dark:text-purple-400">
                            {data.desks.length > 0 ? Math.round((data.stats.occupiedDesks / data.desks.length) * 100) : 0}% capacity used
                          </p>
                        </div>
                        <div className="rounded-full bg-purple-500/10 p-3">
                          <Monitor className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-purple-500 to-purple-600" />
                    </div>

                    {/* Staff Count */}
                    <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-orange-50 to-orange-100/50 p-6 shadow-sm transition-all hover:shadow-md dark:from-orange-950/20 dark:to-orange-900/10">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-orange-700 dark:text-orange-300 uppercase tracking-wide">
                            Staff Members
                          </p>
                          <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                            {(window as any).__versai_stats?.staffCount || 0}
                          </p>
                          <p className="text-xs text-orange-600 dark:text-orange-400">
                            Active staff members
                          </p>
                        </div>
                        <div className="rounded-full bg-orange-500/10 p-3">
                          <UsersIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600" />
                    </div>
                  </div>
                </div>

                {/* Resource Management */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold font-serif text-foreground">Resource Management</h2>
                  <div className="grid gap-8 lg:grid-cols-7">
                    <div className="lg:col-span-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-foreground">Study Desk Layout</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-emerald-500/50 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                            {data.stats.occupiedDesks} / {data.desks.length} Occupied
                          </Badge>
                        </div>
                      </div>
                      <div className="rounded-lg border bg-card p-4">
                        <DeskGrid desks={data.desks} />
                      </div>
                    </div>
                    <div className="lg:col-span-3 space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Shift Schedule</h3>
                      <div className="rounded-lg border bg-card p-4">
                        <ShiftManager shifts={data.shifts} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold font-serif text-foreground">Recent Student Admissions</h2>
                    <Button variant="outline" className="text-accent hover:text-accent border-accent/20 hover:border-accent/40" asChild>
                      <a href="/dashboard/students" className="flex items-center gap-2">
                        <span>View All Students</span>
                        <span className="text-xs">→</span>
                      </a>
                    </Button>
                  </div>
                  <div className="rounded-lg border bg-card">
                    <StudentTable students={data.students} />
                  </div>
                </div>
              </>
            )}
          </div>
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  )
}
