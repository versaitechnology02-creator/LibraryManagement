import mongoose, { Schema } from "mongoose"

const ShiftSchema = new Schema(
  {
    name: {
      type: String,
      enum: ["Morning", "Afternoon", "Evening", "Night"],
      required: true,
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    maxCapacity: { type: Number, required: true },
    currentCount: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export default mongoose.models.Shift || mongoose.model("Shift", ShiftSchema)

