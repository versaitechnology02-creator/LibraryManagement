import express, { Response } from "express"
import connectDB from "../config/db"
import User from "../models/User"
import Student from "../models/Student"
import Payment from "../models/Payment"
import { authMiddleware, roleMiddleware, AuthRequest } from "../config/auth"

const router = express.Router()

function getMonthRangeForDate(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1)
  return { start, end }
}

router.get("/me", authMiddleware, roleMiddleware(["Student"]), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    await connectDB()

    const user = await User.findById(req.user.id).populate("studentId")
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    let student = user.studentId
    
    // If student profile doesn't exist, create it
    if (!student) {
      const StudentModel = (await import("../models/Student")).default
      student = await StudentModel.create({
        fullName: user.name,
        studentId: `STU${Date.now()}`,
        phone: "0000000000",
        email: user.email,
        membershipStart: new Date(),
        membershipEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        paymentPlan: "Monthly",
        totalAmount: 1000,
        dueAmount: 1000,
      })
      user.studentId = student._id
      await user.save()
    }

    const now = new Date()
    const { start, end } = getMonthRangeForDate(now)

    const paymentsThisMonth = await Payment.find({
      student: student._id,
      date: { $gte: start, $lt: end },
    }).sort({ date: -1 })

    const allPayments = await Payment.find({ student: student._id }).sort({ date: -1 })

    let monthlyFee = student.totalAmount
    if (student.paymentPlan === "Yearly") {
      monthlyFee = student.totalAmount / 12
    } else if (student.paymentPlan === "Quarterly") {
      monthlyFee = student.totalAmount / 3
    }

    const amountPaidThisMonth = paymentsThisMonth.reduce((sum: number, p: any) => sum + p.amount, 0)
    const dueAmount = Math.max(0, monthlyFee - amountPaidThisMonth)

    let paymentStatus: "Paid" | "Due" | "Overdue"
    const endOfMonth = end

    if (dueAmount <= 0) {
      paymentStatus = "Paid"
    } else if (now <= endOfMonth) {
      paymentStatus = "Due"
    } else {
      paymentStatus = "Overdue"
    }

    const lastPaymentDate = allPayments[0]?.date ?? null
    const nextDueDate = end // End of current month

    return res.json({
      monthlyFee,
      amountPaid: amountPaidThisMonth,
      dueAmount,
      paymentStatus,
      lastPaymentDate,
      nextDueDate,
    })
  } catch (error: any) {
    console.error("[backend] Error fetching student fee status:", error)
    return res.status(500).json({ error: error.message })
  }
})

export default router

