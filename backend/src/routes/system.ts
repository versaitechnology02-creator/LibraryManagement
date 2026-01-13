import express, { Response } from "express"
import { authMiddleware, roleMiddleware, AuthRequest } from "../config/auth"
import { schedulerService } from "../utils/scheduler-service"
import { feeReminderService } from "../utils/fee-reminder-service"
import { emailService } from "../utils/email-service"
import Student from "../models/Student"
import Staff from "../models/Staff"
import Payment from "../models/Payment"
import Attendance from "../models/Attendance"
import Desk from "../models/Desk"
import Shift from "../models/Shift"

const router = express.Router()

// Get system stats for admin dashboard
// WHY: To provide accurate, real-time statistics calculated on the server-side
// instead of client-side aggregation, improving performance and data consistency
router.get("/stats", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    const today = now.toISOString().split('T')[0]

    // Total Revenue (sum of all payments)
    const totalRevenueResult = await Payment.aggregate([
      { $match: { status: { $in: ["Fully Paid", "Half Paid"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ])
    const totalRevenue = totalRevenueResult[0]?.total || 0

    // Pending Fees (sum of dueAmount from students)
    const pendingFeesResult = await Student.aggregate([
      { $match: { status: "Active" } },
      { $group: { _id: null, total: { $sum: "$dueAmount" } } }
    ])
    const pendingFees = pendingFeesResult[0]?.total || 0

    // Active Students Count
    const activeStudents = await Student.countDocuments({ status: "Active" })

    // Staff Count
    const staffCount = await Staff.countDocuments({ active: true })

    // Attendance Today (Students + Staff)
    const attendanceToday = await Attendance.countDocuments({
      date: { $gte: new Date(today), $lt: new Date(today + 'T23:59:59') }
    })

    // Desk Occupancy
    const totalDesks = await Desk.countDocuments()
    const occupiedDesks = await Student.countDocuments({ desk: { $ne: null }, status: "Active" })

    // Shift Utilization
    const shifts = await Shift.find({})
    const shiftUtilization = await Promise.all(
      shifts.map(async (shift) => {
        const assigned = await Student.countDocuments({ shift: shift._id, status: "Active" })
        return {
          name: shift.name,
          assigned,
          capacity: shift.maxCapacity,
          utilization: shift.maxCapacity > 0 ? Math.round((assigned / shift.maxCapacity) * 100) : 0
        }
      })
    )

    res.json({
      totalRevenue,
      pendingFees,
      activeStudents,
      staffCount,
      attendanceToday,
      deskOccupancy: {
        occupied: occupiedDesks,
        total: totalDesks,
        percentage: totalDesks > 0 ? Math.round((occupiedDesks / totalDesks) * 100) : 0
      },
      shiftUtilization
    })
  } catch (error: any) {
    console.error("[SystemRoutes] Error fetching stats:", error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Manual trigger monthly fee reminders (Admin only)
router.post("/fee-reminders/trigger-monthly", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    console.log(`[SystemRoutes] Manual trigger of monthly fee reminders by admin: ${req.user?.email}`)

    const result = await schedulerService.triggerMonthlyFeeReminders()

    res.json({
      success: true,
      message: "Monthly fee reminders triggered successfully",
      result: {
        totalStudents: result.totalStudents,
        remindersSent: result.remindersSent,
        overdueRemindersSent: result.overdueRemindersSent,
        errors: result.errors
      }
    })
  } catch (error: any) {
    console.error("[SystemRoutes] Error triggering monthly fee reminders:", error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Manual trigger daily overdue reminders (Admin only)
router.post("/fee-reminders/trigger-overdue", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    console.log(`[SystemRoutes] Manual trigger of overdue fee reminders by admin: ${req.user?.email}`)

    const result = await schedulerService.triggerDailyOverdueReminders()

    res.json({
      success: true,
      message: "Overdue fee reminders triggered successfully",
      result: {
        totalStudents: result.totalStudents,
        remindersSent: result.remindersSent,
        overdueRemindersSent: result.overdueRemindersSent,
        errors: result.errors
      }
    })
  } catch (error: any) {
    console.error("[SystemRoutes] Error triggering overdue fee reminders:", error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Get fee reminder statistics (Admin only)
router.get("/fee-reminders/stats", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    const stats = await feeReminderService.getFeeStatistics()

    res.json({
      success: true,
      stats: {
        totalStudents: stats.totalStudents,
        studentsWithPendingFees: stats.studentsWithPendingFees,
        totalOverdueAmount: stats.totalOverdueAmount,
        overdueStudents: stats.overdueStudents
      }
    })
  } catch (error: any) {
    console.error("[SystemRoutes] Error getting fee statistics:", error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Get scheduler job status (Admin only)
router.get("/scheduler/status", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    const monthlyJobRunning = schedulerService.getJobStatus('monthly-fee-reminders')
    const dailyJobRunning = schedulerService.getJobStatus('daily-overdue-reminders')

    res.json({
      success: true,
      jobs: {
        "monthly-fee-reminders": {
          running: monthlyJobRunning,
          schedule: "1st of every month at 9:00 AM IST"
        },
        "daily-overdue-reminders": {
          running: dailyJobRunning,
          schedule: "Every day at 10:00 AM IST"
        }
      }
    })
  } catch (error: any) {
    console.error("[SystemRoutes] Error getting scheduler status:", error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Test email configuration (Admin only)
router.post("/email/test", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    const { testEmail } = req.body

    if (!testEmail) {
      return res.status(400).json({
        success: false,
        error: "Test email address is required"
      })
    }

    console.log(`[SystemRoutes] Testing email configuration to: ${testEmail}`)

    await emailService.sendEmail(
      testEmail,
      "Library Management System - Email Test",
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Email Test Successful</h1>
          <p style="color: #e8e8e8; margin: 10px 0 0 0;">Versai Library Management System</p>
        </div>

        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;">
          <h2 style="color: #333; margin-top: 0;">✅ Email Configuration Working</h2>
          <p style="color: #666; margin: 20px 0;">
            This is a test email to verify that the email service is configured correctly.
          </p>
          <p style="color: #666; margin: 20px 0;">
            Sent at: ${new Date().toLocaleString('en-IN')}
          </p>
        </div>
      </div>
      `,
      "Library Management System - Email Test"
    )

    res.json({
      success: true,
      message: `Test email sent successfully to ${testEmail}`
    })
  } catch (error: any) {
    console.error("[SystemRoutes] Error testing email:", error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Send payment confirmation email (called after successful payment)
router.post("/payment-confirmation/:paymentId", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId } = req.params
    const { studentId } = req.body

    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: "Student ID is required"
      })
    }

    console.log(`[SystemRoutes] Sending payment confirmation for payment: ${paymentId}, student: ${studentId}`)

    await feeReminderService.sendPaymentConfirmation(studentId, paymentId)

    res.json({
      success: true,
      message: "Payment confirmation email sent successfully"
    })
  } catch (error: any) {
    console.error("[SystemRoutes] Error sending payment confirmation:", error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router