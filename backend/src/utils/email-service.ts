import nodemailer from 'nodemailer'

// Email configuration interface
interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

// Email service class
export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    // Email configuration - in production, these should come from environment variables
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    }

    this.transporter = nodemailer.createTransport(config)
  }

  // Send email method
  // WHY: Changed from returning boolean to throwing errors for better error handling
  // and to provide detailed SMTP error messages to the client
  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text: text || this.stripHtml(html)
    }

    const result = await this.transporter.sendMail(mailOptions)
    console.log(`[EmailService] Email sent successfully to ${to}: ${result.messageId}`)
  }

  // Send fee reminder email
  async sendFeeReminder(
    to: string,
    studentName: string,
    dueAmount: number,
    dueDate: string,
    daysOverdue?: number
  ): Promise<void> {
    const subject = daysOverdue
      ? `Library Fee Payment Overdue - ${daysOverdue} days past due`
      : 'Library Monthly Fee Reminder'

    const status = daysOverdue ? 'OVERDUE' : 'DUE SOON'
    const urgency = daysOverdue ? 'overdue' : 'due'

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Versai Library Management</h1>
          <p style="color: #e8e8e8; margin: 10px 0 0 0;">Fee Payment Reminder</p>
        </div>

        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hello ${studentName},</h2>

          <div style="background: ${daysOverdue ? '#fee2e2' : '#fef3c7'}; border: 1px solid ${daysOverdue ? '#fecaca' : '#fde68a'}; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <span style="background: ${daysOverdue ? '#dc2626' : '#d97706'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                ${status}
              </span>
            </div>
            <p style="margin: 0; color: #374151; font-size: 16px;">
              Your monthly library fee of <strong>₹${dueAmount}</strong> is ${urgency}.
            </p>
            ${daysOverdue ? `<p style="margin: 10px 0 0 0; color: #dc2626; font-weight: bold;">Days overdue: ${daysOverdue}</p>` : ''}
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">Payment Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Amount Due:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #1f2937;">₹${dueAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Due Date:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #1f2937;">${dueDate}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/fees"
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Pay Now
            </a>
          </div>

          <div style="background: #eff6ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #1e40af;">Payment Methods</h4>
            <ul style="margin: 10px 0; padding-left: 20px; color: #374151;">
              <li>Online Payment (Credit/Debit Card, UPI, Net Banking)</li>
              <li>Cash payment at library counter</li>
              <li>Bank transfer to library account</li>
            </ul>
          </div>

          ${daysOverdue ? `
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #dc2626;">⚠️ Important Notice</h4>
            <p style="margin: 10px 0; color: #374151;">
              Your library membership may be suspended if payment is not made within 7 days of the due date.
              Please make the payment as soon as possible to avoid service interruption.
            </p>
          </div>
          ` : ''}

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280;">
            <p style="margin: 0;">
              If you have already made the payment, please ignore this reminder.
            </p>
            <p style="margin: 10px 0 0 0;">
              For any queries, contact us at ${process.env.SUPPORT_EMAIL || 'support@versailibrary.com'}
            </p>
          </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© 2026 Versai Library Management System. All rights reserved.</p>
        </div>
      </div>
    `

    await this.sendEmail(to, subject, html)
  }

  // Send payment confirmation email
  async sendPaymentConfirmation(
    to: string,
    studentName: string,
    amount: number,
    paymentDate: string,
    nextDueDate: string
  ): Promise<void> {
    const subject = 'Library Fee Payment Confirmation'

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Payment Confirmed</h1>
          <p style="color: #ecfdf5; margin: 10px 0 0 0;">Versai Library Management</p>
        </div>

        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #065f46; margin-top: 0;">Thank you, ${studentName}!</h2>

          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <span style="background: #16a34a; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                ✓ PAID
              </span>
            </div>
            <p style="margin: 0; color: #166534; font-size: 16px;">
              Your payment of <strong>₹${amount}</strong> has been successfully processed.
            </p>
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">Payment Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Amount Paid:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #16a34a;">₹${amount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Payment Date:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #1f2937;">${paymentDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Next Due Date:</td>
                <td style="padding: 8px 0; text-align: right; color: #1f2937;">${nextDueDate}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/fees"
               style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View Payment History
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280;">
            <p style="margin: 0;">
              Thank you for being a valued member of our library community!
            </p>
          </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p>© 2026 Versai Library Management System. All rights reserved.</p>
        </div>
      </div>
    `

    await this.sendEmail(to, subject, html)
  }

  // Utility method to strip HTML for text version
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  }

  // Test email configuration
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      console.log('[EmailService] SMTP connection successful')
      return true
    } catch (error) {
      console.error('[EmailService] SMTP connection failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const emailService = new EmailService()