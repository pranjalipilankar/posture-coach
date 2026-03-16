import { Router, Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import Session from "../models/Session"

const router = Router()

// --- Auth Middleware ---
// Runs before protected routes — verifies JWT token
// If valid, attaches userId to req so routes can use it
interface AuthRequest extends Request {
  userId?: string
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  // Token comes in Authorization header: "Bearer <token>"
  const token = req.headers.authorization?.split(" ")[1]

  if (!token) {
    res.status(401).json({ error: "No token provided" })
    return
  }

  try {
    const secret = process.env.JWT_SECRET!
    const decoded = jwt.verify(token, secret) as { userId: string }
    req.userId = decoded.userId
    next()  // passes control to the actual route handler
  } catch {
    res.status(401).json({ error: "Invalid token" })
  }
}

// POST /api/sessions/start — create a new session
router.post("/start", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const session = await Session.create({
      userId: req.userId,
      snapshots: []
    })
    res.status(201).json({ sessionId: session._id })
  } catch {
    res.status(500).json({ error: "Server error" })
  }
})

// POST /api/sessions/:id/snapshot — add a posture snapshot to a session
router.post("/:id/snapshot", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { neckTilt, shoulderLevel, sideLean, isGood, state } = req.body

    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.userId   // ensure user can only update their own sessions
    })

    if (!session) {
      res.status(404).json({ error: "Session not found" })
      return
    }

    // Push new snapshot into the array
    session.snapshots.push({ timestamp: new Date(), neckTilt, shoulderLevel, sideLean, isGood, state })

    // Recalculate avg score from all snapshots
    const goodCount = session.snapshots.filter(s => s.isGood).length
    session.avgScore = Math.round((goodCount / session.snapshots.length) * 100)

    // Duration in minutes — time since session started
    session.duration = Math.round((Date.now() - session.date.getTime()) / 60000)

    await session.save()
    res.json({ avgScore: session.avgScore, duration: session.duration })

  } catch {
    res.status(500).json({ error: "Server error" })
  }
})

// GET /api/sessions/history — last 30 sessions for dashboard
router.get("/history", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await Session.find({ userId: req.userId })
      .sort({ date: -1 })   // newest first
      .limit(30)
      .select("-snapshots")  // exclude raw snapshots — too heavy for list view

    res.json(sessions)
  } catch {
    res.status(500).json({ error: "Server error" })
  }
})

// GET /api/sessions/:id — single session with full snapshots
router.get("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.userId
    })

    if (!session) {
      res.status(404).json({ error: "Session not found" })
      return
    }

    res.json(session)
  } catch {
    res.status(500).json({ error: "Server error" })
  }
})

export default router