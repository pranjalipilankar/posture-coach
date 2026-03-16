import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

function Register() {
  const [name, setName]         = useState("")
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)

  const { register } = useAuth()
  const navigate     = useNavigate()

  async function handleRegister() {
    if (!name || !email || !password) {
      setError("All fields required")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    try {
      setLoading(true)
      setError("")
      await register(name, email, password)
      navigate("/")
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>posture coach</h2>
        <p style={styles.subtitle}>create account</p>

        {error && <p style={styles.error}>{error}</p>}

        <input
          style={styles.input}
          type="text"
          placeholder="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          style={styles.input}
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRegister()}
        />

        <button
          style={{ ...styles.button, opacity: loading ? 0.6 : 1 }}
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? "creating account..." : "create account"}
        </button>

        <p style={styles.link}>
          have an account?{" "}
          <Link to="/login" style={{ color: "#00e5ff" }}>sign in</Link>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "320px",
    padding: "32px",
    background: "#12121a",
    border: "1px solid #2a2a3d",
    borderRadius: "12px",
  },
  title: {
    fontFamily: "monospace",
    fontSize: "1.2rem",
    textAlign: "center",
    letterSpacing: "0.2em",
    color: "#e2e8f0",
  },
  subtitle: {
    fontFamily: "monospace",
    fontSize: "0.75rem",
    textAlign: "center",
    color: "#64748b",
    marginBottom: "8px",
  },
  input: {
    padding: "10px 14px",
    background: "#0a0a0f",
    border: "1px solid #2a2a3d",
    borderRadius: "6px",
    color: "#e2e8f0",
    fontFamily: "monospace",
    fontSize: "0.85rem",
    outline: "none",
  },
  button: {
    padding: "10px",
    background: "#00e5ff",
    border: "none",
    borderRadius: "6px",
    color: "#0a0a0f",
    fontFamily: "monospace",
    fontSize: "0.85rem",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "4px",
  },
  error: {
    fontFamily: "monospace",
    fontSize: "0.75rem",
    color: "#ef4444",
    textAlign: "center",
  },
  link: {
    fontFamily: "monospace",
    fontSize: "0.75rem",
    textAlign: "center",
    color: "#64748b",
  }
}

export default Register