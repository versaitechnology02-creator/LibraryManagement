import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// Import routes
import authRoutes from "./routes/auth"
import attendanceRoutes from "./routes/attendance"
import profileRoutes from "./routes/profile"
import feesRoutes from "./routes/fees"
import salaryRoutes from "./routes/salary"
import studentsRoutes from "./routes/students"
import staffRoutes from "./routes/staff"
import paymentsRoutes from "./routes/payments"
import desksRoutes from "./routes/desks"
import shiftsRoutes from "./routes/shifts"
import qrSessionsRoutes from "./routes/qr-sessions"
import systemRoutes from "./routes/system"

// Import services
import { schedulerService } from "./utils/scheduler-service"
import { emailService } from "./utils/email-service"

const app = express()
const PORT = process.env.PORT || 5000
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000"

// Middleware
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  }),
)
app.use(express.json())
app.use(cookieParser())

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend API is running" })
})

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/attendance", attendanceRoutes)
app.use("/api/profile", profileRoutes)
app.use("/api/fees", feesRoutes)
app.use("/api/salary", salaryRoutes)
app.use("/api/students", studentsRoutes)
app.use("/api/staff", staffRoutes)
app.use("/api/payments", paymentsRoutes)
app.use("/api/desks", desksRoutes)
app.use("/api/shifts", shiftsRoutes)
app.use("/api/qr-sessions", qrSessionsRoutes)
app.use("/api/system", systemRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" })
})

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[backend] Error:", err)
  res.status(500).json({ error: err.message || "Internal server error" })
})

// Start server
app.listen(PORT, async () => {
  console.log(`[backend] Server running on port ${PORT}`)
  console.log(`[backend] CORS enabled for: ${CORS_ORIGIN}`)

  // Initialize services
  console.log(`[backend] Initializing services...`)

  // Test email service connection
  const emailTest = await emailService.testConnection()
  if (emailTest) {
    console.log(`[backend] Email service connected successfully`)
  } else {
    console.warn(`[backend] Email service connection failed - check SMTP configuration`)
  }

  // Initialize scheduler service (cron jobs)
  console.log(`[backend] Scheduler service initialized with cron jobs`)
})

