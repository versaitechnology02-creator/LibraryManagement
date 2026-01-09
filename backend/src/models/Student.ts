import mongoose, { Schema } from "mongoose"

const StudentSchema = new Schema(
  {
    fullName: { type: String, required: true },
    studentId: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: String,
    photo: String,
    membershipStart: { type: Date, required: true },
    membershipEnd: { type: Date, required: true },
    desk: { type: Schema.Types.ObjectId, ref: "Desk" },
    shift: { type: Schema.Types.ObjectId, ref: "Shift" },
    paymentPlan: {
      type: String,
      enum: ["Monthly", "Quarterly", "Yearly"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Half Paid", "Fully Paid"],
      default: "Pending",
    },
    totalAmount: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    dueAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true },
)

export default mongoose.models.Student || mongoose.model("Student", StudentSchema)

