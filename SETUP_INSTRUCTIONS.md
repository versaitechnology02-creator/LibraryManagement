# 🚀 Setup Instructions

## Prerequisites

- Node.js 18+ installed
- MongoDB running (local or MongoDB Atlas)
- Two terminal windows

## Step 1: Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in `backend/`:
```env
MONGODB_URI=mongodb://localhost:27017/lms
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

Start backend:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

## Step 2: Frontend Setup

Open a **new terminal**:

```bash
cd frontend
npm install
```

Create `.env.local` file in `frontend/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start frontend:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## Step 3: Verify Connection

1. Open browser: `http://localhost:3000`
2. Backend should be running on port 5000
3. Frontend should connect to backend automatically

## ✅ Verification Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] No module resolution errors
- [ ] Login page loads
- [ ] Can create account
- [ ] Can login successfully
- [ ] Dashboard redirects work

## 🔧 Troubleshooting

### Backend won't start
- Check MongoDB is running
- Verify `.env` file exists with correct `MONGODB_URI`
- Check port 5000 is not in use

### Frontend can't connect
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check backend is running on port 5000
- Check CORS settings in backend

### Module not found errors
- Delete `node_modules` and reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### Auth errors
- Clear browser cookies
- Check JWT_SECRET is set in backend
- Verify backend auth routes are working

## 📝 Notes

- Backend and frontend are **completely independent**
- They can be deployed separately
- Backend handles all authentication
- Frontend uses client-side auth checks via API calls

