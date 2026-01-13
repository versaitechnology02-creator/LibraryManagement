"use client"

import { useEffect, useState } from "react"
import { AdminSidebar } from "@/components/sidebars/AdminSidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Users,
  Search,
  Eye,
  CreditCard,
  FileText,
  IdCard,
  CheckCircle2,
  XCircle,
  Calendar,
  DollarSign,
  UserCheck
} from "lucide-react"
import { api } from "@/lib/api"

type Student = {
  _id: string
  fullName: string
  studentId: string
  email: string
  phone: string
  membershipStart: string
  membershipEnd: string
  paymentPlan: string
  paymentStatus: string
  totalAmount: number
  amountPaid: number
  dueAmount: number
  status: string
  desk?: { deskNumber: string }
  shift?: { name: string }
  user?: { name: string; email: string }
  attendanceSummary: {
    presentDays: number
    totalDays: number
    percentage: number
  }
  feeStatus: {
    status: string
    lastPaymentDate: string | null
    amountPaid: number
    dueAmount: number
  }
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showFeeDialog, setShowFeeDialog] = useState(false)
  const [feeUpdateData, setFeeUpdateData] = useState({
    status: "",
    amountPaid: 0,
    dueAmount: 0
  })

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const data = await api.getAdminStudents()
      setStudents(data)
    } catch (error: any) {
      toast.error("Failed to load students")
      console.error("Error fetching students:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (student: Student) => {
    setSelectedStudent(student)
    setShowDetailsDialog(true)
  }

  const handleUpdateFeeStatus = async () => {
    if (!selectedStudent) return

    try {
      await api.updateStudentFeeStatus(selectedStudent._id, feeUpdateData)
      toast.success("Fee status updated successfully")
      setShowFeeDialog(false)
      fetchStudents() // Refresh the list
    } catch (error: any) {
      toast.error("Failed to update fee status")
      console.error("Error updating fee status:", error)
    }
  }

  const handleGenerateReceipt = async (studentId: string) => {
    try {
      const result = await api.generateStudentFeeReceipt(studentId, {})
      toast.success("Receipt generated successfully")

      // Download the PDF
      const link = document.createElement('a')
      link.href = result.pdfData
      link.download = `receipt-${result.receiptNumber}.pdf`
      link.click()
    } catch (error: any) {
      toast.error("Failed to generate receipt")
      console.error("Error generating receipt:", error)
    }
  }

  const handleGenerateStudentId = async (studentId: string) => {
    try {
      const result = await api.generateStudentId(studentId)
      toast.success(`Student ID generated: ${result.studentId}`)
      fetchStudents() // Refresh the list
    } catch (error: any) {
      toast.error("Failed to generate student ID")
      console.error("Error generating student ID:", error)
    }
  }

  const filteredStudents = students.filter(student =>
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-500">Active</Badge>
      case "Inactive":
        return <Badge variant="secondary">Inactive</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getFeeStatusBadge = (status: string) => {
    switch (status) {
      case "Fully Paid":
        return <Badge className="bg-green-500">Paid</Badge>
      case "Half Paid":
        return <Badge className="bg-yellow-500">Partial</Badge>
      case "Pending":
        return <Badge variant="destructive">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
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
                <BreadcrumbPage>Students Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold font-serif tracking-tight">Students Management</h1>
              <p className="text-muted-foreground">Manage student profiles, attendance, and fee status</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{students.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {students.filter(s => s.status === "Active").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fees Pending</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{students.reduce((acc, s) => acc + s.dueAmount, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {students.length > 0
                    ? Math.round(students.reduce((acc, s) => acc + s.attendanceSummary.percentage, 0) / students.length)
                    : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Students Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>Fee Status</TableHead>
                      <TableHead>Due Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Loading students...
                        </TableCell>
                      </TableRow>
                    ) : filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No students found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student) => (
                        <TableRow key={student._id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{student.fullName}</span>
                              <span className="text-sm text-muted-foreground">{student.studentId || 'No ID'}</span>
                              <span className="text-xs text-muted-foreground">{student.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(student.status)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {student.attendanceSummary.presentDays}/{student.attendanceSummary.totalDays} days
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {student.attendanceSummary.percentage}% this month
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{getFeeStatusBadge(student.feeStatus.status)}</TableCell>
                          <TableCell>
                            <span className="font-medium">₹{student.dueAmount.toLocaleString()}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(student)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedStudent(student)
                                  setFeeUpdateData({
                                    status: student.paymentStatus,
                                    amountPaid: student.amountPaid,
                                    dueAmount: student.dueAmount
                                  })
                                  setShowFeeDialog(true)
                                }}
                              >
                                <CreditCard className="h-4 w-4 mr-1" />
                                Fee
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGenerateReceipt(student._id)}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Receipt
                              </Button>
                              {!student.studentId && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleGenerateStudentId(student._id)}
                                >
                                  <IdCard className="h-4 w-4 mr-1" />
                                  ID
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Student Details</DialogTitle>
            </DialogHeader>
            {selectedStudent && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Full Name</Label>
                    <p className="text-sm">{selectedStudent.fullName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Student ID</Label>
                    <p className="text-sm">{selectedStudent.studentId || 'Not generated'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm">{selectedStudent.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm">{selectedStudent.phone}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Payment Plan</Label>
                    <p className="text-sm">{selectedStudent.paymentPlan}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    {getStatusBadge(selectedStudent.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Monthly Fee</Label>
                    <p className="text-sm">₹{selectedStudent.totalAmount}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Amount Paid</Label>
                    <p className="text-sm">₹{selectedStudent.amountPaid}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Due Amount</Label>
                    <p className="text-sm">₹{selectedStudent.dueAmount}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Fee Status</Label>
                    {getFeeStatusBadge(selectedStudent.feeStatus.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Desk</Label>
                    <p className="text-sm">{selectedStudent.desk?.deskNumber || 'Not assigned'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Shift</Label>
                    <p className="text-sm">{selectedStudent.shift?.name || 'Not assigned'}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Fee Update Dialog */}
        <Dialog open={showFeeDialog} onOpenChange={setShowFeeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Fee Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fee-status">Fee Status</Label>
                <Select
                  value={feeUpdateData.status}
                  onValueChange={(value) => setFeeUpdateData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Half Paid">Half Paid</SelectItem>
                    <SelectItem value="Fully Paid">Fully Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount-paid">Amount Paid</Label>
                <Input
                  id="amount-paid"
                  type="number"
                  value={feeUpdateData.amountPaid}
                  onChange={(e) => setFeeUpdateData(prev => ({ ...prev, amountPaid: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="due-amount">Due Amount</Label>
                <Input
                  id="due-amount"
                  type="number"
                  value={feeUpdateData.dueAmount}
                  onChange={(e) => setFeeUpdateData(prev => ({ ...prev, dueAmount: Number(e.target.value) }))}
                />
              </div>
              <Button onClick={handleUpdateFeeStatus} className="w-full">
                Update Fee Status
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
