import mongoose, { Document, Schema } from "mongoose"
import bcrypt from "bcryptjs"

export interface IUser extends Document {
  name:              string
  email:             string
  passwordHash:      string
  createdAt:         Date
  resetToken?:       string        // ← inside interface
  resetTokenExpiry?: Date          // ← inside interface
  comparePassword(password: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>({
  name:              { type: String, required: true, trim: true },
  email:             { type: String, required: true, unique: true, lowercase: true },
  passwordHash:      { type: String, required: true },
  createdAt:         { type: Date, default: Date.now },
  resetToken:        { type: String },        // ← inside schema
  resetTokenExpiry:  { type: Date },          // ← inside schema
})

UserSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) return
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12)
})

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash)
}

export default mongoose.model<IUser>("User", UserSchema)