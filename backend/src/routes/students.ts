import express, { Response } from "express"
import connectDB from "../config/db"
import Student from "../models/Student"
import Attendance from "../models/Attendance"
import Payment from "../models/Payment"
import User from "../models/User"
import Shift from "../models/Shift"
import { authMiddleware, roleMiddleware, AuthRequest } from "../config/auth"
import jsPDF from "jspdf"

const router = express.Router()

// Get all students with attendance and fee summaries (Admin only)
router.get("/admin", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()

    const students = await Student.find({})
      .populate("desk")
      .populate("shift")
      .populate({
        path: "user",
        select: "name email"
      })

    // Get current month for attendance calculation
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

    const studentsWithDetails = await Promise.all(
      students.map(async (student: any) => {
        // Get attendance summary for current month
        const monthlyAttendance = await Attendance.find({
          student: student._id,
          date: {
            $gte: new Date(now.getFullYear(), now.getMonth(), 1),
            $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
          }
        })

        const presentDays = monthlyAttendance.filter(a => a.status === "Present").length
        const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

        // Get fee status
        const lastPayment = await Payment.findOne({ student: student._id })
          .sort({ date: -1 })
          .limit(1)

        return {
          ...student.toObject(),
          attendanceSummary: {
            presentDays,
            totalDays,
            percentage: attendancePercentage
          },
          feeStatus: {
            status: student.paymentStatus,
            lastPaymentDate: lastPayment?.date || null,
            amountPaid: student.amountPaid,
            dueAmount: student.dueAmount
          }
        }
      })
    )

    return res.json(studentsWithDetails)
  } catch (error: any) {
    console.error("[backend] Error fetching admin students:", error)
    return res.status(500).json({ error: error.message })
  }
})

// Get single student full details (Admin only)
router.get("/admin/:id", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()
    const { id } = req.params

    const student = await Student.findById(id)
      .populate("desk")
      .populate("shift")
      .populate({
        path: "user",
        select: "name email"
      })

    if (!student) {
      return res.status(404).json({ error: "Student not found" })
    }

    // Get attendance history (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const attendanceHistory = await Attendance.find({
      student: student._id,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: -1 })

    // Get payment history
    const paymentHistory = await Payment.find({ student: student._id })
      .sort({ date: -1 })
      .limit(10)

    return res.json({
      ...student.toObject(),
      attendanceHistory,
      paymentHistory
    })
  } catch (error: any) {
    console.error("[backend] Error fetching student details:", error)
    return res.status(500).json({ error: error.message })
  }
})

// Update fee status (Admin only)
router.put("/admin/:id/fee-status", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()
    const { id } = req.params
    const { status, amountPaid, dueAmount } = req.body

    const student = await Student.findById(id)
    if (!student) {
      return res.status(404).json({ error: "Student not found" })
    }

    // Update fee status
    if (status) student.paymentStatus = status
    if (amountPaid !== undefined) student.amountPaid = amountPaid
    if (dueAmount !== undefined) student.dueAmount = dueAmount

    await student.save()

    return res.json({
      message: "Fee status updated successfully",
      student
    })
  } catch (error: any) {
    console.error("[backend] Error updating fee status:", error)
    return res.status(500).json({ error: error.message })
  }
})

// Generate fee receipt PDF (Admin only)
router.post("/admin/:id/fee-receipt", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()
    const { id } = req.params
    const { paymentId, month } = req.body

    const student = await Student.findById(id).populate({
      path: "user",
      select: "name email"
    })

    if (!student) {
      return res.status(404).json({ error: "Student not found" })
    }

    let payment
    if (paymentId) {
      payment = await Payment.findById(paymentId)
    } else {
      // Get latest payment
      payment = await Payment.findOne({ student: student._id }).sort({ date: -1 })
    }

    if (!payment) {
      return res.status(404).json({ error: "No payment found for this student" })
    }

    // Generate PDF receipt
    const doc = new jsPDF()
    const receiptNumber = `REC-${Date.now()}`

    // Header
    doc.setFontSize(20)
    doc.text("Versai Library Management", 20, 30)
    doc.setFontSize(16)
    doc.text("Fee Payment Receipt", 20, 45)

    // Receipt details
    doc.setFontSize(12)
    doc.text(`Receipt Number: ${receiptNumber}`, 20, 65)
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 80)

    // Student details
    doc.text("Student Details:", 20, 100)
    doc.text(`Name: ${student.fullName}`, 30, 115)
    doc.text(`Student ID: ${student.studentId}`, 30, 130)
    doc.text(`Email: ${(student as any).user?.email || 'N/A'}`, 30, 145)

    // Payment details
    doc.text("Payment Details:", 20, 165)
    doc.text(`Amount Paid: ₹${payment.amount}`, 30, 180)
    doc.text(`Payment Date: ${new Date(payment.date).toLocaleDateString()}`, 30, 195)
    doc.text(`Payment Mode: ${payment.mode}`, 30, 210)
    doc.text(`Month: ${month || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`, 30, 225)

    // Footer
    doc.text("Thank you for your payment!", 20, 250)
    doc.text("Versai Library Management System", 20, 265)

    // Convert to base64 for response
    const pdfBuffer = doc.output('arraybuffer')
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64')

    return res.json({
      message: "Receipt generated successfully",
      receiptNumber,
      pdfData: `data:application/pdf;base64,${pdfBase64}`,
      student: student.fullName,
      amount: payment.amount,
      date: payment.date
    })
  } catch (error: any) {
    console.error("[backend] Error generating receipt:", error)
    return res.status(500).json({ error: error.message })
  }
})

// Generate unique student ID (Admin only)
router.post("/admin/:id/generate-id", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()
    const { id } = req.params

    const student = await Student.findById(id)
    if (!student) {
      return res.status(404).json({ error: "Student not found" })
    }

    if (student.studentId) {
      return res.json({
        message: "Student ID already exists",
        studentId: student.studentId
      })
    }

    // Generate unique student ID
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const studentId = `STU${timestamp}${random}`

    student.studentId = studentId
    await student.save()

    return res.json({
      message: "Student ID generated successfully",
      studentId
    })
  } catch (error: any) {
    console.error("[backend] Error generating student ID:", error)
    return res.status(500).json({ error: error.message })
  }
})

// Legacy routes (keep existing functionality)
router.get("/", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()
    const students = await Student.find({}).populate("desk").populate("shift")
    return res.json(students)
  } catch (error: any) {
    console.error("[backend] Error fetching students:", error)
    return res.status(500).json({ error: error.message })
  }
})

router.post("/", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()
    const data = req.body

    // Validate shift capacity if shift is provided
    if (data.shift) {
      const shift = await Shift.findById(data.shift)
      if (!shift) {
        return res.status(400).json({ error: "Selected shift does not exist" })
      }

      if (shift.currentCount >= shift.maxCapacity) {
        return res.status(400).json({
          error: `Shift "${shift.name}" is at full capacity (${shift.maxCapacity} students). Please select a different shift.`
        })
      }
    }

    // Create the student
    const student = await Student.create(data)

    // Increment shift count if shift was assigned
    if (data.shift) {
      await Shift.findByIdAndUpdate(data.shift, { $inc: { currentCount: 1 } })
    }

    return res.status(201).json(student)
  } catch (error: any) {
    console.error("[backend] Error creating student:", error)
    return res.status(400).json({ error: error.message })
  }
})

export default router

