import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import authRoutes from "./routes/auth"
import sessionRoutes from "./routes/sessions"
import reportRoutes from "./routes/reports"   // ← add import
console.log("reportRoutes loaded:", typeof reportRoutes)  // add this

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// --- Middleware ---
// Runs on EVERY request before it hits a route handler

// Parses incoming JSON bodies → req.body is available in routes
app.use(express.json())

// Allows React (localhost:5173) to make requests to Express (localhost:5000)
// Without this the browser blocks cross-origin requests
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}))

// --- Routes ---
app.use("/api/auth", authRoutes)
app.use("/api/sessions", sessionRoutes)
app.use("/api/reports", reportRoutes)          // ← add route

app.get("/api/reports/debug", (_req, res) => {
  res.json({ message: "direct route works" })
})

console.log("Routes registered:")
console.log("  /api/auth")
console.log("  /api/sessions")
console.log("  /api/reports")

// Health check — quick way to confirm server is running
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Posture Coach API running" })
})

// --- Database connection ---
async function connectDB(): Promise<void> {
  try {
    const uri = process.env.MONGO_URI
    if (!uri) throw new Error("MONGO_URI not set in .env")

    await mongoose.connect(uri)
    console.log("✅ MongoDB connected")
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error)
    process.exit(1)  // exit if DB fails — no point running without it
  }
}

// Start server only after DB connects
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`)
  })
})