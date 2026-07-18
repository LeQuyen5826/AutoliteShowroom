import api from './api'

export interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

const SESSION_KEY = 'chat_session_id'

export const chatService = {
  /** Tạo hoặc khôi phục session từ localStorage */
  getOrCreateSession: async (): Promise<{ id: string; messages: ChatMessage[] }> => {
    const existingId = localStorage.getItem(SESSION_KEY)
    const { data } = await api.post('/chat/session', { session_id: existingId })
    const session = data.data
    localStorage.setItem(SESSION_KEY, session.id)
    return session
  },

  /** Gửi tin nhắn và nhận câu trả lời AI */
  sendMessage: async (sessionId: string, message: string): Promise<ChatMessage> => {
    const { data } = await api.post(`/chat/${sessionId}/message`, { message })
    return data.data.message as ChatMessage
  },

  /** Xóa session cũ (bắt đầu cuộc trò chuyện mới) */
  clearSession: () => {
    localStorage.removeItem(SESSION_KEY)
  },
}
