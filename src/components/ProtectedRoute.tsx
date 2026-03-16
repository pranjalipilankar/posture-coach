import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

// Wraps any route that requires login
// If no token → redirect to /login
// If token exists → render the page normally
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()

  // Wait until localStorage check is done before deciding
  // Without this, app briefly redirects to login on every refresh
  if (loading) return <div style={{ color: "white", textAlign: "center", marginTop: "40vh" }}>Loading...</div>

  if (!token) return <Navigate to="/login" replace />

  return <>{children}</>
}

export default ProtectedRoute