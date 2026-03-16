import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import api from "../services/api"
import { useAuth } from "../contexts/AuthContext"

interface Session {
  _id:      string
  date:     string
  avgScore: number
  duration: number
}

function Dashboard() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState("")

  const { user, logout } = useAuth()
  const navigate         = useNavigate()

  useEffect(() => {
    fetchHistory()
  }, [])

  async function fetchHistory(): Promise<void> {
    try {
      const res = await api.get("/api/sessions/history")
      // Reverse so oldest is left on graph, newest is right
      setSessions(res.data.reverse())
    } catch {
      setError("Failed to load session history")
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    logout()
    navigate("/login")
  }

  // Format date for graph x-axis: "Mar 11"
  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  // Prepare data for Recharts
  const chartData = sessions.map(s => ({
    date:     formatDate(s.date),
    score:    s.avgScore,
    duration: s.duration,
  }))

  // Summary stats
  const avgScore    = sessions.length
    ? Math.round(sessions.reduce((sum, s) => sum + s.avgScore, 0) / sessions.length)
    : 0
  const totalHours  = Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / 60)
  const bestScore   = sessions.length ? Math.max(...sessions.map(s => s.avgScore)) : 0

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 24px", fontFamily: "monospace" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "1.2rem", letterSpacing: "0.2em", color: "#e2e8f0" }}>posture coach</h1>
          <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>hi, {user?.name}</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => navigate("/")} style={styles.btn}>
            ← live session
          </button>
          <button onClick={() => navigate("/report")} style={styles.btn}>
            AI report →
          </button>
          <button onClick={handleLogout} style={styles.btn}>
            logout
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "32px" }}>
        <div style={styles.card}>
          <p style={styles.cardLabel}>avg score</p>
          <p style={{ ...styles.cardValue, color: scoreColor(avgScore) }}>{avgScore}%</p>
        </div>
        <div style={styles.card}>
          <p style={styles.cardLabel}>total sessions</p>
          <p style={styles.cardValue}>{sessions.length}</p>
        </div>
        <div style={styles.card}>
          <p style={styles.cardLabel}>best score</p>
          <p style={{ ...styles.cardValue, color: "#10b981" }}>{bestScore}%</p>
        </div>
      </div>

      {/* Score over time graph */}
      <div style={styles.card}>
        <p style={{ ...styles.cardLabel, marginBottom: "16px" }}>posture score over time</p>

        {loading && <p style={{ color: "#64748b", fontSize: "0.75rem" }}>loading...</p>}
        {error   && <p style={{ color: "#ef4444", fontSize: "0.75rem" }}>{error}</p>}

        {!loading && sessions.length === 0 && (
          <p style={{ color: "#64748b", fontSize: "0.75rem" }}>
            no sessions yet — complete a session to see your history
          </p>
        )}

        {!loading && sessions.length > 0 && (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3d" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#12121a", border: "1px solid #2a2a3d", borderRadius: "6px" }}
                labelStyle={{ color: "#e2e8f0", fontSize: "0.75rem" }}
                itemStyle={{ color: "#00e5ff", fontSize: "0.75rem" }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#00e5ff"
                strokeWidth={2}
                dot={{ fill: "#00e5ff", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Session list */}
      {sessions.length > 0 && (
        <div style={{ ...styles.card, marginTop: "16px" }}>
          <p style={{ ...styles.cardLabel, marginBottom: "12px" }}>recent sessions</p>
          {[...sessions].reverse().slice(0, 10).map((session) => (
            <div key={session._id} style={styles.sessionRow}>
              <span style={{ color: "#e2e8f0" }}>{formatDate(session.date)}</span>
              <span style={{ color: "#64748b" }}>{session.duration}m</span>
              <span style={{ color: scoreColor(session.avgScore) }}>{session.avgScore}%</span>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}

function scoreColor(score: number): string {
  if (score >= 80) return "#10b981"
  if (score >= 60) return "#f59e0b"
  return "#ef4444"
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "#12121a",
    border: "1px solid #2a2a3d",
    borderRadius: "10px",
    padding: "20px",
  },
  cardLabel: {
    fontSize: "0.65rem",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: "8px",
  },
  cardValue: {
    fontSize: "1.8rem",
    fontWeight: "bold",
    color: "#e2e8f0",
  },
  sessionRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #1a1a26",
    fontSize: "0.75rem",
  },
  btn: {
    background: "none",
    border: "1px solid #2a2a3d",
    borderRadius: "4px",
    color: "#64748b",
    fontFamily: "monospace",
    fontSize: "0.7rem",
    padding: "6px 12px",
    cursor: "pointer",
  }
}

export default Dashboard