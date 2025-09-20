import axios from 'axios'

const fallbackBase = '/api'
const apiBase = (import.meta.env.VITE_API_URL as string) || fallbackBase

export const api = axios.create({
  baseURL: apiBase,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

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

export type LoginResponse = {
  accessToken: string
  user: { id: string; email: string; full_name: string; role: string }
}
