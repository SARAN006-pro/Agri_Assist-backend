import axios from 'axios'

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002'
export const API_URL = rawApiUrl.replace(/\/+$/, '')

const api = axios.create({
  baseURL: API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('vaagai_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('vaagai_token')
      localStorage.removeItem('user')
      localStorage.removeItem('vaagai_user_id')
      window.location.href = '/signin'
    }
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 30
      console.log(`Rate limited. Retrying in ${retryAfter} seconds`)
    }
    return Promise.reject(error)
  }
)

export default api