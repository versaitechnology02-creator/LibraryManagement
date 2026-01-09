import express, { Request, Response } from "express"
import connectDB from "../config/db"
import User from "../models/User"
import { comparePassword, hashPassword } from "../utils/auth-utils"
import { generateToken, authMiddleware, AuthRequest } from "../config/auth"

const router = express.Router()

// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    await connectDB()
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const isMatch = await comparePassword(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    })

    res.cookie("session", token, {
      expires: new Date(Date.now() + 2 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })

    return res.json({
      message: "Login successful",
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role },
    })
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
})

// Signup
router.post("/signup", async (req: Request, res: Response) => {
  try {
    await connectDB()
    const { name, email, password, role } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" })
    }

    const hashedPassword = await hashPassword(password)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "Student",
    })

    // Create profile based on role
    if (user.role === "Student") {
      const Student = (await import("../models/Student")).default
      const student = await Student.create({
        fullName: name,
        studentId: `STU${Date.now()}`, // Generate unique ID
        phone: "0000000000", // Default phone number
        email,
        membershipStart: new Date(),
        membershipEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        paymentPlan: "Monthly",
        totalAmount: 1000, // Default
        dueAmount: 1000,
      })
      user.studentId = student._id
      await user.save()
    } else if (user.role === "Staff") {
      const Staff = (await import("../models/Staff")).default
      await Staff.create({
        user: user._id,
        designation: "Assistant", // Default
        salaryType: "Monthly",
        baseSalary: 15000, // Default
      })
    }

    return res.status(201).json({
      message: "User created successfully",
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role },
    })
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
})

// Logout
router.post("/logout", authMiddleware, (req: Request, res: Response) => {
  res.clearCookie("session")
  return res.json({ message: "Logged out" })
})

export default router

