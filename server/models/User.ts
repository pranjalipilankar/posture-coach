import mongoose, { Document, Schema } from "mongoose"
import bcrypt from "bcryptjs"

// TypeScript interface — defines shape of a User document
export interface IUser extends Document {
  name:         string
  email:        string
  passwordHash: string
  createdAt:    Date
  comparePassword(password: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  createdAt:    { type: Date, default: Date.now }
})

// Hash password before saving — never store plain text passwords
// "pre save" hook runs automatically before every .save() call
// Instance method — compares plain password to stored hash
// Used in login route: user.comparePassword(req.body.password)
UserSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) return
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12)
})

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash)
}

export default mongoose.model<IUser>("User", UserSchema)