# Library Management System (LMS)

A full-stack Study Library Management CRM with separate frontend and backend for independent deployment.

## 📁 Project Structure

```
/project-root
  /frontend          # Next.js 16 App Router (React + TypeScript)
  /backend           # Express + TypeScript + MongoDB API
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```env
MONGODB_URI=mongodb://localhost:27017/lms
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

4. Start the backend server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

4. Start the frontend development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## 🏗️ Architecture

### Backend (`/backend`)

- **Framework**: Express.js + TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (stored in HTTP-only cookies)
- **Port**: 5000 (configurable via `PORT` env variable)

#### API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/attendance/self` - Mark attendance (Student/Staff)
- `GET /api/attendance/me` - Get own attendance records
- `GET /api/attendance` - Admin: Get all attendance
- `GET /api/profile/me` - Get user profile
- `GET /api/fees/me` - Student: Get fee status
- `GET /api/salary/me` - Staff: Get salary records
- `POST /api/salary/calculate` - Admin: Calculate salaries
- `GET /api/students` - Admin: List students
- `POST /api/students` - Admin: Create student
- `GET /api/payments` - Admin: List payments
- `POST /api/payments` - Admin: Record payment
- `GET /api/desks` - Admin: List desks
- `POST /api/desks` - Admin: Create desk
- `GET /api/shifts` - Admin: List shifts
- `POST /api/shifts` - Admin: Create shift
- `POST /api/qr-sessions` - Admin: Generate QR session

### Frontend (`/frontend`)

- **Framework**: Next.js 16 App Router
- **UI Library**: Shadcn UI (Radix UI + Tailwind CSS)
- **Icons**: Lucide React
- **Port**: 3000 (default Next.js port)

#### Key Features

- Role-based dashboards (Admin, Student, Staff)
- QR Code attendance scanning
- Face recognition attendance (Staff)
- Fee management and tracking
- Salary calculation and tracking
- Responsive mobile-friendly design

## 🔐 Authentication

Authentication uses JWT tokens stored in HTTP-only cookies. The frontend automatically includes cookies in all API requests via `credentials: "include"`.

## 📦 Deployment

### Backend Deployment (Railway, Render, AWS, etc.)

1. Set environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `PORT` (optional, defaults to 5000)
   - `CORS_ORIGIN` (your frontend URL)

2. Build and start:
```bash
npm run build
npm start
```

### Frontend Deployment (Vercel, Netlify, etc.)

1. Set environment variable:
   - `NEXT_PUBLIC_API_URL` (your backend API URL)

2. Build:
```bash
npm run build
npm start
```

## 🔧 Development

### Running Both Projects

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### API Communication

The frontend uses the `api` utility from `@/lib/api` which automatically:
- Prepends the backend URL from `NEXT_PUBLIC_API_URL`
- Includes credentials (cookies) in requests
- Handles errors consistently

Example:
```typescript
import { api } from '@/lib/api'

// Login
await api.login(email, password)

// Get attendance
const attendance = await api.getMyAttendance()
```

## 📝 Notes

- Backend and frontend are **completely independent** and can be deployed separately
- No port conflicts: Backend runs on 5000, Frontend on 3000
- All API calls from frontend go to the backend URL specified in `NEXT_PUBLIC_API_URL`
- CORS is configured on the backend to allow requests from the frontend origin

## 🐛 Troubleshooting

### Backend won't start
- Check MongoDB connection string in `.env`
- Ensure MongoDB is running (if local)
- Check if port 5000 is available

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` in `.env.local` matches backend URL
- Check CORS settings in backend (should match frontend URL)
- Ensure backend is running

### Authentication issues
- Clear browser cookies
- Check JWT_SECRET is set in backend `.env`
- Verify cookies are being sent (check browser DevTools Network tab)

## 📄 License

ISC
