import mongoose, { Schema } from "mongoose"

const SalarySchema = new Schema(
  {
    staff: { type: Schema.Types.ObjectId, ref: "Staff", required: true },
    month: { type: String, required: true },
    totalPresentDays: { type: Number, required: true, default: 0 },
    calculatedAmount: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },
  },
  { timestamps: true },
)

export default mongoose.models.Salary || mongoose.model("Salary", SalarySchema)

