"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, UserCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Student {
  _id: string
  fullName: string
  studentId: string
  email: string
  status: "Active" | "Inactive"
  paymentStatus: "Pending" | "Half Paid" | "Fully Paid"
  desk?: { deskNumber: string }
}

export function StudentTable({ students }: { students: Student[] }) {
  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Desk</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student._id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <UserCircle className="h-8 w-8 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>{student.fullName || 'Unknown'}</span>
                    <span className="text-xs text-muted-foreground">{student.email}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>{student.studentId || 'N/A'}</TableCell>
              <TableCell>{student.desk?.deskNumber || "Unassigned"}</TableCell>
              <TableCell>
                <Badge variant={student.status === "Active" ? "default" : "secondary"}>{student.status}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    student.paymentStatus === "Fully Paid"
                      ? "border-accent text-accent"
                      : student.paymentStatus === "Half Paid"
                        ? "border-yellow-500 text-yellow-500"
                        : "border-destructive text-destructive"
                  }
                >
                  {student.paymentStatus}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Edit Student</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Deactivate</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
