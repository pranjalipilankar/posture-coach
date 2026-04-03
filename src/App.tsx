import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import Report from "./pages/Report"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword  from "./pages/ResetPassword"

function App() {
  return (
    // BrowserRouter — enables URL-based routing in React
    // AuthProvider — wraps everything so auth is available app-wide
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ProtectedRoute — redirects to /login if no token */}
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/report" element={
            <ProtectedRoute>
              <Report />
            </ProtectedRoute>
          } />
          {/* Catch all — redirect unknown URLs to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App