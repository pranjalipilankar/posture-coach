import Camera from "../components/Camera"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { useSession } from "../hooks/useSession"  // ← move here

function Home() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const { sendSnapshot, sessionScore, sessionDuration } = useSession()

  function handleLogout() {
    logout()
    navigate("/login")
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", paddingTop: "24px" }}>

      {/* Top bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "640px",
        fontFamily: "monospace",
        fontSize: "0.75rem",
      }}>
        <span style={{ letterSpacing: "0.2em", opacity: 0.5 }}>posture coach</span>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <span style={{ color: "#64748b" }}>hi, {user?.name}</span>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              background: "none",
              border: "1px solid #2a2a3d",
              borderRadius: "4px",
              color: "#64748b",
              fontFamily: "monospace",
              fontSize: "0.7rem",
              padding: "4px 10px",
              cursor: "pointer",
            }}
          >
            dashboard -{">"}
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: "none",
              border: "1px solid #2a2a3d",
              borderRadius: "4px",
              color: "#64748b",
              fontFamily: "monospace",
              fontSize: "0.7rem",
              padding: "4px 10px",
              cursor: "pointer",
            }}
          >
            logout
          </button>
        </div>
      </div>

      <Camera 
      sendSnapshot={sendSnapshot}        // ← pass down as props
      sessionScore={sessionScore}       
      sessionDuration={sessionDuration}/>

    </div>
  )
}

export default Home