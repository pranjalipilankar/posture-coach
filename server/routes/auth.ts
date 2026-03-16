import { Router, Request, Response } from "express"
import jwt from "jsonwebtoken"
import User from "../models/User"

const router = Router()

// Helper — generates a JWT token for a user
// JWT = header.payload.signature — encodes userId, expires in 7 days
function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("JWT_SECRET not set in .env")
  return jwt.sign({ userId }, secret, { expiresIn: "7d" })
}

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      res.status(400).json({ error: "All fields required" })
      return
    }

    // Check if email already exists
    const existing = await User.findOne({ email })
    if (existing) {
      res.status(400).json({ error: "Email already registered" })
      return
    }

    // Create user — passwordHash field triggers bcrypt pre-save hook
    const user = await User.create({
      name,
      email,
      passwordHash: password  // pre-save hook hashes this automatically
    })

    const token = generateToken(user._id.toString())

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    })

  } catch (error) {
    res.status(500).json({ error: "Server error" })
  }
})

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" })
      return
    }

    const user = await User.findOne({ email })
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" })
      return
    }

    // comparePassword — bcrypt compares plain password to stored hash
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      res.status(401).json({ error: "Invalid credentials" })
      return
    }

    const token = generateToken(user._id.toString())

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    })

  } catch (error) {
    res.status(500).json({ error: "Server error" })
  }
})

export default router