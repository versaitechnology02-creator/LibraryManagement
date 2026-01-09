import express, { Response } from "express"
import connectDB from "../config/db"
import Student from "../models/Student"
import { authMiddleware, roleMiddleware, AuthRequest } from "../config/auth"

const router = express.Router()

router.get("/", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()
    const students = await Student.find({}).populate("desk").populate("shift")
    return res.json(students)
  } catch (error: any) {
    console.error("[backend] Error fetching students:", error)
    return res.status(500).json({ error: error.message })
  }
})

router.post("/", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()
    const data = req.body
    const student = await Student.create(data)
    return res.status(201).json(student)
  } catch (error: any) {
    console.error("[backend] Error creating student:", error)
    return res.status(400).json({ error: error.message })
  }
})

export default router

