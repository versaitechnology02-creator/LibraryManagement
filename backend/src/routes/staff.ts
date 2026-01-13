import express, { Response } from "express"
import connectDB from "../config/db"
import Staff from "../models/Staff"
import User from "../models/User"
import Attendance from "../models/Attendance"
import Salary from "../models/Salary"
import { authMiddleware, roleMiddleware, AuthRequest } from "../config/auth"

const router = express.Router()

// Get all staff with attendance and salary summaries (Admin only)
router.get("/admin", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()

    const staffMembers = await Staff.find({ active: true })
      .populate({
        path: "user",
        select: "name email"
      })

    // Get current month for attendance calculation
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

    const staffWithDetails = await Promise.all(
      staffMembers.map(async (staff: any) => {
        // Get attendance summary for current month
        const { start, end } = getMonthRange(currentMonth)
        const monthlyAttendance = await Attendance.find({
          user: staff.user._id,
          role: "Staff",
          date: { $gte: start, $lt: end },
          status: "Present"
        })

        const presentDays = monthlyAttendance.length
        const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

        // Get current month salary
        const currentSalary = await Salary.findOne({
          staff: staff._id,
          month: currentMonth
        })

        // Calculate expected salary for current month
        let expectedSalary = 0
        if (staff.salaryType === "Daily") {
          expectedSalary = presentDays * staff.baseSalary
        } else if (staff.salaryType === "Monthly") {
          expectedSalary = staff.baseSalary
        }

        return {
          ...staff.toObject(),
          attendanceSummary: {
            presentDays,
            totalDays,
            percentage: attendancePercentage
          },
          salaryInfo: {
            baseSalary: staff.baseSalary,
            salaryType: staff.salaryType,
            currentMonthSalary: currentSalary?.calculatedAmount || expectedSalary,
            currentMonthStatus: currentSalary?.status || "Not Calculated",
            lastCalculated: currentSalary?.updatedAt || null
          }
        }
      })
    )

    return res.json(staffWithDetails)
  } catch (error: any) {
    console.error("[backend] Error fetching admin staff:", error)
    return res.status(500).json({ error: error.message })
  }
})

// Get single staff full details (Admin only)
router.get("/admin/:id", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()
    const { id } = req.params

    const staff = await Staff.findById(id)
      .populate({
        path: "user",
        select: "name email"
      })

    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" })
    }

    // Get attendance history (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const attendanceHistory = await Attendance.find({
      user: staff.user._id,
      role: "Staff",
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: -1 })

    // Get salary history
    const salaryHistory = await Salary.find({ staff: staff._id })
      .sort({ month: -1 })
      .limit(12)

    return res.json({
      ...staff.toObject(),
      attendanceHistory,
      salaryHistory
    })
  } catch (error: any) {
    console.error("[backend] Error fetching staff details:", error)
    return res.status(500).json({ error: error.message })
  }
})

// Update staff salary information (Admin only)
router.put("/admin/:id/salary", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()
    const { id } = req.params
    const { baseSalary, salaryType, designation } = req.body

    const staff = await Staff.findById(id)
    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" })
    }

    // Update staff information
    if (baseSalary !== undefined) staff.baseSalary = baseSalary
    if (salaryType) staff.salaryType = salaryType
    if (designation) staff.designation = designation

    await staff.save()

    return res.json({
      message: "Staff salary information updated successfully",
      staff
    })
  } catch (error: any) {
    console.error("[backend] Error updating staff salary:", error)
    return res.status(500).json({ error: error.message })
  }
})

// Update salary payment status (Admin only)
router.put("/salary/admin/:id/status", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()
    const { id } = req.params
    const { status } = req.body

    if (!["Pending", "Paid"].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be 'Pending' or 'Paid'" })
    }

    const salary = await Salary.findById(id)
    if (!salary) {
      return res.status(404).json({ error: "Salary record not found" })
    }

    salary.status = status
    await salary.save()

    return res.json({
      message: "Salary payment status updated successfully",
      salary
    })
  } catch (error: any) {
    console.error("[backend] Error updating salary status:", error)
    return res.status(500).json({ error: error.message })
  }
})

// Get all salary records for admin view
router.get("/admin/salaries", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()

    const salaries = await Salary.find({})
      .populate({
        path: "staff",
        populate: {
          path: "user",
          select: "name email"
        }
      })
      .sort({ month: -1, updatedAt: -1 })

    return res.json(salaries)
  } catch (error: any) {
    console.error("[backend] Error fetching admin salaries:", error)
    return res.status(500).json({ error: error.message })
  }
})

// Create new staff member (Admin only)
// WHY: Missing CRUD operation for staff management, required for admin to add staff
router.post("/", authMiddleware, roleMiddleware(["Admin"]), async (req: AuthRequest, res: Response) => {
  try {
    await connectDB()
    const { name, email, password, designation, baseSalary, salaryType, shift } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" })
    }

    // Create user
    const hashedPassword = await (await import("../utils/auth-utils")).hashPassword(password)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "Staff",
    })

    // Create staff profile
    const staff = await Staff.create({
      user: user._id,
      designation: designation || "Assistant",
      baseSalary: baseSalary || 15000,
      salaryType: salaryType || "Monthly",
      shift: shift || null,
      active: true,
    })

    // Update user with staffId
    user.staffId = staff._id
    await user.save()

    return res.status(201).json({
      message: "Staff member created successfully",
      staff: {
        id: staff._id,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        designation: staff.designation,
        baseSalary: staff.baseSalary,
        salaryType: staff.salaryType,
        shift: staff.shift,
      },
    })
  } catch (error: any) {
    console.error("[backend] Error creating staff:", error)
    return res.status(500).json({ error: error.message })
  }
})

// Helper function for month range calculation
function getMonthRange(month: string) {
  const [yearStr, monthStr] = month.split("-")
  const year = Number(yearStr)
  const m = Number(monthStr) - 1
  const start = new Date(year, m, 1)
  const end = new Date(year, m + 1, 1)
  return { start, end }
}

export default router