import express, { Response } from "express"
import connectDB from "../config/db"
import User from "../models/User"
import Student from "../models/Student"
import Staff from "../models/Staff"
import { authMiddleware, AuthRequest } from "../config/auth"

const router = express.Router()

router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    await connectDB()

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    if (user.role === "Student") {
      let student = null;
      
      if (user.studentId) {
        student = await Student.findById(user.studentId).populate("desk").populate("shift")
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

      return res.json({
        role: "Student",
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
        },
        student,
      })
    }

    if (user.role === "Staff") {
      const staff = await Staff.findOne({ user: user._id })
      if (!staff) {
        return res.status(404).json({ error: "Staff profile not found" })
      }

      return res.json({
        role: "Staff",
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
        },
        staff,
      })
    }

    return res.json({
      role: "Admin",
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
      },
    })
  } catch (error: any) {
    console.error("[backend] Error fetching profile:", error)
    return res.status(500).json({ error: error.message })
  }
})

export default router

