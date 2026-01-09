import express, { Response } from "express"
import connectDB from "../config/db"
import QRSession from "../models/QRSession"
import { authMiddleware, roleMiddleware, AuthRequest } from "../config/auth"
import crypto from "crypto"

const router = express.Router()

router.post("/", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    await connectDB()

    const expiresInSeconds = typeof req.body.expiresInSeconds === "number" ? req.body.expiresInSeconds : 120
    const locationRequired = Boolean(req.body.locationRequired)

    const qrToken = crypto.randomBytes(16).toString("hex")
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000)

    const qrSession = await QRSession.create({
      qrToken,
      expiresAt,
      createdBy: req.user.id,
      locationRequired,
    })

    return res.status(201).json({
      qrToken: qrSession.qrToken,
      expiresAt: qrSession.expiresAt,
      locationRequired: qrSession.locationRequired,
    })
  } catch (error: any) {
    console.error("[backend] Error creating QR session:", error)
    return res.status(500).json({ error: error.message })
  }
})

export default router

