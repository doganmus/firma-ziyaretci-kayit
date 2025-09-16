import axios from 'axios'

const apiBase = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000'

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

export type LoginResponse = {
  accessToken: string
  user: { id: string; email: string; full_name: string; role: string }
}
