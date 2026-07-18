import { Router } from 'express'
import { verifyToken, requireRole } from '../../middleware/auth.middleware'
import {
  getOrCreateSession,
  sendMessage,
  getMessages,
  generateEmbeddings,
} from './chat.controller'

const router = Router()

// Tạo / lấy phiên chat — không bắt buộc đăng nhập (khách vãng lai được chat)
// verifyToken được gọi tùy chọn: nếu có token thì gắn user_id vào session
router.post('/session', (req, res, next) => {
  // Thử xác thực nhưng không bắt buộc
  const auth = req.headers.authorization
  if (auth?.startsWith('Bearer ')) {
    verifyToken(req, res, next)
  } else {
    next()
  }
}, getOrCreateSession)

// Gửi tin nhắn — không bắt buộc đăng nhập
router.post('/:sessionId/message', sendMessage)

// Lấy lịch sử — không bắt buộc đăng nhập
router.get('/:sessionId/messages', getMessages)

// (Admin) Sinh embedding cho tất cả xe
router.post('/embeddings/generate', verifyToken, requireRole('admin'), generateEmbeddings)

export default router
