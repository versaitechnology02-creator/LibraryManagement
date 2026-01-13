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
  markAttendance: (data: { location?: { lat: number; lng: number; address?: string }; faceMatch?: boolean }) =>
    apiRequest<any>("/api/attendance/self", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  markQRAttendance: (data: { qrToken: string; location?: { lat: number; lng: number; address?: string } }) =>
    apiRequest<any>("/api/attendance/qr", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  validateQRToken: (qrToken: string) =>
    apiRequest<any>("/api/qr-sessions/validate", {
      method: "POST",
      body: JSON.stringify({ qrToken }),
    }),

  getActiveQRSession: () =>
    apiRequest<any>("/api/qr-sessions/active"),

  getMyAttendance: (limit?: number) =>
    apiRequest<any[]>(`/api/attendance/me${limit ? `?limit=${limit}` : ""}`),

  // Profile
  getMyProfile: () =>
    apiRequest<any>("/api/profile/me"),

  // Health check
  health: () =>
    apiRequest<{ status: string; message: string }>("/health"),

  // System stats
  getSystemStats: () =>
    apiRequest<any>("/api/system/stats"),

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

  generateStudentId: (studentId: string) =>
    apiRequest<any>(`/api/students/admin/${studentId}/generate-id`, {
      method: "POST",
    }),

  // Admin Student Management
  getAdminStudents: () =>
    apiRequest<any[]>("/api/students/admin"),

  getAdminStudentDetails: (id: string) =>
    apiRequest<any>(`/api/students/admin/${id}`),

  updateStudentFeeStatus: (id: string, data: { status?: string; amountPaid?: number; dueAmount?: number }) =>
    apiRequest<any>(`/api/students/admin/${id}/fee-status`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  generateStudentFeeReceipt: (id: string, data: { paymentId?: string; month?: string }) =>
    apiRequest<any>(`/api/students/admin/${id}/fee-receipt`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Admin Staff Management
  getAdminStaff: () =>
    apiRequest<any[]>("/api/staff/admin"),

  createStaff: (data: { name: string; email: string; password: string; designation?: string; baseSalary?: number; salaryType?: string; shift?: string }) =>
    apiRequest<any>("/api/staff", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAdminStaffDetails: (id: string) =>
    apiRequest<any>(`/api/staff/admin/${id}`),

  updateStaffSalary: (id: string, data: { baseSalary?: number; salaryType?: string; designation?: string }) =>
    apiRequest<any>(`/api/staff/admin/${id}/salary`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updateSalaryStatus: (id: string, status: "Pending" | "Paid") =>
    apiRequest<any>(`/api/salary/admin/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  getAdminSalaries: () =>
    apiRequest<any[]>("/api/staff/admin/salaries"),

  getAttendance: (date?: string) =>
    apiRequest<any[]>(`/api/attendance${date ? `?date=${date}` : ""}`),

  markAdminAttendance: (data: { student: string; status: string; date: string }) =>
    apiRequest<any>("/api/attendance", {
      method: "POST",
      body: JSON.stringify(data),
    }),

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

  updateDesk: (id: string, data: any) =>
    apiRequest<any>(`/api/desks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteDesk: (id: string) =>
    apiRequest<any>(`/api/desks/${id}`, {
      method: "DELETE",
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

  // Face recognition
  registerFace: (faceDescriptor: number[]) =>
    apiRequest<any>("/api/auth/register-face", {
      method: "POST",
      body: JSON.stringify({ faceDescriptor }),
    }),

  verifyFace: (faceDescriptor: number[]) =>
    apiRequest<any>("/api/auth/verify-face", {
      method: "POST",
      body: JSON.stringify({ faceDescriptor }),
    }),

  getFaceStatus: () =>
    apiRequest<any>("/api/auth/face-status"),

  // System Management (Admin only)
  getFeeStatistics: () =>
    apiRequest<{ stats: any }>("/api/system/fee-reminders/stats"),

  triggerMonthlyFeeReminders: () =>
    apiRequest<any>("/api/system/fee-reminders/trigger-monthly", {
      method: "POST",
    }),

  triggerOverdueFeeReminders: () =>
    apiRequest<any>("/api/system/fee-reminders/trigger-overdue", {
      method: "POST",
    }),

  getSchedulerStatus: () =>
    apiRequest<{ jobs: any }>("/api/system/scheduler/status"),

  testEmailService: (testEmail: string) =>
    apiRequest<any>("/api/system/email/test", {
      method: "POST",
      body: JSON.stringify({ testEmail }),
    }),

  sendPaymentConfirmation: (paymentId: string, studentId: string) =>
    apiRequest<any>(`/api/system/payment-confirmation/${paymentId}`, {
      method: "POST",
      body: JSON.stringify({ studentId }),
    }),
}

