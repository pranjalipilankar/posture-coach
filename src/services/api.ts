import axios from "axios"

// Central axios instance — all API calls go through here
// baseURL means we write "/api/auth/login" not "http://localhost:5000/api/auth/login"
const api = axios.create({
  // Use env variable in production, fallback to localhost in development
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
})

// Request interceptor — runs before every request
// Automatically attaches JWT token to Authorization header
// This is why we don't manually add the token in every component
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api