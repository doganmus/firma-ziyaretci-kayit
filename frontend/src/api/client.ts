import axios from 'axios'

// Choose API base URL: from environment (VITE_API_URL) or default to '/api'
const fallbackBase = '/api'
const apiBase = (import.meta.env.VITE_API_URL as string) || fallbackBase

// Pre-configured Axios instance used by the app to call the backend API
export const api = axios.create({
  baseURL: apiBase,
})

// Attach JWT token to every request if present (user logged in)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// If the server says we are unauthorized, clear session and go to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      if (location.pathname !== '/login') {
        location.href = '/login'
      }
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
