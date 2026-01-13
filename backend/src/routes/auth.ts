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

// Register face for user (stores face descriptor)
router.post("/register-face", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const { faceDescriptor } = req.body

    if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return res.status(400).json({ error: "Invalid face descriptor" })
    }

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    user.faceDescriptor = faceDescriptor
    user.faceRegistered = true
    user.faceRegistrationDate = new Date()
    await user.save()

    return res.json({
      message: "Face registered successfully",
      faceRegistered: true,
      registrationDate: user.faceRegistrationDate
    })
  } catch (error: any) {
    console.error("[backend] Error registering face:", error)
    return res.status(500).json({ error: error.message })
  }
})

// Verify face for attendance
router.post("/verify-face", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const { faceDescriptor } = req.body

    if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return res.status(400).json({ error: "Invalid face descriptor" })
    }

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    if (!user.faceRegistered || !user.faceDescriptor) {
      return res.status(400).json({ error: "Face not registered for this user" })
    }

    // Calculate Euclidean distance between stored and provided face descriptors
    const storedDescriptor = user.faceDescriptor
    let distance = 0
    for (let i = 0; i < 128; i++) {
      distance += Math.pow(storedDescriptor[i] - faceDescriptor[i], 2)
    }
    distance = Math.sqrt(distance)

    // Face recognition threshold (lower = more strict, higher = more lenient)
    const threshold = 0.6
    const isMatch = distance < threshold

    return res.json({
      verified: isMatch,
      confidence: 1 - (distance / threshold), // Normalize confidence
      distance: distance,
      threshold: threshold
    })
  } catch (error: any) {
    console.error("[backend] Error verifying face:", error)
    return res.status(500).json({ error: error.message })
  }
})

// Check if user has registered face
router.get("/face-status", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const user = await User.findById(req.user.id).select('faceRegistered faceRegistrationDate')
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    return res.json({
      faceRegistered: user.faceRegistered,
      registrationDate: user.faceRegistrationDate
    })
  } catch (error: any) {
    console.error("[backend] Error checking face status:", error)
    return res.status(500).json({ error: error.message })
  }
})

export default router

