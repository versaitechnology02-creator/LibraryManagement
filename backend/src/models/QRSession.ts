import mongoose, { Schema } from "mongoose"

const QRSessionSchema = new Schema(
  {
    qrToken: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    locationRequired: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export default mongoose.models.QRSession || mongoose.model("QRSession", QRSessionSchema)

