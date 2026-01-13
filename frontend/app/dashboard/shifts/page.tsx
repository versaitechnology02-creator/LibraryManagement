"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AdminSidebar } from "@/components/sidebars/AdminSidebar"
import { ShiftManager } from "@/components/shift-manager"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Plus, Clock } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { api } from "@/lib/api"

export default function ShiftsPage() {
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)

  useEffect(() => {
    fetchShifts()
  }, [])

  const fetchShifts = async () => {
    try {
      const data = await api.getShifts()
      setShifts(data)
    } catch (error) {
      console.error("[versai] Error fetching shifts:", error)
      toast.error("Failed to load shifts")
    } finally {
      setLoading(false)
    }
  }

  const handleAddShift = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name"),
      startTime: formData.get("startTime"),
      endTime: formData.get("endTime"),
      maxCapacity: Number(formData.get("maxCapacity")),
    }

    try {
      await api.createShift(data)
      toast.success("Shift added successfully")
      setIsAddOpen(false)-
      fetchShifts()
    } catch (error) {
      toast.error("Failed to add shift")
      console.error("Error adding shift:", error)
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
                <BreadcrumbPage>Shifts</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold font-serif tracking-tight">Shift Management</h1>
              <p className="text-muted-foreground">Manage library operating hours and student shifts.</p>
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Shift
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">Create New Shift</DialogTitle>
                  <DialogDescription>
                    Define a new shift schedule with start time, end time, and maximum capacity.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddShift} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Shift Name</Label>
                    <Select name="name" defaultValue="Morning">
                      <SelectTrigger>
                        <SelectValue placeholder="Select name" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Morning">Morning</SelectItem>
                        <SelectItem value="Afternoon">Afternoon</SelectItem>
                        <SelectItem value="Evening">Evening</SelectItem>
                        <SelectItem value="Night">Night</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input id="startTime" name="startTime" type="time" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input id="endTime" name="endTime" type="time" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxCapacity">Max Capacity</Label>
                    <Input id="maxCapacity" name="maxCapacity" type="number" defaultValue="50" required />
                  </div>
                  <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
                    Create Shift
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full border border-accent/20">
              <Clock className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">{shifts.length} Active Shifts</span>
            </div>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <span className="text-muted-foreground">Loading shifts...</span>
            </div>
          ) : (
            <ShiftManager shifts={shifts} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
