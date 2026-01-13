import express, { Request, Response } from "express"
import connectDB from "../config/db"
import QRSession from "../models/QRSession"
import { authMiddleware, roleMiddleware, AuthRequest } from "../config/auth"
import crypto from "crypto"

const router = express.Router()

// Create daily QR session (Admin only)
router.post("/", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    await connectDB()

    const locationRequired = Boolean(req.body.locationRequired)

    // Create QR session that expires at end of today
    const now = new Date()
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    const qrToken = crypto.randomBytes(16).toString("hex")

    // Check if there's already an active QR session for today
    const existingSession = await QRSession.findOne({
      createdBy: req.user.id,
      expiresAt: { $gt: now },
      createdAt: {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
      }
    })

    if (existingSession) {
      return res.json({
        qrToken: existingSession.qrToken,
        expiresAt: existingSession.expiresAt,
        locationRequired: existingSession.locationRequired,
        message: "Using existing active QR session for today"
      })
    }

    const qrSession = await QRSession.create({
      qrToken,
      expiresAt: endOfDay,
      createdBy: req.user.id,
      locationRequired,
    })

    return res.status(201).json({
      qrToken: qrSession.qrToken,
      expiresAt: qrSession.expiresAt,
      locationRequired: qrSession.locationRequired,
      message: "New daily QR session created"
    })
  } catch (error: any) {
    console.error("[backend] Error creating QR session:", error)
    return res.status(500).json({ error: error.message })
  }
})

// Validate QR token (Public endpoint for attendance scanning)
router.post("/validate", async (req: Request, res: Response) => {
  try {
    await connectDB()

    const { qrToken } = req.body

    if (!qrToken) {
      return res.status(400).json({ error: "QR token is required" })
    }

    const qrSession = await QRSession.findOne({
      qrToken,
      expiresAt: { $gt: new Date() }
    })

    if (!qrSession) {
      return res.status(400).json({ error: "Invalid or expired QR code" })
    }

    return res.json({
      valid: true,
      locationRequired: qrSession.locationRequired,
      expiresAt: qrSession.expiresAt
    })
  } catch (error: any) {
    console.error("[backend] Error validating QR token:", error)
    return res.status(500).json({ error: error.message })
  }
})

// Get active QR session (Admin only)
router.get("/active", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const now = new Date()
    const qrSession = await QRSession.findOne({
      createdBy: req.user.id,
      expiresAt: { $gt: now },
      createdAt: {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
      }
    }).sort({ createdAt: -1 })

    if (!qrSession) {
      return res.json({ active: false, message: "No active QR session for today" })
    }

    return res.json({
      active: true,
      qrToken: qrSession.qrToken,
      expiresAt: qrSession.expiresAt,
      locationRequired: qrSession.locationRequired,
      createdAt: qrSession.createdAt
    })
  } catch (error: any) {
    console.error("[backend] Error fetching active QR session:", error)
    return res.status(500).json({ error: error.message })
  }
})

export default router

