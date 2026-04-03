import { useState } from "react"
import { Link } from "react-router-dom"
import api from "../services/api"

function ForgotPassword() {
  const [email, setEmail]     = useState("")
  const [status, setStatus]   = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!email) { setMessage("Email required"); setStatus("error"); return }

    try {
      setLoading(true)
      const res = await api.post("/api/auth/forgot-password", { email })
      setMessage(res.data.message)
      setStatus("success")
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Something went wrong")
      setStatus("error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>posture coach</h2>
        <p style={styles.subtitle}>reset password</p>

        {status === "success" ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#10b981", fontFamily: "monospace", fontSize: "0.8rem", lineHeight: "1.6" }}>
              {message}
            </p>
            <Link to="/login" style={{ color: "#00e5ff", fontFamily: "monospace", fontSize: "0.75rem" }}>
              back to login
            </Link>
          </div>
        ) : (
          <>
            {message && <p style={styles.error}>{message}</p>}
            <input
              style={styles.input}
              type="email"
              placeholder="your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <button
              style={{ ...styles.button, opacity: loading ? 0.6 : 1 }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "sending..." : "send reset link"}
            </button>
            <p style={styles.link}>
              <Link to="/login" style={{ color: "#00e5ff" }}>back to login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" },
  card: {
    display: "flex", flexDirection: "column", gap: "12px",
    width: "320px", padding: "32px",
    background: "#12121a", border: "1px solid #2a2a3d", borderRadius: "12px",
  },
  title: { fontFamily: "monospace", fontSize: "1.2rem", textAlign: "center", letterSpacing: "0.2em", color: "#e2e8f0" },
  subtitle: { fontFamily: "monospace", fontSize: "0.75rem", textAlign: "center", color: "#64748b", marginBottom: "8px" },
  input: {
    padding: "10px 14px", background: "#0a0a0f",
    border: "1px solid #2a2a3d", borderRadius: "6px",
    color: "#e2e8f0", fontFamily: "monospace", fontSize: "0.85rem", outline: "none",
  },
  button: {
    padding: "10px", background: "#00e5ff", border: "none", borderRadius: "6px",
    color: "#0a0a0f", fontFamily: "monospace", fontSize: "0.85rem", fontWeight: "bold",
    cursor: "pointer", marginTop: "4px",
  },
  error: { fontFamily: "monospace", fontSize: "0.75rem", color: "#ef4444", textAlign: "center" },
  link:  { fontFamily: "monospace", fontSize: "0.75rem", textAlign: "center", color: "#64748b" }
}

export default ForgotPassword