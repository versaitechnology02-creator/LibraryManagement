import connectDB from '../config/db'
import Student from '../models/Student'
import Payment from '../models/Payment'
import User from '../models/User'
import { emailService } from './email-service'

export interface FeeReminderResult {
  totalStudents: number
  remindersSent: number
  overdueRemindersSent: number
  errors: string[]
}

export class FeeReminderService {
  // Send monthly fee reminders to all students with pending fees
  async sendMonthlyFeeReminders(): Promise<FeeReminderResult> {
    const result: FeeReminderResult = {
      totalStudents: 0,
      remindersSent: 0,
      overdueRemindersSent: 0,
      errors: []
    }

    try {
      await connectDB()

      // Get current date info
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      // Calculate due date (typically 1st of next month, but we'll use current month for demo)
      const dueDate = new Date(currentYear, currentMonth + 1, 1)
      const dueDateString = dueDate.toLocaleDateString('en-IN')

      console.log(`[FeeReminderService] Starting monthly fee reminders for ${dueDateString}`)

      // Find all active students
      const students = await Student.find({ status: 'Active' })
        .populate('user', 'name email')
        .lean()

      result.totalStudents = students.length
      console.log(`[FeeReminderService] Found ${students.length} active students`)

      // Process each student
      for (const student of students) {
        try {
          const user = student.user as any
          if (!user || !user.email) {
            console.warn(`[FeeReminderService] Student ${student._id} has no associated user or email`)
            continue
          }

          // Check if student has pending fees
          let hasPendingFees = student.dueAmount > 0 || student.paymentStatus === 'Due' || student.paymentStatus === 'Overdue'

          if (!hasPendingFees) {
            // Check if they need to pay for current/next month
            const lastPayment = await Payment.findOne({ student: student._id })
              .sort({ date: -1 })
              .lean()

            if (lastPayment) {
              const lastPaymentDate = new Date(lastPayment.date)
              const monthsSinceLastPayment = (currentYear - lastPaymentDate.getFullYear()) * 12 +
                                           (currentMonth - lastPaymentDate.getMonth())

              // If more than a month since last payment, they likely need to pay
              if (monthsSinceLastPayment >= 1) {
                hasPendingFees = true
              }
            } else {
              // No payment history, assume they need to pay
              hasPendingFees = true
            }
          }

          if (hasPendingFees) {
            // Calculate days overdue if applicable
            let daysOverdue: number | undefined
            if (student.paymentStatus === 'Overdue' && student.lastPaymentDate) {
              const lastPaymentDate = new Date(student.lastPaymentDate)
              const diffTime = now.getTime() - lastPaymentDate.getTime()
              daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            }

            // Send reminder email
            try {
              await emailService.sendFeeReminder(
                user.email,
                user.name,
                student.dueAmount || student.monthlyFee || 0,
                dueDateString,
                daysOverdue
              )

              if (daysOverdue && daysOverdue > 0) {
                result.overdueRemindersSent++
                console.log(`[FeeReminderService] Overdue reminder sent to ${user.email} (${daysOverdue} days overdue)`)
              } else {
                result.remindersSent++
                console.log(`[FeeReminderService] Fee reminder sent to ${user.email}`)
              }
            } catch (error) {
              result.errors.push(`Failed to send reminder to ${user.email}: ${(error as Error).message || String(error)}`)
              console.error(`[FeeReminderService] Failed to send reminder to ${user.email}:`, error)
            }
          }
        } catch (error: any) {
          const errorMsg = `Error processing student ${student._id}: ${error.message}`
          result.errors.push(errorMsg)
          console.error(`[FeeReminderService] ${errorMsg}`)
        }
      }

      console.log(`[FeeReminderService] Completed: ${result.remindersSent} reminders sent, ${result.overdueRemindersSent} overdue reminders sent, ${result.errors.length} errors`)

    } catch (error: any) {
      const errorMsg = `Fee reminder service error: ${error.message}`
      result.errors.push(errorMsg)
      console.error(`[FeeReminderService] ${errorMsg}`)
    }

    return result
  }

  // Send payment confirmation email
  async sendPaymentConfirmation(studentId: string, paymentId: string): Promise<void> {
    try {
      await connectDB()

      // Get student and payment details
      const student = await Student.findById(studentId).populate('user', 'name email').lean()
      const payment = await Payment.findById(paymentId).lean()

      if (!student || !payment) {
        console.error(`[FeeReminderService] Student or payment not found: ${studentId}, ${paymentId}`)
        throw new Error('Student or payment not found')
      }

      const user = student.user as any
      if (!user || !user.email) {
        console.error(`[FeeReminderService] Student has no associated user or email: ${studentId}`)
        throw new Error('Student has no associated user or email')
      }

      // Calculate next due date (typically 1st of next month)
      const paymentDate = new Date(payment.date)
      const nextDueDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, 1)
      const nextDueDateString = nextDueDate.toLocaleDateString('en-IN')

      const emailSent = await emailService.sendPaymentConfirmation(
        user.email,
        user.name,
        payment.amount,
        paymentDate.toLocaleDateString('en-IN'),
        nextDueDateString
      )

      console.log(`[FeeReminderService] Payment confirmation sent to ${user.email} for ₹${payment.amount}`)
    } catch (error: any) {
      console.error(`[FeeReminderService] Error sending payment confirmation: ${error.message}`)
      throw error
    }
  }

  // Get fee statistics for reporting
  async getFeeStatistics(): Promise<{
    totalStudents: number
    studentsWithPendingFees: number
    totalOverdueAmount: number
    overdueStudents: number
  }> {
    try {
      await connectDB()

      const students = await Student.find({ status: 'Active' }).lean()

      let studentsWithPendingFees = 0
      let totalOverdueAmount = 0
      let overdueStudents = 0

      for (const student of students) {
        const hasPendingFees = student.dueAmount > 0 || student.paymentStatus === 'Due' || student.paymentStatus === 'Overdue'

        if (hasPendingFees) {
          studentsWithPendingFees++

          if (student.paymentStatus === 'Overdue') {
            overdueStudents++
            totalOverdueAmount += student.dueAmount || 0
          }
        }
      }

      return {
        totalStudents: students.length,
        studentsWithPendingFees,
        totalOverdueAmount,
        overdueStudents
      }
    } catch (error: any) {
      console.error(`[FeeReminderService] Error getting fee statistics: ${error.message}`)
      return {
        totalStudents: 0,
        studentsWithPendingFees: 0,
        totalOverdueAmount: 0,
        overdueStudents: 0
      }
    }
  }
}

// Export singleton instance
export const feeReminderService = new FeeReminderService()