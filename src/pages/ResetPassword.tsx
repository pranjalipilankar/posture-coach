import { useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import api from "../services/api"

function ResetPassword() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm]   = useState("")
  const [message, setMessage]   = useState("")
  const [success, setSuccess]   = useState(false)
  const [loading, setLoading]   = useState(false)

  // useSearchParams reads ?token=... from the URL
  const [searchParams] = useSearchParams()
  const token          = searchParams.get("token")
  const navigate       = useNavigate()

  async function handleReset() {
    if (!password || !confirm) { setMessage("All fields required"); return }
    if (password !== confirm)  { setMessage("Passwords don't match"); return }
    if (password.length < 6)   { setMessage("Password must be at least 6 characters"); return }
    if (!token)                { setMessage("Invalid reset link"); return }

    try {
      setLoading(true)
      await api.post("/api/auth/reset-password", { token, password })
      setSuccess(true)
      setTimeout(() => navigate("/login"), 2000)
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Reset failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>posture coach</h2>
        <p style={styles.subtitle}>new password</p>

        {success ? (
          <p style={{ color: "#10b981", fontFamily: "monospace", fontSize: "0.8rem", textAlign: "center" }}>
            Password reset! Redirecting to login...
          </p>
        ) : (
          <>
            {message && <p style={styles.error}>{message}</p>}
            <input
              style={styles.input}
              type="password"
              placeholder="new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              style={styles.input}
              type="password"
              placeholder="confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReset()}
            />
            <button
              style={{ ...styles.button, opacity: loading ? 0.6 : 1 }}
              onClick={handleReset}
              disabled={loading}
            >
              {loading ? "resetting..." : "reset password"}
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
  title:    { fontFamily: "monospace", fontSize: "1.2rem", textAlign: "center", letterSpacing: "0.2em", color: "#e2e8f0" },
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

export default ResetPassword