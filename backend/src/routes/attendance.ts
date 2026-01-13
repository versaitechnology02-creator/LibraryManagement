import express, { Response } from "express"
import connectDB from "../config/db"
import Attendance from "../models/Attendance"
import QRSession from "../models/QRSession"
import { authMiddleware, roleMiddleware, AuthRequest } from "../config/auth"

const router = express.Router()

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// QR-based attendance (Student/Staff)
router.post("/qr", authMiddleware, roleMiddleware(["Student", "Staff"]), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const role = req.user.role
    const { qrToken, location } = req.body as {
      qrToken: string
      location?: { lat?: number; lng?: number; address?: string }
    }

    if (!qrToken) {
      return res.status(400).json({ error: "QR token is required" })
    }

    await connectDB()

    // Validate QR token
    const qrSession = await QRSession.findOne({
      qrToken,
      expiresAt: { $gt: new Date() }
    })

    if (!qrSession) {
      return res.status(400).json({ error: "Invalid or expired QR code" })
    }

    // Check if location is required
    if (qrSession.locationRequired) {
      if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") {
        return res.status(400).json({ error: "Location is required for this QR session" })
      }
    }

    const today = startOfDay(new Date())

    // Check for existing attendance (prevent duplicates)
    const existing = await Attendance.findOne({
      user: req.user.id,
      role,
      date: today,
      status: "Present",
    })

    if (existing) {
      return res.status(409).json({
        error: "Attendance already marked for today",
        attendance: existing
      })
    }

    // Create attendance record
    const record = await Attendance.create({
      user: req.user.id,
      role,
      date: today,
      checkInTime: new Date(),
      method: "QR",
      location: location ? {
        lat: location.lat,
        lng: location.lng,
        address: location.address,
      } : undefined,
      status: "Present",
    })

    return res.status(201).json({
      message: "Attendance marked successfully",
      attendance: record,
      qrValid: true
    })
  } catch (error: any) {
    console.error("[backend] Error in QR attendance:", error)
    return res.status(500).json({ error: error.message })
  }
})

// Self attendance (Student/Staff) - Legacy endpoint, keeping for backward compatibility
router.post("/self", authMiddleware, roleMiddleware(["Student", "Staff"]), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const role = req.user.role
    const body = req.body as {
      location?: { lat?: number; lng?: number; address?: string }
      faceMatch?: boolean
    }

    const location = body?.location
    const faceMatch = body?.faceMatch

    if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") {
      return res.status(400).json({ error: "Location required" })
    }

    await connectDB()

    const today = startOfDay(new Date())

    const existing = await Attendance.findOne({
      user: req.user.id,
      role,
      date: today,
      status: "Present",
    })

    if (existing) {
      return res.json(existing)
    }

    if (role === "Student") {
      const record = await Attendance.create({
        user: req.user.id,
        role,
        date: today,
        checkInTime: new Date(),
        method: "QR",
        location: {
          lat: location.lat,
          lng: location.lng,
          address: location.address,
        },
        status: "Present",
      })

      return res.status(201).json(record)
    }

    if (role === "Staff") {
      if (!faceMatch) {
        return res.json({ requiresFaceVerification: true })
      }

      const record = await Attendance.create({
        user: req.user.id,
        role,
        date: today,
        checkInTime: new Date(),
        method: "FACE",
        location: {
          lat: location.lat,
          lng: location.lng,
          address: location.address,
        },
        status: "Present",
      })

      return res.status(201).json(record)
    }

    return res.status(400).json({ error: "Unsupported role" })
  } catch (error: any) {
    console.error("[backend] Error in self attendance:", error)
    return res.status(500).json({ error: error.message })
  }
})

// Get own attendance (Student/Staff)
router.get("/me", authMiddleware, roleMiddleware(["Student", "Staff"]), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    await connectDB()

    const limit = Number(req.query.limit) || 60

    const records = await Attendance.find({
      user: req.user.id,
      role: req.user.role,
    })
      .sort({ date: -1 })
      .limit(limit)

    return res.json(records)
  } catch (error: any) {
    console.error("[backend] Error fetching self attendance:", error)
    return res.status(500).json({ error: error.message })
  }
})

// Admin: Get all attendance
router.get("/", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()
    const dateParam = (req.query.date as string) || new Date().toISOString().split("T")[0]
    const day = new Date(dateParam)
    day.setHours(0, 0, 0, 0)

    const nextDay = new Date(day)
    nextDay.setDate(day.getDate() + 1)

    const attendance = await Attendance.find({
      date: { $gte: day, $lt: nextDay },
    })
      .populate("student")
      .populate("user")

    return res.json(attendance)
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
})

// Admin: Manual override
router.post("/", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()
    const data = req.body

    const day = new Date(data.date || new Date().toISOString().split("T")[0])
    day.setHours(0, 0, 0, 0)

    const attendance = await Attendance.findOneAndUpdate(
      { student: data.student, date: day },
      {
        status: data.status,
      },
      { upsert: true, new: true },
    )

    return res.json(attendance)
  } catch (error: any) {
    return res.status(400).json({ error: error.message })
  }
})

export default router

