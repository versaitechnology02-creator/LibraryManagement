import express, { Response } from "express"
import connectDB from "../config/db"
import Desk from "../models/Desk"
import { authMiddleware, roleMiddleware, AuthRequest } from "../config/auth"

const router = express.Router()

router.get("/", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()
    const desks = await Desk.find({}).populate("assignedStudent")
    return res.json(desks)
  } catch (error: any) {
    console.error("[backend] Error fetching desks:", error)
    return res.status(500).json({ error: error.message })
  }
})

router.post("/", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()
    const data = req.body
    const desk = await Desk.create(data)
    return res.status(201).json(desk)
  } catch (error: any) {
    console.error("[backend] Error creating desk:", error)
    return res.status(400).json({ error: error.message })
  }
})

router.put("/:id", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()
    const { id } = req.params
    const data = req.body
    const desk = await Desk.findByIdAndUpdate(id, data, { new: true })
    if (!desk) {
      return res.status(404).json({ error: "Desk not found" })
    }
    return res.json(desk)
  } catch (error: any) {
    console.error("[backend] Error updating desk:", error)
    return res.status(400).json({ error: error.message })
  }
})

router.delete("/:id", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()
    const { id } = req.params
    const desk = await Desk.findByIdAndDelete(id)
    if (!desk) {
      return res.status(404).json({ error: "Desk not found" })
    }
    return res.json({ message: "Desk deleted successfully" })
  } catch (error: any) {
    console.error("[backend] Error deleting desk:", error)
    return res.status(400).json({ error: error.message })
  }
})

export default router

