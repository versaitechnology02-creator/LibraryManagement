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
import paymentsRoutes from "./routes/payments"
import desksRoutes from "./routes/desks"
import shiftsRoutes from "./routes/shifts"
import qrSessionsRoutes from "./routes/qr-sessions"

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
app.use("/api/payments", paymentsRoutes)
app.use("/api/desks", desksRoutes)
app.use("/api/shifts", shiftsRoutes)
app.use("/api/qr-sessions", qrSessionsRoutes)

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
app.listen(PORT, () => {
  console.log(`[backend] Server running on port ${PORT}`)
  console.log(`[backend] CORS enabled for: ${CORS_ORIGIN}`)
})

