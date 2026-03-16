import mongoose, { Document, Schema } from "mongoose"

export interface IReport extends Document {
  userId:      mongoose.Types.ObjectId
  weekOf:      Date
  avgScore:    number
  trend:       "improving" | "declining" | "stable"
  summary:     string
  tips:        string[]
  createdAt:   Date
}

const ReportSchema = new Schema<IReport>({
  userId:    { type: Schema.Types.ObjectId, ref: "User", required: true },
  weekOf:    { type: Date, required: true },
  avgScore:  { type: Number, required: true },
  trend:     { type: String, enum: ["improving", "declining", "stable"], required: true },
  summary:   { type: String, required: true },
  tips:      [{ type: String }],
  createdAt: { type: Date, default: Date.now }
})

// One report per user per week
ReportSchema.index({ userId: 1, weekOf: -1 })

export default mongoose.model<IReport>("Report", ReportSchema)