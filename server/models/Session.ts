import mongoose, { Document, Schema } from "mongoose"

// Shape of each 2-second posture snapshot
interface ISnapshot {
  timestamp:     Date
  neckTilt:      number
  shoulderLevel: number
  sideLean:      number
  isGood:        boolean
  state:         "GOOD" | "BAD" | "ALERTING"
}

// Shape of a full session document
export interface ISession extends Document {
  userId:         mongoose.Types.ObjectId
  date:           Date
  duration:       number   // minutes
  avgScore:       number   // 0-100
  snapshots:      ISnapshot[]
}

const SnapshotSchema = new Schema<ISnapshot>({
  timestamp:     { type: Date,    default: Date.now },
  neckTilt:      { type: Number,  required: true },
  shoulderLevel: { type: Number,  required: true },
  sideLean:      { type: Number,  required: true },
  isGood:        { type: Boolean, required: true },
  state:         { type: String,  enum: ["GOOD", "BAD", "ALERTING"], required: true }
}, { _id: false })  // snapshots don't need their own _id

const SessionSchema = new Schema<ISession>({
  // ref: "User" — tells Mongoose this links to the User collection
  // Enables .populate("userId") to get full user data if needed
  userId:    { type: Schema.Types.ObjectId, ref: "User", required: true },
  date:      { type: Date,   default: Date.now },
  duration:  { type: Number, default: 0 },
  avgScore:  { type: Number, default: 0 },
  snapshots: [SnapshotSchema]
})

// Index on userId + date — speeds up "get all sessions for this user" queries
SessionSchema.index({ userId: 1, date: -1 })

export default mongoose.model<ISession>("Session", SessionSchema)