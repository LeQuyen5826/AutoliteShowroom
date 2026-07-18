import api from './api'
import type { LoginPayload, RegisterPayload, AuthResponse } from '@/types'

export const authService = {
  login: async (payload: LoginPayload) => {
    const { data } = await api.post('/auth/login', payload)
    return data.data as AuthResponse
  },

  register: async (payload: RegisterPayload) => {
    const { data } = await api.post('/auth/register', payload)
    return data.data
  },

  getMe: async () => {
    const { data } = await api.get('/users/me')
    return data.data
  },
}
