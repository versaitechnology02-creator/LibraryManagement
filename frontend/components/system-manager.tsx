"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from "@/lib/api"
import { Mail, Clock, AlertTriangle, CheckCircle, RefreshCw, Send, BarChart3 } from "lucide-react"
import { toast } from "sonner"

interface SystemStats {
  totalStudents: number
  studentsWithPendingFees: number
  totalOverdueAmount: number
  overdueStudents: number
}

interface JobStatus {
  "monthly-fee-reminders": {
    running: boolean
    schedule: string
  }
  "daily-overdue-reminders": {
    running: boolean
    schedule: string
  }
}

export function SystemManager() {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [testEmail, setTestEmail] = useState("")
  const [lastAction, setLastAction] = useState<string>("")

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await api.getFeeStatistics()
      setStats(response.stats)
      toast.success("Fee statistics updated")
    } catch (error: any) {
      toast.error("Failed to fetch statistics")
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchJobStatus = async () => {
    try {
      setLoading(true)
      const response = await api.getSchedulerStatus()
      setJobStatus(response.jobs)
      toast.success("Job status updated")
    } catch (error: any) {
      toast.error("Failed to fetch job status")
      console.error("Error fetching job status:", error)
    } finally {
      setLoading(false)
    }
  }

  const triggerMonthlyReminders = async () => {
    try {
      setLoading(true)
      setLastAction("Triggering monthly fee reminders...")
      const response = await api.triggerMonthlyFeeReminders()
      toast.success(`Monthly reminders sent: ${response.result.remindersSent} regular, ${response.result.overdueRemindersSent} overdue`)
      setLastAction("")
      await fetchStats() // Refresh stats after sending reminders
    } catch (error: any) {
      toast.error("Failed to trigger monthly reminders")
      console.error("Error triggering monthly reminders:", error)
      setLastAction("")
    } finally {
      setLoading(false)
    }
  }

  const triggerOverdueReminders = async () => {
    try {
      setLoading(true)
      setLastAction("Triggering overdue fee reminders...")
      const response = await api.triggerOverdueFeeReminders()
      toast.success(`Overdue reminders sent: ${response.result.overdueRemindersSent}`)
      setLastAction("")
      await fetchStats() // Refresh stats after sending reminders
    } catch (error: any) {
      toast.error("Failed to trigger overdue reminders")
      console.error("Error triggering overdue reminders:", error)
      setLastAction("")
    } finally {
      setLoading(false)
    }
  }

  const testEmailService = async () => {
    if (!testEmail.trim()) {
      toast.error("Please enter a test email address")
      return
    }

    try {
      setLoading(true)
      setLastAction("Testing email service...")
      await api.testEmailService(testEmail.trim())
      toast.success(`Test email sent successfully to ${testEmail}`)
      setTestEmail("")
      setLastAction("")
    } catch (error: any) {
      toast.error("Failed to send test email")
      console.error("Error testing email:", error)
      setLastAction("")
    } finally {
      setLoading(false)
    }
  }

  const refreshAll = async () => {
    await Promise.all([fetchStats(), fetchJobStatus()])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold font-serif">System Management</h2>
          <p className="text-muted-foreground">Manage automated fee reminders and system operations</p>
        </div>
        <Button onClick={refreshAll} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh All
        </Button>
      </div>

      {lastAction && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>{lastAction}</AlertDescription>
        </Alert>
      )}

      {/* Fee Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Fee Statistics
          </CardTitle>
          <CardDescription>Current fee collection status across all students</CardDescription>
        </CardHeader>
        <CardContent>
          {stats ? (
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
                <div className="text-sm text-muted-foreground">Total Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.studentsWithPendingFees}</div>
                <div className="text-sm text-muted-foreground">Pending Fees</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.overdueStudents}</div>
                <div className="text-sm text-muted-foreground">Overdue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">₹{stats.totalOverdueAmount.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Overdue Amount</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Button onClick={fetchStats} disabled={loading} variant="outline">
                Load Statistics
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Manual Actions
          </CardTitle>
          <CardDescription>Trigger automated processes manually for testing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              onClick={triggerMonthlyReminders}
              disabled={loading}
              className="h-auto p-4 flex flex-col items-start gap-2"
              variant="outline"
            >
              <div className="flex items-center gap-2 w-full">
                <Mail className="h-4 w-4" />
                <span className="font-medium">Send Monthly Reminders</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Send fee reminders to all students with pending payments
              </span>
            </Button>

            <Button
              onClick={triggerOverdueReminders}
              disabled={loading}
              className="h-auto p-4 flex flex-col items-start gap-2"
              variant="outline"
            >
              <div className="flex items-center gap-2 w-full">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Send Overdue Reminders</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Send urgent reminders to students with overdue fees
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scheduler Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Automated Jobs Status
          </CardTitle>
          <CardDescription>Status of scheduled automated tasks</CardDescription>
        </CardHeader>
        <CardContent>
          {jobStatus ? (
            <div className="space-y-4">
              {Object.entries(jobStatus).map(([jobName, status]) => (
                <div key={jobName} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium capitalize">
                      {jobName.replace(/-/g, ' ')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {status.schedule}
                    </div>
                  </div>
                  <Badge variant={status.running ? "default" : "secondary"}>
                    {status.running ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Running
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        Scheduled
                      </>
                    )}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Button onClick={fetchJobStatus} disabled={loading} variant="outline">
                Check Job Status
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Service Test
          </CardTitle>
          <CardDescription>Test email configuration and delivery</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="test-email">Test Email Address</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="admin@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <Button onClick={testEmailService} disabled={loading || !testEmail.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Send Test Email
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="text-center text-sm text-muted-foreground">
        <p>System operations are logged and monitored. All manual actions are recorded for audit purposes.</p>
      </div>
    </div>
  )
}