import mongoose, { Schema } from "mongoose"

const StaffSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    designation: { type: String, required: true },
    salaryType: {
      type: String,
      enum: ["Monthly", "Daily"],
      required: true,
    },
    baseSalary: { type: Number, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export default mongoose.models.Staff || mongoose.model("Staff", StaffSchema)

