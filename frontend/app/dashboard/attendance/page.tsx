"use client"

import { useState, useEffect, Suspense } from "react"
import { AdminSidebar } from "@/components/sidebars/AdminSidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { CalendarIcon, CheckCircle2, XCircle, Search } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"

export default function AttendancePage() {
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState<Record<string, string>>({})
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchData()
  }, [date])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [studentsData, attendanceData] = await Promise.all([
        api.getAdminStudents(),
        api.getAttendance(date),
      ])

      const attMap: Record<string, string> = {}
      attendanceData.forEach((a: any) => {
        attMap[a.student._id] = a.status
      })

      setStudents(studentsData)
      setAttendance(attMap)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load attendance data")
    } finally {
      setLoading(false)
    }
  }

  const markAttendance = async (studentId: string, status: string) => {
    try {
      await api.markAdminAttendance({ student: studentId, status, date })
      setAttendance((prev) => ({ ...prev, [studentId]: status }))
      toast.success("Attendance updated")
    } catch (error) {
      toast.error("Failed to update attendance")
      console.error("Error updating attendance:", error)
    }
  }

  const filteredStudents = students.filter((s: any) => s.fullName && s.fullName.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <Suspense fallback={null}>
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
                  <BreadcrumbPage>Attendance</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex flex-1 flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold font-serif tracking-tight">Daily Attendance</h1>
                <p className="text-muted-foreground">Log and monitor student attendance for the library space.</p>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Desk</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student: any) => (
                      <TableRow key={student._id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{student.fullName || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground">{student.studentId || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{student.desk?.deskNumber || "-"}</TableCell>
                        <TableCell>{student.shift?.name || "-"}</TableCell>
                        <TableCell>
                          {attendance[student._id] ? (
                            <Badge
                              variant={attendance[student._id] === "Present" ? "default" : "destructive"}
                              className={
                                attendance[student._id] === "Present" ? "bg-emerald-500 hover:bg-emerald-600" : ""
                              }
                            >
                              {attendance[student._id]}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Not marked</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 bg-transparent"
                              onClick={() => markAttendance(student._id, "Present")}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Present
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 border-destructive/50 text-destructive hover:bg-destructive/50 bg-transparent"
                              onClick={() => markAttendance(student._id, "Absent")}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Absent
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  )
}
