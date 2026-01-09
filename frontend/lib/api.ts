/**
 * API utility for making requests to the backend
 * Backend URL is configured via NEXT_PUBLIC_API_URL environment variable
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`
  
  const defaultOptions: RequestInit = {
    credentials: "include", // Include cookies for authentication
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  }

  const response = await fetch(url, defaultOptions)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiRequest<{ message: string; user: any }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  signup: (data: { name: string; email: string; password: string; role?: string }) =>
    apiRequest<{ message: string; user: any }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () =>
    apiRequest<{ message: string }>("/api/auth/logout", {
      method: "POST",
    }),

  // Attendance
  markAttendance: (data: { location: { lat: number; lng: number; address?: string }; faceMatch?: boolean }) =>
    apiRequest<any>("/api/attendance/self", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMyAttendance: (limit?: number) =>
    apiRequest<any[]>(`/api/attendance/me${limit ? `?limit=${limit}` : ""}`),

  // Profile
  getMyProfile: () =>
    apiRequest<any>("/api/profile/me"),

  // Health check
  health: () =>
    apiRequest<{ status: string; message: string }>("/health"),

  // Fees
  getMyFees: () =>
    apiRequest<any>("/api/fees/me"),

  // Salary
  getMySalary: () =>
    apiRequest<any[]>("/api/salary/me"),

  // Admin routes
  getStudents: () =>
    apiRequest<any[]>("/api/students"),

  createStudent: (data: any) =>
    apiRequest<any>("/api/students", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAttendance: (date?: string) =>
    apiRequest<any[]>(`/api/attendance${date ? `?date=${date}` : ""}`),

  getPayments: () =>
    apiRequest<any[]>("/api/payments"),

  createPayment: (data: any) =>
    apiRequest<any>("/api/payments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMyPayments: () =>
    apiRequest<any[]>("/api/payments/me"),

  getDesks: () =>
    apiRequest<any[]>("/api/desks"),

  createDesk: (data: any) =>
    apiRequest<any>("/api/desks", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getShifts: () =>
    apiRequest<any[]>("/api/shifts"),

  createShift: (data: any) =>
    apiRequest<any>("/api/shifts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  calculateSalary: (month: string) =>
    apiRequest<{ month: string; records: any[] }>("/api/salary/calculate", {
      method: "POST",
      body: JSON.stringify({ month }),
    }),

  createQRSession: (data: { expiresInSeconds?: number; locationRequired?: boolean }) =>
    apiRequest<any>("/api/qr-sessions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

