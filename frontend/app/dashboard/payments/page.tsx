"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { AdminSidebar } from "@/components/sidebars/AdminSidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { CreditCard, Plus, Download, Search } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { api } from "@/lib/api"

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchPayments()
    fetchStudents()
  }, [])

  const fetchPayments = async () => {
    try {
      const data = await api.getPayments()
      setPayments(data)
    } catch (error) {
      console.error("[versai] Error fetching payments:", error)
      toast.error("Failed to load payments")
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const data = await api.getAdminStudents()
      setStudents(data)
    } catch (error) {
      console.error("[versai] Error fetching students:", error)
      toast.error("Failed to load students")
    }
  }

  const handleAddPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      student: formData.get("studentId"),
      amount: Number(formData.get("amount")),
      paymentMode: formData.get("paymentMode"),
      status: "Fully Paid", // Default for direct payment creation
    }

    try {
      await api.createPayment(data)
      toast.success("Payment recorded successfully")
      setIsAddOpen(false)
      fetchPayments()
    } catch (error) {
      toast.error("Failed to record payment")
      console.error("Error recording payment:", error)
    }
  }

  const filteredPayments = payments.filter((p: any) =>
    p.student?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
                  <BreadcrumbPage>Payments</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex flex-1 flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold font-serif tracking-tight">Payment Management</h1>
                <p className="text-muted-foreground">Track student fees, transaction history, and revenue.</p>
              </div>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-accent hover:bg-accent/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Record Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-serif text-2xl">New Transaction</DialogTitle>
                    <DialogDescription>
                      Record a new payment transaction for a student. Select the student and enter payment details.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddPayment} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Select Student</Label>
                      <Select name="studentId" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((s: any) => (
                            <SelectItem key={s._id} value={s._id}>
                              {s.fullName || 'Unknown'} ({s.studentId || 'N/A'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input id="amount" name="amount" type="number" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Mode</Label>
                        <Select name="paymentMode" defaultValue="UPI">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UPI">UPI</SelectItem>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Card">Card</SelectItem>
                            <SelectItem value="Online">Online</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
                      Submit Payment
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-sm font-medium">Monthly Revenue</span>
                </div>
                <div className="text-2xl font-bold">
                  ₹{payments.reduce((acc, p: any) => acc + p.amount, 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by student name..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>

            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading transactions...
                      </TableCell>
                    </TableRow>
                  ) : filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment: any) => (
                      <TableRow key={payment._id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{payment.student?.fullName}</span>
                            <span className="text-xs text-muted-foreground">{payment.student?.studentId}</span>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                        <TableCell>{payment.paymentMode}</TableCell>
                        <TableCell className="font-semibold">₹{payment.amount}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-accent text-accent">
                            {payment.status}
                          </Badge>
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
