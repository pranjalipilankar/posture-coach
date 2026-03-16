import { Router, Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import Session from "../models/Session"
import Report from "../models/Report"

const router = Router()

// TEMP — test route without auth
router.get("/test", (_req, res) => {
  res.json({ message: "reports router working" })
})

// --- Auth Middleware (same pattern as sessions.ts) ---
interface AuthRequest extends Request {
  userId?: string
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(" ")[1]
  if (!token) { res.status(401).json({ error: "No token" }); return }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    req.userId = decoded.userId
    next()
  } catch {
    res.status(401).json({ error: "Invalid token" })
  }
}

// GET /api/reports/generate — fetch sessions, call Gemini, save + return report
router.get("/generate", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {

    // --- Step 1: Fetch last 7 days of sessions ---
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const sessions = await Session.find({
      userId: req.userId,
      date:   { $gte: sevenDaysAgo }
    }).select("-snapshots")  // don't need raw snapshots for report

    if (sessions.length === 0) {
      res.status(400).json({ error: "No sessions in the last 7 days to generate a report" })
      return
    }

    // --- Step 2: Build context from real session data ---
    const avgScore   = Math.round(sessions.reduce((sum, s) => sum + s.avgScore, 0) / sessions.length)
    const totalMins  = sessions.reduce((sum, s) => sum + s.duration, 0)
    const bestScore  = Math.max(...sessions.map(s => s.avgScore))
    const worstScore = Math.min(...sessions.map(s => s.avgScore))

    // Find worst day of week
    const dayScores: Record<string, number[]> = {}
    sessions.forEach(s => {
      const day = new Date(s.date).toLocaleDateString("en-US", { weekday: "long" })
      if (!dayScores[day]) dayScores[day] = []
      dayScores[day].push(s.avgScore)
    })
    const dayAvgs = Object.entries(dayScores).map(([day, scores]) => ({
      day,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    }))
    const worstDay = dayAvgs.sort((a, b) => a.avg - b.avg)[0]?.day || "unknown"

    // --- Step 3: Build prompt ---
    // Context injection — real MongoDB data fed into the prompt
    const prompt = `
You are a workplace ergonomics coach. Analyze this person's posture data from the past week and give specific, actionable advice.

POSTURE DATA:
- Sessions completed: ${sessions.length}
- Average posture score: ${avgScore}/100
- Best session score: ${bestScore}/100
- Worst session score: ${worstScore}/100
- Total time monitored: ${totalMins} minutes
- Worst day of week: ${worstDay} (lowest average score)

SCORING SYSTEM:
- 80-100: Excellent posture
- 60-79: Good posture with room to improve  
- 40-59: Poor posture, needs attention
- 0-39: Very poor posture

Based on this data, respond ONLY with a valid JSON object in this exact format (no markdown, no backticks, no extra text):
{
  "trend": "improving" | "declining" | "stable",
  "summary": "2 sentence summary of their posture week",
  "tips": [
    "specific tip 1",
    "specific tip 2", 
    "specific tip 3"
  ]
}

Rules:
- trend: improving if score > 75, declining if < 50, otherwise stable
- summary: reference their actual score and worst day
- tips: specific and actionable, not generic. Reference their actual data.
- Return ONLY the JSON, nothing else.
`
    // --- Step 4: Call Gemini API --- (pure fetch, no SDK version issues)
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500
      })
    })
    
    const openaiData = await openaiRes.json()
    
    if (openaiData.error) {
      throw new Error(`OpenAI error: ${openaiData.error.message}`)
    }
    
    const rawText = openaiData.choices[0].message.content

    // Strip markdown backticks if Gemini wraps in ```json ... ```
    const cleanText = rawText.replace(/```json|```/g, "").trim()
    const parsed    = JSON.parse(cleanText)

    // --- Step 5: Save report to MongoDB ---
    const report = await Report.create({
      userId:   req.userId,
      weekOf:   new Date(),
      avgScore,
      trend:    parsed.trend,
      summary:  parsed.summary,
      tips:     parsed.tips,
    })

    res.json({
      reportId:  report._id,
      avgScore,
      trend:     parsed.trend,
      summary:   parsed.summary,
      tips:      parsed.tips,
      sessions:  sessions.length,
      worstDay,
    })

  } catch (error) {
    console.error("Report generation failed:", error)
    res.status(500).json({ error: "Failed to generate report" })
  }
})

// GET /api/reports/latest — get most recent saved report
router.get("/latest", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const report = await Report.findOne({ userId: req.userId }).sort({ createdAt: -1 })
    if (!report) {
      res.status(404).json({ error: "No reports yet" })
      return
    }
    res.json(report)
  } catch {
    res.status(500).json({ error: "Server error" })
  }
})

export default router