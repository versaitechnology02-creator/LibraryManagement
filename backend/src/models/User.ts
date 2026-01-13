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
    // Face recognition data
    faceDescriptor: { type: [Number], default: null }, // Array of 128 face descriptor values
    faceRegistered: { type: Boolean, default: false },
    faceRegistrationDate: { type: Date, default: null },
  },
  { timestamps: true },
)

export default mongoose.models.User || mongoose.model("User", UserSchema)

