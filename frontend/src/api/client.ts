import axios from 'axios'

// Choose API base URL: from environment (VITE_API_URL) or default to '/api'
const fallbackBase = '/api'
const raw = (import.meta.env.VITE_API_URL as string) || fallbackBase
// Ensure trailing slash is NOT duplicated and path prefix exists
const apiBase = raw.endsWith('/') ? raw.slice(0, -1) : raw

// Pre-configured Axios instance used by the app to call the backend API
export const api = axios.create({
  baseURL: apiBase,
  withCredentials: true,
})

// Attach JWT token to every request if present (user logged in)
// No Authorization header; backend reads HttpOnly cookie
api.interceptors.request.use((config) => config)

// If the server says we are unauthorized, clear session and go to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      localStorage.removeItem('user')
      if (location.pathname !== '/login') location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Types for common API responses
export type LoginResponse = {
  accessToken: string
  user: { id: string; email: string; full_name: string; role: string }
}

export type Settings = {
  brandName: string | null
  brandLogoUrl: string | null
}
