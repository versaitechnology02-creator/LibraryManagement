import mongoose, { Schema } from "mongoose"

const DeskSchema = new Schema(
  {
    deskNumber: { type: String, required: true, unique: true },
    type: { type: String, enum: ["Single", "Shared"], required: true },
    status: {
      type: String,
      enum: ["Available", "Occupied"],
      default: "Available",
    },
    assignedStudent: { type: Schema.Types.ObjectId, ref: "Student" },
  },
  { timestamps: true },
)

export default mongoose.models.Desk || mongoose.model("Desk", DeskSchema)

