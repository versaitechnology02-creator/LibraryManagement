import express, { Response } from "express"
import connectDB from "../config/db"
import Staff from "../models/Staff"
import Salary from "../models/Salary"
import Attendance from "../models/Attendance"
import { authMiddleware, roleMiddleware, AuthRequest } from "../config/auth"

const router = express.Router()

function getMonthRange(month: string) {
  const [yearStr, monthStr] = month.split("-")
  const year = Number(yearStr)
  const m = Number(monthStr) - 1
  const start = new Date(year, m, 1)
  const end = new Date(year, m + 1, 1)
  return { start, end }
}

// Staff: Get own salary
router.get("/me", authMiddleware, roleMiddleware(["Staff"]), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    await connectDB()

    const staff = await Staff.findOne({ user: req.user.id })
    if (!staff) {
      return res.status(404).json({ error: "Staff profile not found" })
    }

    const salaries = await Salary.find({ staff: staff._id }).sort({ month: -1 })

    return res.json(salaries)
  } catch (error: any) {
    console.error("[backend] Error fetching staff salary records:", error)
    return res.status(500).json({ error: error.message })
  }
})

// Admin: Calculate salaries
router.post("/calculate", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    const { month } = req.body

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Invalid or missing "month" (expected "YYYY-MM")' })
    }

    await connectDB()

    const { start, end } = getMonthRange(month)

    const staffMembers = await Staff.find({ active: true })

    const results: any[] = []

    for (const staff of staffMembers) {
      const presentCount = await Attendance.countDocuments({
        user: staff.user,
        role: "Staff",
        date: { $gte: start, $lt: end },
        status: "Present",
      })

      let calculatedAmount = 0
      if (staff.salaryType === "Daily") {
        calculatedAmount = presentCount * staff.baseSalary
      } else if (staff.salaryType === "Monthly") {
        calculatedAmount = staff.baseSalary
      }

      const existing = await Salary.findOne({ staff: staff._id, month })
      const status = existing?.status === "Paid" ? "Paid" : "Pending"

      const salaryRecord = await Salary.findOneAndUpdate(
        { staff: staff._id, month },
        {
          staff: staff._id,
          month,
          totalPresentDays: presentCount,
          calculatedAmount,
          status,
        },
        { upsert: true, new: true },
      ).populate("staff")

      results.push(salaryRecord)
    }

    return res.json({ month, records: results })
  } catch (error: any) {
    console.error("[backend] Error calculating salaries:", error)
    return res.status(500).json({ error: error.message })
  }
})

export default router

