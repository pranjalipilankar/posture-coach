import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import api from "../services/api"

// Shape of logged in user
interface User {
  id:    string
  name:  string
  email: string
}

// Shape of everything AuthContext provides
interface AuthContextType {
  user:     User | null
  token:    string | null
  login:    (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout:   () => void
  loading:  boolean
}

// createContext — creates a global "bucket" any component can read from
// without passing props through every level (prop drilling)
const AuthContext = createContext<AuthContextType | null>(null)

// Provider wraps the whole app — makes auth available everywhere
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [token, setToken]     = useState<string | null>(null)
  // loading = true while we check localStorage on first load
  const [loading, setLoading] = useState<boolean>(true)

  // On app start — check if token exists in localStorage
  // If yes, restore the session without forcing re-login
  useEffect(() => {
    const savedToken = localStorage.getItem("token")
    const savedUser  = localStorage.getItem("user")

    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  async function login(email: string, password: string): Promise<void> {
    const res = await api.post("/api/auth/login", { email, password })

    const { token, user } = res.data

    // Persist to localStorage — survives page refresh
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user))

    setToken(token)
    setUser(user)
  }

  async function register(name: string, email: string, password: string): Promise<void> {
    const res = await api.post("/api/auth/register", { name, email, password })

    const { token, user } = res.data

    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user))

    setToken(token)
    setUser(user)
  }

  function logout(): void {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook — cleaner than writing useContext(AuthContext) everywhere
// Usage: const { user, login, logout } = useAuth()
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
}