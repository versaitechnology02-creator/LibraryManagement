import mongoose, { Schema } from "mongoose"

const AttendanceSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["Student", "Staff"],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkInTime: {
      type: Date,
    },
    method: {
      type: String,
      enum: ["QR", "FACE"],
      required: true,
    },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String },
    },
    status: {
      type: String,
      enum: ["Present", "Absent"],
      default: "Present",
    },
    student: { type: Schema.Types.ObjectId, ref: "Student" },
  },
  { timestamps: true },
)

export default mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema)

