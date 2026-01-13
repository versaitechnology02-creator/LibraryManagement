"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export function StudentForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [desks, setDesks] = useState<any[]>([])
  const [shifts, setShifts] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    defaultValues: {
      status: "Active",
      paymentStatus: "Pending",
      paymentPlan: "Monthly",
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [desksData, shiftsData] = await Promise.all([api.getDesks(), api.getShifts()])
        setDesks(desksData)
        setShifts(shiftsData)
      } catch (error) {
        console.error("Failed to fetch desks/shifts", error)
      }
    }
    fetchData()
  }, [])

  const onSubmit = async (data: any) => {
    // Validate required fields
    if (!data.fullName || !data.email || !data.phone || !data.membershipStart || !data.membershipEnd || !data.totalAmount) {
      toast.error("Please fill in all required fields")
      return
    }

    // Validate shift selection (mandatory)
    if (!data.shift) {
      toast.error("Please select a shift for the student")
      return
    }

    // Validate payment plan
    if (!data.paymentPlan) {
      data.paymentPlan = "Monthly"
    }

    // Calculate due amount
    data.dueAmount = data.totalAmount
    data.amountPaid = 0

    setLoading(true)
    try {
      await api.createStudent(data)
      toast.success("Student registered successfully")
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground border-b pb-2">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              placeholder="Enter student's full name"
              {...register("fullName", { required: "Full name is required" })}
              className={errors.fullName ? "border-destructive" : ""}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="studentId" className="text-sm font-medium">
              Student ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="studentId"
              placeholder="Auto-generated ID"
              {...register("studentId", { required: "Student ID is required" })}
              className={errors.studentId ? "border-destructive" : ""}
            />
            {errors.studentId && (
              <p className="text-xs text-destructive">{errors.studentId.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="student@example.com"
              {...register("email", { required: "Email is required" })}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              placeholder="+91 9876543210"
              {...register("phone", { required: "Phone number is required" })}
              className={errors.phone ? "border-destructive" : ""}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-sm font-medium">Address</Label>
          <Textarea
            id="address"
            placeholder="Enter complete address"
            {...register("address")}
            rows={3}
          />
        </div>
      </div>

      {/* Membership Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground border-b pb-2">Membership Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Payment Plan <span className="text-destructive">*</span>
            </Label>
            <Select onValueChange={(v) => setValue("paymentPlan", v)} defaultValue="Monthly">
              <SelectTrigger className={errors.paymentPlan ? "border-destructive" : ""}>
                <SelectValue placeholder="Select payment plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Monthly">Monthly (₹500/month)</SelectItem>
                <SelectItem value="Quarterly">Quarterly (₹1,350/quarter)</SelectItem>
                <SelectItem value="Yearly">Yearly (₹5,000/year)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalAmount" className="text-sm font-medium">
              Total Amount <span className="text-destructive">*</span>
            </Label>
            <Input
              id="totalAmount"
              type="number"
              placeholder="Enter total amount"
              {...register("totalAmount", { required: "Total amount is required" })}
              className={errors.totalAmount ? "border-destructive" : ""}
            />
            {errors.totalAmount && (
              <p className="text-xs text-destructive">{errors.totalAmount.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="membershipStart" className="text-sm font-medium">
              Membership Start <span className="text-destructive">*</span>
            </Label>
            <Input
              id="membershipStart"
              type="date"
              {...register("membershipStart", { required: "Start date is required" })}
              className={errors.membershipStart ? "border-destructive" : ""}
            />
            {errors.membershipStart && (
              <p className="text-xs text-destructive">{errors.membershipStart.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="membershipEnd" className="text-sm font-medium">
              Membership End <span className="text-destructive">*</span>
            </Label>
            <Input
              id="membershipEnd"
              type="date"
              {...register("membershipEnd", { required: "End date is required" })}
              className={errors.membershipEnd ? "border-destructive" : ""}
            />
            {errors.membershipEnd && (
              <p className="text-xs text-destructive">{errors.membershipEnd.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Resource Assignment */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground border-b pb-2">Resource Assignment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Assign Shift <span className="text-destructive">*</span>
            </Label>
            <Select onValueChange={(v) => setValue("shift", v)}>
              <SelectTrigger className={!watch("shift") ? "border-destructive" : ""}>
                <SelectValue placeholder="Select shift (Required)" />
              </SelectTrigger>
              <SelectContent>
                {shifts.map((shift: any) => (
                  <SelectItem key={shift._id} value={shift._id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{shift.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {shift.startTime} - {shift.endTime} ({shift.currentCount}/{shift.maxCapacity} enrolled)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!watch("shift") && (
              <p className="text-xs text-destructive">Shift selection is mandatory</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Assign Desk (Optional)</Label>
            <Select onValueChange={(v) => setValue("desk", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select desk (Optional)" />
              </SelectTrigger>
              <SelectContent>
                {desks
                  .filter((d: any) => d.status === "Available")
                  .map((desk: any) => (
                    <SelectItem key={desk._id} value={desk._id}>
                      Desk {desk.deskNumber} ({desk.type})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {desks.filter((d: any) => d.status === "Available").length === 0 && (
              <p className="text-xs text-muted-foreground">No desks available</p>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t">
        <Button
          type="submit"
          className="w-full bg-accent hover:bg-accent/90 h-12 text-base font-medium"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Registering Student...
            </div>
          ) : (
            "Complete Student Registration"
          )}
        </Button>
      </div>
    </form>
  )
}
