import * as cron from 'node-cron'
import { feeReminderService, FeeReminderResult } from './fee-reminder-service'
import { emailService } from './email-service'

export class SchedulerService {
  private jobs: Map<string, cron.ScheduledTask> = new Map()

  constructor() {
    this.initializeJobs()
  }

  // Initialize all scheduled jobs
  private initializeJobs() {
    // Monthly fee reminders - runs on the 1st of every month at 9:00 AM
    this.scheduleMonthlyFeeReminders()

    // Daily overdue fee reminders - runs every day at 10:00 AM
    this.scheduleDailyOverdueReminders()

    console.log('[SchedulerService] All cron jobs initialized')
  }

  // Schedule monthly fee reminders (1st of every month at 9:00 AM)
  private scheduleMonthlyFeeReminders() {
    const job = cron.schedule('0 9 1 * *', async () => {
      console.log('[SchedulerService] Running monthly fee reminders...')

      try {
        const result: FeeReminderResult = await feeReminderService.sendMonthlyFeeReminders()

        // Log results
        console.log(`[SchedulerService] Monthly fee reminders completed:`)
        console.log(`  - Total students: ${result.totalStudents}`)
        console.log(`  - Reminders sent: ${result.remindersSent}`)
        console.log(`  - Overdue reminders sent: ${result.overdueRemindersSent}`)
        console.log(`  - Errors: ${result.errors.length}`)

        if (result.errors.length > 0) {
          console.log('  - Error details:', result.errors)
        }

        // Send admin notification about the results
        await this.sendAdminNotification('Monthly Fee Reminders Report', result)

      } catch (error: any) {
        console.error('[SchedulerService] Error in monthly fee reminders:', error)

        // Send admin error notification
        await this.sendAdminErrorNotification('Monthly Fee Reminders Failed', error.message)
      }
    }, {
      timezone: "Asia/Kolkata" // IST timezone
    })

    this.jobs.set('monthly-fee-reminders', job)
    console.log('[SchedulerService] Monthly fee reminders scheduled (1st of every month at 9:00 AM IST)')
  }

  // Schedule daily overdue fee reminders (every day at 10:00 AM)
  private scheduleDailyOverdueReminders() {
    const job = cron.schedule('0 10 * * *', async () => {
      console.log('[SchedulerService] Running daily overdue fee reminders...')

      try {
        // Only send reminders for severely overdue fees (more than 7 days)
        const result: FeeReminderResult = await feeReminderService.sendMonthlyFeeReminders()

        // Filter for only overdue reminders
        const overdueResult: FeeReminderResult = {
          totalStudents: result.totalStudents,
          remindersSent: 0, // We don't send regular reminders daily
          overdueRemindersSent: result.overdueRemindersSent,
          errors: result.errors
        }

        if (overdueResult.overdueRemindersSent > 0) {
          console.log(`[SchedulerService] Daily overdue reminders sent: ${overdueResult.overdueRemindersSent}`)

          // Send admin notification
          await this.sendAdminNotification('Daily Overdue Fee Reminders Report', overdueResult)
        }

      } catch (error: any) {
        console.error('[SchedulerService] Error in daily overdue reminders:', error)

        // Send admin error notification
        await this.sendAdminErrorNotification('Daily Overdue Reminders Failed', error.message)
      }
    }, {
      timezone: "Asia/Kolkata" // IST timezone
    })

    this.jobs.set('daily-overdue-reminders', job)
    console.log('[SchedulerService] Daily overdue reminders scheduled (every day at 10:00 AM IST)')
  }

  // Send admin notification about job results
  private async sendAdminNotification(subject: string, result: FeeReminderResult): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail) {
      console.warn('[SchedulerService] ADMIN_EMAIL not configured, skipping admin notification')
      return
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">${subject}</h1>
          <p style="color: #e8e8e8; margin: 10px 0 0 0;">Versai Library Management System</p>
        </div>

        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Job Execution Summary</h2>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Total Students:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${result.totalStudents}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Regular Reminders Sent:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #059669;">${result.remindersSent}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Overdue Reminders Sent:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: ${result.overdueRemindersSent > 0 ? '#dc2626' : '#059669'};">${result.overdueRemindersSent}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Errors:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: ${result.errors.length > 0 ? '#dc2626' : '#059669'};">${result.errors.length}</td>
              </tr>
            </table>
          </div>

          ${result.errors.length > 0 ? `
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #dc2626;">⚠️ Errors Encountered</h4>
            <ul style="margin: 10px 0; padding-left: 20px; color: #374151;">
              ${result.errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
          </div>
          ` : ''}

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280;">
            <p style="margin: 0;">
              This is an automated report from the Library Management System.
            </p>
            <p style="margin: 10px 0 0 0;">
              Generated on ${new Date().toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© 2026 Versai Library Management System. All rights reserved.</p>
        </div>
      </div>
    `

    try {
      await emailService.sendEmail(adminEmail, subject, html)
    } catch (error) {
      console.error('[SchedulerService] Failed to send admin notification email:', error)
    }
  }

  // Send admin error notification
  private async sendAdminErrorNotification(subject: string, errorMessage: string): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail) {
      console.warn('[SchedulerService] ADMIN_EMAIL not configured, skipping admin error notification')
      return
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">🚨 ${subject}</h1>
          <p style="color: #fecaca; margin: 10px 0 0 0;">Versai Library Management System</p>
        </div>

        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #dc2626; margin-top: 0;">System Error Alert</h2>

          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; color: #374151;">
              <strong>Error Details:</strong><br>
              ${errorMessage}
            </p>
          </div>

          <div style="background: #eff6ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #1e40af;">Recommended Actions</h4>
            <ul style="margin: 10px 0; padding-left: 20px; color: #374151;">
              <li>Check system logs for more details</li>
              <li>Verify database connectivity</li>
              <li>Ensure email service is configured correctly</li>
              <li>Review recent system changes</li>
            </ul>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280;">
            <p style="margin: 0;">
              This is an automated error notification from the Library Management System.
            </p>
            <p style="margin: 10px 0 0 0;">
              Generated on ${new Date().toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© 2026 Versai Library Management System. All rights reserved.</p>
        </div>
      </div>
    `

    try {
      await emailService.sendEmail(adminEmail, `🚨 ${subject}`, html)
    } catch (error) {
      console.error('[SchedulerService] Failed to send admin error notification email:', error)
    }
  }

  // Manual trigger methods for testing
  async triggerMonthlyFeeReminders(): Promise<FeeReminderResult> {
    console.log('[SchedulerService] Manually triggering monthly fee reminders...')
    return await feeReminderService.sendMonthlyFeeReminders()
  }

  async triggerDailyOverdueReminders(): Promise<FeeReminderResult> {
    console.log('[SchedulerService] Manually triggering daily overdue reminders...')
    return await feeReminderService.sendMonthlyFeeReminders()
  }

  // Get job status (returns true if job is scheduled/active)
  getJobStatus(jobName: string): boolean {
    const job = this.jobs.get(jobName)
    return job !== undefined
  }

  // Stop all jobs (useful for testing or graceful shutdown)
  stopAllJobs(): void {
    console.log('[SchedulerService] Stopping all cron jobs...')
    for (const [name, job] of this.jobs) {
      job.stop()
      console.log(`[SchedulerService] Stopped job: ${name}`)
    }
    this.jobs.clear()
  }

  // Restart jobs (useful for testing)
  restartJobs(): void {
    console.log('[SchedulerService] Restarting all cron jobs...')
    this.stopAllJobs()
    this.initializeJobs()
  }
}

// Export singleton instance
export const schedulerService = new SchedulerService()