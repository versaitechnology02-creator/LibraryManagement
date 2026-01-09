import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://versaitechnology02_db_user:x1YHACskWFjbGk2G@lms.fj8gss8.mongodb.net/?retryWrites=true&w=majority&appName=LMS"

if (!MONGODB_URI) {
  console.error("[backend] CRITICAL: MONGODB_URI is not defined in environment variables.")
}

let cached = (global as any).mongoose

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null }
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing. Please ensure it is set in your .env file.")
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("[backend] MongoDB connected successfully to database:", mongoose.connection.name)
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    console.error("[backend] MongoDB connection failed. Please verify your connection string and IP whitelist in Atlas.")
    console.error("[backend] Error details:", (e as Error).message)
    throw e
  }

  return cached.conn
}

export default connectDB

