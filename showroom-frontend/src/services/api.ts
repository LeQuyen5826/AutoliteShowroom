import axios from 'axios'

// Trong dev, để trống -> dùng '/api' (đi qua proxy của Vite tới localhost:3000)
// Khi deploy thật (frontend và backend ở 2 domain khác nhau), đặt biến môi trường
// VITE_API_URL = https://ten-backend-cua-ban.com/api lúc build frontend.
const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Gắn access token vào mỗi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Tự động refresh token khi hết hạn
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh_token = localStorage.getItem('refresh_token')
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token })
        localStorage.setItem('access_token', data.data.access_token)
        original.headers.Authorization = `Bearer ${data.data.access_token}`
        return api(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api