import express, { Response } from "express"
import connectDB from "../config/db"
import Shift from "../models/Shift"
import { authMiddleware, roleMiddleware, AuthRequest } from "../config/auth"

const router = express.Router()

router.get("/", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()
    const shifts = await Shift.find({})
    return res.json(shifts)
  } catch (error: any) {
    console.error("[backend] Error fetching shifts:", error)
    return res.status(500).json({ error: error.message })
  }
})

router.post("/", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()
    const data = req.body
    const shift = await Shift.create(data)
    return res.status(201).json(shift)
  } catch (error: any) {
    console.error("[backend] Error creating shift:", error)
    return res.status(400).json({ error: error.message })
  }
})

export default router

