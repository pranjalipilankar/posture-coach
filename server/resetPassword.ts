import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(__dirname, ".env") })

async function reset() {
  await mongoose.connect(process.env.MONGO_URI!)
  
  const hash = await bcrypt.hash("prajakta123", 12)
  
  await mongoose.connection.collection("users").updateOne(
    { email: "pranjalimpilankar@gmail.com" },       // ← your email
    { $set: { passwordHash: hash } }
  )
  
  console.log("✅ Password reset successfully")
  process.exit(0)
}

reset()