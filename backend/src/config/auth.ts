import jwt from "jsonwebtoken"
import { Request, Response, NextFunction } from "express"

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-in-production"

export type UserRole = "Admin" | "Staff" | "Student"

export interface SessionUser {
  id: string
  email: string
  name: string
  role: UserRole
}

export interface JWTPayload {
  user: SessionUser
  iat?: number
  exp?: number
}

export function generateToken(user: SessionUser): string {
  return jwt.sign({ user }, JWT_SECRET, { expiresIn: "2h" })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export interface AuthRequest extends Request {
  user?: SessionUser
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.session || req.headers.authorization?.replace("Bearer ", "")

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const payload = verifyToken(token)
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" })
  }

  req.user = payload.user
  next()
}

export function roleMiddleware(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" })
    }

    next()
  }
}

