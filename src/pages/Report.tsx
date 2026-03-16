import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"

interface ReportData {
  avgScore: number
  trend:    "improving" | "declining" | "stable"
  summary:  string
  tips:     string[]
  sessions: number
  worstDay: string
}

const TREND_COLOR = {
  improving: "#10b981",
  stable:    "#f59e0b",
  declining: "#ef4444",
}

const TREND_ICON = {
  improving: "↗",
  stable:    "→",
  declining: "↘",
}

function Report() {
  const [report, setReport]   = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const navigate              = useNavigate()

  async function generateReport(): Promise<void> {
    try {
      setLoading(true)
      setError("")
      const res = await api.get("/api/reports/generate")
      setReport(res.data)
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to generate report")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "32px 24px", fontFamily: "monospace" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "1.2rem", letterSpacing: "0.2em", color: "#e2e8f0" }}>weekly report</h1>
          <p style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px" }}>AI-generated posture analysis</p>
        </div>
        <button onClick={() => navigate("/dashboard")} style={styles.btn}>
          ← dashboard
        </button>
      </div>

      {/* Generate button */}
      {!report && (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <p style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "24px" }}>
            generates a report from your last 7 days of sessions
          </p>
          <button
            onClick={generateReport}
            disabled={loading}
            style={{
              ...styles.primaryBtn,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "analyzing your posture data..." : "generate weekly report"}
          </button>
          {error && <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "16px" }}>{error}</p>}
        </div>
      )}

      {/* Report display */}
      {report && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div style={styles.card}>
              <p style={styles.label}>avg score</p>
              <p style={{ ...styles.value, color: scoreColor(report.avgScore) }}>{report.avgScore}%</p>
            </div>
            <div style={styles.card}>
              <p style={styles.label}>sessions</p>
              <p style={styles.value}>{report.sessions}</p>
            </div>
            <div style={styles.card}>
              <p style={styles.label}>trend</p>
              <p style={{ ...styles.value, color: TREND_COLOR[report.trend] }}>
                {TREND_ICON[report.trend]} {report.trend}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div style={styles.card}>
            <p style={styles.label}>summary</p>
            <p style={{ color: "#e2e8f0", fontSize: "0.85rem", lineHeight: "1.6", marginTop: "8px" }}>
              {report.summary}
            </p>
            {report.worstDay && (
              <p style={{ color: "#64748b", fontSize: "0.72rem", marginTop: "8px" }}>
                worst day this week: {report.worstDay}
              </p>
            )}
          </div>

          {/* Tips */}
          <div style={styles.card}>
            <p style={{ ...styles.label, marginBottom: "12px" }}>recommendations</p>
            {report.tips.map((tip, i) => (
              <div key={i} style={styles.tip}>
                <span style={{ color: "#00e5ff", marginRight: "10px", flexShrink: 0 }}>0{i + 1}</span>
                <span style={{ color: "#e2e8f0", fontSize: "0.82rem", lineHeight: "1.5" }}>{tip}</span>
              </div>
            ))}
          </div>

          {/* Regenerate */}
          <button
            onClick={generateReport}
            disabled={loading}
            style={{ ...styles.btn, alignSelf: "center", marginTop: "8px" }}
          >
            {loading ? "generating..." : "regenerate"}
          </button>

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
  label: {
    fontSize: "0.65rem",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  value: {
    fontSize: "1.6rem",
    fontWeight: "bold",
    color: "#e2e8f0",
    marginTop: "6px",
  },
  tip: {
    display: "flex",
    alignItems: "flex-start",
    padding: "10px 0",
    borderBottom: "1px solid #1a1a26",
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
  },
  primaryBtn: {
    background: "#00e5ff",
    border: "none",
    borderRadius: "6px",
    color: "#0a0a0f",
    fontFamily: "monospace",
    fontSize: "0.85rem",
    fontWeight: "bold",
    padding: "12px 24px",
  }
}

export default Report