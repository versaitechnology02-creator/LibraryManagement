import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Mail, MapPin, Phone, User } from "lucide-react"

interface StudentProfileProps {
  student: {
    fullName: string
    studentId: string
    email: string
    phone: string
    address: string
    membershipStart: string
    membershipEnd: string
    paymentStatus: string
    desk?: { deskNumber: string }
    shift?: { name: string; startTime: string; endTime: string }
  }
}

export function StudentProfile({ student }: StudentProfileProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="md:col-span-1">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <User className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="mt-4 font-serif text-2xl">{student.fullName || 'Unknown'}</CardTitle>
          <p className="text-sm text-muted-foreground">{student.studentId || 'N/A'}</p>
          <Badge variant="outline" className="mt-2 border-accent text-accent">
            {student.paymentStatus}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{student.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{student.phone}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{student.address}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="font-serif">Membership Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-1">
            <span className="text-xs font-medium uppercase text-muted-foreground tracking-wider">Assigned Desk</span>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <span className="font-bold">{student.desk?.deskNumber || "N/A"}</span>
              </div>
              <span className="text-sm">Premium Study Spot</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium uppercase text-muted-foreground tracking-wider">Current Shift</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="h-10 px-3">
                {student.shift?.name || "Unassigned"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {student.shift?.startTime} - {student.shift?.endTime}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium uppercase text-muted-foreground tracking-wider">Valid Until</span>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">
                {new Date(student.membershipEnd).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium uppercase text-muted-foreground tracking-wider">Next Payment Due</span>
            <div className="flex items-center gap-2 text-destructive">
              <span className="text-sm font-bold italic">No pending dues</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
