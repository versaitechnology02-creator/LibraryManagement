import mongoose, { Schema } from "mongoose"

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["Admin", "Staff", "Student"],
      default: "Student",
    },
    studentId: { type: Schema.Types.ObjectId, ref: "Student" },
  },
  { timestamps: true },
)

export default mongoose.models.User || mongoose.model("User", UserSchema)

