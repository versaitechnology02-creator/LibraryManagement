import mongoose, { Schema } from "mongoose"

const PaymentSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    amount: { type: Number, required: true },
    mode: {
      type: String,
      enum: ["Cash", "UPI", "Card", "Online"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Half Paid", "Fully Paid"],
      required: true,
    },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema)

