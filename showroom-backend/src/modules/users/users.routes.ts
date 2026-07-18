import { Router } from 'express';
import { body } from 'express-validator';
import { getMe, updateMe, listUsers, createStaff } from './users.controller';
import { verifyToken, requireRole } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';

const router = Router();

// Tất cả routes đều yêu cầu đăng nhập
router.use(verifyToken);

// GET /api/users/me
router.get('/me', getMe);

// PUT /api/users/me
router.put('/me', updateMe);

// GET /api/users  (admin only)
router.get('/', requireRole('admin', 'staff'), listUsers);

// POST /api/users/staff  (admin only)
router.post(
  '/staff',
  requireRole('admin'),
  [
    body('full_name').trim().notEmpty().withMessage('Họ tên không được để trống'),
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
    body('branch_id').optional().trim().notEmpty().withMessage('branch_id không hợp lệ'),
  ],
  validateRequest,
  createStaff
);

export default router;