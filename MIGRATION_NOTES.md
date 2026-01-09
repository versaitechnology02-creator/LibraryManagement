# Migration Notes - Frontend/Backend Separation

## ✅ Completed

1. **Backend Structure Created**
   - Express + TypeScript server
   - All models moved to `/backend/src/models`
   - All API routes converted to Express routes
   - Authentication middleware implemented
   - CORS configured

2. **Frontend Structure Created**
   - All frontend files moved to `/frontend`
   - API utility created (`/frontend/lib/api.ts`)
   - Environment variable setup for backend URL

3. **Components Updated**
   - ✅ `login-form.tsx` - Uses `api.login()`
   - ✅ `signup-form.tsx` - Uses `api.signup()`
   - ✅ `app-sidebar.tsx` - Uses `api.logout()`
   - ✅ `attendance-scanner.tsx` - Uses `api.markAttendance()`
   - ✅ `student-form.tsx` - Uses `api.getDesks()`, `api.getShifts()`, `api.createStudent()`

4. **Pages Updated**
   - ✅ `app/student/page.tsx` - Uses `api.getMyAttendance()`, `api.getMyFees()`, `api.getMyProfile()`
   - ✅ `app/staff/page.tsx` - Uses `api.getMyAttendance()`, `api.getMySalary()`
   - ✅ `app/dashboard/page.tsx` - Uses `api.getStudents()`, `api.getDesks()`, etc.

## ⚠️ Remaining Updates Needed

Some dashboard pages still use direct `fetch()` calls. Update them to use the `api` utility:

### Files to Update:

1. **`frontend/app/dashboard/students/page.tsx`**
   - Replace `fetch("/api/students")` with `api.getStudents()`
   - Replace `fetch("/api/students", { method: "POST" })` with `api.createStudent(data)`

2. **`frontend/app/dashboard/payments/page.tsx`**
   - Replace `fetch("/api/payments")` with `api.getPayments()`
   - Replace `fetch("/api/students")` with `api.getStudents()`
   - Replace `fetch("/api/payments", { method: "POST" })` with `api.createPayment(data)`

3. **`frontend/app/dashboard/attendance/page.tsx`**
   - Replace `fetch("/api/students")` with `api.getStudents()`
   - Replace `fetch("/api/attendance")` with `api.getAttendance(date)`

4. **`frontend/app/dashboard/desks/page.tsx`**
   - Replace `fetch("/api/desks")` with `api.getDesks()`
   - Replace `fetch("/api/desks", { method: "POST" })` with `api.createDesk(data)`

5. **`frontend/app/dashboard/shifts/page.tsx`**
   - Replace `fetch("/api/shifts")` with `api.getShifts()`
   - Replace `fetch("/api/shifts", { method: "POST" })` with `api.createShift(data)`

6. **`frontend/app/staff/page.tsx`** (one remaining)
   - Line ~124: Replace `fetch("/api/attendance/me")` with `api.getMyAttendance()`

7. **`frontend/app/student/page.tsx`** (one remaining)
   - Line ~265: Replace `fetch('/api/attendance/me')` with `api.getMyAttendance()`

## 🔧 How to Update

For each file:

1. Add import at the top:
```typescript
import { api } from '@/lib/api'
```

2. Replace fetch calls:
```typescript
// Before
const res = await fetch("/api/students")
const data = await res.json()

// After
const data = await api.getStudents()
```

3. For POST requests:
```typescript
// Before
const res = await fetch("/api/students", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
})
const result = await res.json()

// After
const result = await api.createStudent(data)
```

## 🧪 Testing

After updating, test:
1. Login flow
2. Student dashboard (attendance, fees)
3. Staff dashboard (attendance, salary)
4. Admin dashboard (all sections)
5. Attendance scanning (QR + Face)

## 📝 Notes

- All API calls now go through the `api` utility which handles:
  - Backend URL prefixing
  - Cookie credentials
  - Error handling
- Backend runs on port 5000
- Frontend runs on port 3000
- Set `NEXT_PUBLIC_API_URL=http://localhost:5000` in frontend `.env.local`

