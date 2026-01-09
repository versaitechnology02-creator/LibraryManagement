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
  const [desks, setDesks] = useState([])
  const [shifts, setShifts] = useState([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" {...register("fullName", { required: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="studentId">Student ID</Label>
          <Input id="studentId" placeholder="VRS-2024-XXX" {...register("studentId", { required: true })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email", { required: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" {...register("phone", { required: true })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" {...register("address")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Payment Plan</Label>
          <Select onValueChange={(v) => setValue("paymentPlan", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Monthly">Monthly</SelectItem>
              <SelectItem value="Quarterly">Quarterly</SelectItem>
              <SelectItem value="Yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="totalAmount">Total Amount</Label>
          <Input id="totalAmount" type="number" {...register("totalAmount", { required: true })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Assign Desk</Label>
          <Select onValueChange={(v) => setValue("desk", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select desk" />
            </SelectTrigger>
            <SelectContent>
              {desks
                .filter((d: any) => d.status === "Available")
                .map((desk: any) => (
                  <SelectItem key={desk._id} value={desk._id}>
                    {desk.deskNumber} ({desk.type})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Assign Shift</Label>
          <Select onValueChange={(v) => setValue("shift", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select shift" />
            </SelectTrigger>
            <SelectContent>
              {shifts.map((shift: any) => (
                <SelectItem key={shift._id} value={shift._id}>
                  {shift.name} ({shift.startTime}-{shift.endTime})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="membershipStart">Start Date</Label>
          <Input id="membershipStart" type="date" {...register("membershipStart", { required: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="membershipEnd">End Date</Label>
          <Input id="membershipEnd" type="date" {...register("membershipEnd", { required: true })} />
        </div>
      </div>

      <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={loading}>
        {loading ? "Registering..." : "Complete Registration"}
      </Button>
    </form>
  )
}
