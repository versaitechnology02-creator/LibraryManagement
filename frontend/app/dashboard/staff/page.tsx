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
  DollarSign,
  Calculator,
  CheckCircle2,
  XCircle,
  Calendar,
  UserCheck,
  Briefcase
} from "lucide-react"
import { api } from "@/lib/api"

type StaffMember = {
  _id: string
  designation: string
  salaryType: string
  baseSalary: number
  active: boolean
  user: {
    _id: string
    name: string
    email: string
  }
  attendanceSummary: {
    presentDays: number
    totalDays: number
    percentage: number
  }
  salaryInfo: {
    baseSalary: number
    salaryType: string
    currentMonthSalary: number
    currentMonthStatus: string
    lastCalculated: string | null
  }
}

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showSalaryDialog, setShowSalaryDialog] = useState(false)
  const [salaryUpdateData, setSalaryUpdateData] = useState({
    baseSalary: 0,
    salaryType: "",
    designation: ""
  })
  const [calculatingSalary, setCalculatingSalary] = useState(false)

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      setLoading(true)
      const data = await api.getAdminStaff()
      setStaff(data)
    } catch (error: any) {
      toast.error("Failed to load staff")
      console.error("Error fetching staff:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember)
    setShowDetailsDialog(true)
  }

  const handleUpdateSalary = async () => {
    if (!selectedStaff) return

    try {
      await api.updateStaffSalary(selectedStaff._id, salaryUpdateData)
      toast.success("Staff salary information updated successfully")
      setShowSalaryDialog(false)
      fetchStaff() // Refresh the list
    } catch (error: any) {
      toast.error("Failed to update staff salary")
      console.error("Error updating staff salary:", error)
    }
  }

  const handleCalculateSalaries = async () => {
    try {
      setCalculatingSalary(true)
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
      await api.calculateSalary(currentMonth)
      toast.success("Salaries calculated successfully for current month")
      fetchStaff() // Refresh the list
    } catch (error: any) {
      toast.error("Failed to calculate salaries")
      console.error("Error calculating salaries:", error)
    } finally {
      setCalculatingSalary(false)
    }
  }

  const filteredStaff = staff.filter(staffMember =>
    staffMember.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staffMember.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staffMember.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return <Badge className="bg-green-500">Paid</Badge>
      case "Pending":
        return <Badge variant="secondary">Pending</Badge>
      case "Not Calculated":
        return <Badge variant="outline">Not Calculated</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSalaryTypeBadge = (type: string) => {
    return type === "Monthly"
      ? <Badge className="bg-blue-500">Monthly</Badge>
      : <Badge className="bg-purple-500">Daily</Badge>
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
                <BreadcrumbPage>Staff Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold font-serif tracking-tight">Staff Management</h1>
              <p className="text-muted-foreground">Manage staff profiles, attendance, and salary calculations</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleCalculateSalaries}
                disabled={calculatingSalary}
                variant="outline"
              >
                <Calculator className="h-4 w-4 mr-2" />
                {calculatingSalary ? "Calculating..." : "Calculate Salaries"}
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
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
                <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{staff.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {staff.filter(s => s.active).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Salaries</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{staff.reduce((acc, s) => acc + s.salaryInfo.currentMonthSalary, 0).toLocaleString()}
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
                  {staff.length > 0
                    ? Math.round(staff.reduce((acc, s) => acc + s.attendanceSummary.percentage, 0) / staff.length)
                    : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Staff Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Staff Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Salary Type</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>Current Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading staff...
                        </TableCell>
                      </TableRow>
                    ) : filteredStaff.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No staff found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStaff.map((staffMember) => (
                        <TableRow key={staffMember._id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{staffMember.user.name}</span>
                              <span className="text-sm text-muted-foreground">{staffMember.user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                              {staffMember.designation}
                            </div>
                          </TableCell>
                          <TableCell>{getSalaryTypeBadge(staffMember.salaryType)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {staffMember.attendanceSummary.presentDays}/{staffMember.attendanceSummary.totalDays} days
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {staffMember.attendanceSummary.percentage}% this month
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">₹{staffMember.salaryInfo.currentMonthSalary.toLocaleString()}</span>
                              <span className="text-xs text-muted-foreground">
                                Base: ₹{staffMember.baseSalary.toLocaleString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(staffMember.salaryInfo.currentMonthStatus)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(staffMember)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedStaff(staffMember)
                                  setSalaryUpdateData({
                                    baseSalary: staffMember.baseSalary,
                                    salaryType: staffMember.salaryType,
                                    designation: staffMember.designation
                                  })
                                  setShowSalaryDialog(true)
                                }}
                              >
                                <DollarSign className="h-4 w-4 mr-1" />
                                Salary
                              </Button>
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

        {/* Staff Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Staff Details</DialogTitle>
            </DialogHeader>
            {selectedStaff && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Full Name</Label>
                    <p className="text-sm">{selectedStaff.user.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm">{selectedStaff.user.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Designation</Label>
                    <p className="text-sm">{selectedStaff.designation}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    {selectedStaff.active ? (
                      <Badge className="bg-green-500">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Salary Type</Label>
                    {getSalaryTypeBadge(selectedStaff.salaryType)}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Base Salary</Label>
                    <p className="text-sm">₹{selectedStaff.baseSalary.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Current Month Salary</Label>
                    <p className="text-sm">₹{selectedStaff.salaryInfo.currentMonthSalary.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Salary Status</Label>
                    {getStatusBadge(selectedStaff.salaryInfo.currentMonthStatus)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Present Days (This Month)</Label>
                    <p className="text-sm">{selectedStaff.attendanceSummary.presentDays} / {selectedStaff.attendanceSummary.totalDays}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Attendance Percentage</Label>
                    <p className="text-sm">{selectedStaff.attendanceSummary.percentage}%</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Salary Update Dialog */}
        <Dialog open={showSalaryDialog} onOpenChange={setShowSalaryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Staff Salary Information</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  value={salaryUpdateData.designation}
                  onChange={(e) => setSalaryUpdateData(prev => ({ ...prev, designation: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="salary-type">Salary Type</Label>
                <Select
                  value={salaryUpdateData.salaryType}
                  onValueChange={(value) => setSalaryUpdateData(prev => ({ ...prev, salaryType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select salary type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Daily">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="base-salary">Base Salary</Label>
                <Input
                  id="base-salary"
                  type="number"
                  value={salaryUpdateData.baseSalary}
                  onChange={(e) => setSalaryUpdateData(prev => ({ ...prev, baseSalary: Number(e.target.value) }))}
                />
              </div>
              <Button onClick={handleUpdateSalary} className="w-full">
                Update Salary Information
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}