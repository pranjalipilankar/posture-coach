import { Router, Request, Response } from "express"
import jwt from "jsonwebtoken"
import User from "../models/User"
import crypto from "crypto"
import nodemailer from "nodemailer"

const router = Router()

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email) { res.status(400).json({ error: "Email required" }); return }

    const user = await User.findOne({ email })

    // Always return success — don't reveal if email exists
    if (!user) {
      res.json({ message: "If that email exists, a reset link has been sent" })
      return
    }

    // Generate secure random token
    const resetToken  = crypto.randomBytes(32).toString("hex")
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000)  // 1 hour

    user.resetToken       = resetToken
    user.resetTokenExpiry = resetExpiry
    await user.save()

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS   // Gmail app password, not account password
      }
    })

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`

    await transporter.sendMail({
      from:    process.env.EMAIL_USER,
      to:      user.email,
      subject: "Posture Coach — Reset your password",
      html: `
        <p>You requested a password reset.</p>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>If you didn't request this, ignore this email.</p>
      `
    })

    res.json({ message: "If that email exists, a reset link has been sent" })

  } catch (error) {
    console.error("Forgot password error:", error)
    res.status(500).json({ error: "Server error" })
  }
})


// POST /api/auth/reset-password
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      res.status(400).json({ error: "Token and password required" })
      return
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" })
      return
    }

    // Find user with valid unexpired token
    const user = await User.findOne({
      resetToken:       token,
      resetTokenExpiry: { $gt: new Date() }  // token not expired
    })

    if (!user) {
      res.status(400).json({ error: "Invalid or expired reset token" })
      return
    }

    // Update password — pre-save hook hashes it automatically
    user.passwordHash     = password
    user.resetToken       = undefined
    user.resetTokenExpiry = undefined
    await user.save()

    res.json({ message: "Password reset successfully" })

  } catch (error) {
    res.status(500).json({ error: "Server error" })
  }
})

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