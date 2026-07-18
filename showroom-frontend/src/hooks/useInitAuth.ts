import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { authService } from '@/services/auth.service'

/**
 * Hook tự động lấy thông tin user khi app khởi động
 * nếu đã có access_token trong localStorage
 */
export function useInitAuth() {
  const { isAuthenticated, setAuth, logout } = useAuthStore()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const refreshToken = localStorage.getItem('refresh_token')

    if (!token || !refreshToken) return
    if (isAuthenticated) return // đã có user trong store

    // Lấy thông tin user hiện tại
    authService.getMe()
      .then((user) => {
        // Giữ nguyên token, chỉ cập nhật user vào store
        setAuth(user, token, refreshToken)
      })
      .catch(() => {
        logout()
      })
  }, [])
}
