"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AdminSidebar } from "@/components/sidebars/AdminSidebar"
import { DeskGrid } from "@/components/desk-grid"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Plus, Monitor } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export default function DesksPage() {
  const [desks, setDesks] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)

  useEffect(() => {
    fetchDesks()
  }, [])

  const fetchDesks = async () => {
    try {
      const res = await fetch("/api/desks")
      const data = await res.json()
      setDesks(data)
    } catch (error) {
      console.error("[versai] Error fetching desks:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDesk = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      deskNumber: formData.get("deskNumber"),
      type: formData.get("type"),
    }

    try {
      const res = await fetch("/api/desks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to add desk")
      toast.success("Desk added successfully")
      setIsAddOpen(false)
      fetchDesks()
    } catch (error) {
      toast.error("Failed to add desk")
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
                <BreadcrumbPage>Desks</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold font-serif tracking-tight">Desk Management</h1>
              <p className="text-muted-foreground">Monitor and manage desk assignments and availability.</p>
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Desk
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">Add New Desk</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddDesk} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="deskNumber">Desk Number</Label>
                    <Input id="deskNumber" name="deskNumber" placeholder="e.g. 101" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Desk Type</Label>
                    <Select name="type" defaultValue="Single">
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Shared">Shared</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
                    Create Desk
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full border border-accent/20">
              <Monitor className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">{desks.length} Total Desks</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-emerald-600">
                {desks.filter((d: any) => d.status === "Available").length} Available
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <span className="text-muted-foreground">Loading desks...</span>
            </div>
          ) : (
            <DeskGrid desks={desks} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
