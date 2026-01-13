import express, { Response } from "express"
import connectDB from "../config/db"
import Payment from "../models/Payment"
import Student from "../models/Student"
import User from "../models/User"
import { authMiddleware, roleMiddleware, AuthRequest } from "../config/auth"

const router = express.Router()

router.get("/", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()
    const payments = await Payment.find({}).populate("student").sort({ date: -1 })
    return res.json(payments)
  } catch (error: any) {
    console.error("[backend] Error fetching payments:", error)
    return res.status(500).json({ error: error.message })
  }
})

router.post("/", authMiddleware, roleMiddleware(["Admin", "Student"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()
    const data = req.body

    let studentId = data.student

    // If student is creating payment, use their own student ID
    if (req.user?.role === "Student") {
      const user = await (await import("../models/User")).default.findById(req.user.id)
      if (!user?.studentId) {
        return res.status(400).json({ error: "Student profile not found" })
      }
      studentId = user.studentId
    }

    const payment = await Payment.create({
      student: studentId,
      amount: data.amount,
      mode: data.mode || data.paymentMode,
      status: data.status || "Fully Paid",
      date: data.date || new Date(),
    })

    const student = await Student.findById(studentId)
    if (student) {
      student.amountPaid += data.amount
      student.dueAmount = Math.max(0, student.totalAmount - student.amountPaid)

      if (student.dueAmount <= 0) {
        student.paymentStatus = "Fully Paid"
      } else if (student.amountPaid > 0) {
        student.paymentStatus = "Half Paid"
      }

      await student.save()
    }

    return res.status(201).json(payment)
  } catch (error: any) {
    console.error("[backend] Error processing payment:", error)
    return res.status(400).json({ error: error.message })
  }
})

router.get("/me", authMiddleware, roleMiddleware(["Student"]), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    await connectDB()

    // Find student profile
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    let student = null
    if (user.studentId) {
      student = await Student.findById(user.studentId)
    }
    
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

    const payments = await Payment.find({ student: student._id }).sort({ date: -1 })
    return res.json(payments)
  } catch (error: any) {
    console.error("[backend] Error fetching my payments:", error)
    return res.status(500).json({ error: error.message })
  }
})

export default router

