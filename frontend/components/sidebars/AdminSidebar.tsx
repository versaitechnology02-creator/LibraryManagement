"use client"
import {
  BookOpen,
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Monitor,
  Clock,
  CheckSquare,
  User,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AdminSidebar() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await api.logout()
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Logout failed", error)
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BookOpen className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold font-serif text-lg">Versai</span>
                <span className="text-xs text-muted-foreground">Library Management</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="p-2">
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Admin Dashboard" asChild>
              <a href="/dashboard">
                <LayoutDashboard className="size-4" />
                <span>Admin</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Students" asChild>
              <a href="/dashboard/students">
                <Users className="size-4" />
                <span>Students</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Attendance" asChild>
              <a href="/dashboard/attendance">
                <CheckSquare className="size-4" />
                <span>Attendance</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Desks" asChild>
              <a href="/dashboard/desks">
                <Monitor className="size-4" />
                <span>Desks</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Shifts" asChild>
              <a href="/dashboard/shifts">
                <Clock className="size-4" />
                <span>Shifts</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Payments" asChild>
              <a href="/dashboard/payments">
                <CreditCard className="size-4" />
                <span>Payments</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Student View" asChild>
              <a href="/student">
                <User className="size-4" />
                <span>Student</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Staff View" asChild>
              <a href="/staff">
                <User className="size-4" />
                <span>Staff</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings">
              <Settings className="size-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              className="text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
