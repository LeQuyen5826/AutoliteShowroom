import { Router } from 'express';
import { body, param } from 'express-validator';
import { createPayment, listPayments } from './payments.controller';
import { verifyToken, requireRole } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';

const router = Router({ mergeParams: true }); // để dùng :id từ orders

router.use(verifyToken);

// POST /api/orders/:id/payments
router.post(
  '/',
  requireRole('staff', 'admin'),
  [
    body('amount').isNumeric().withMessage('Số tiền không hợp lệ'),
    body('method').optional().isString(),
    body('note').optional().isString(),
  ],
  validateRequest,
  createPayment
);

// GET /api/orders/:id/payments
router.get('/', listPayments);

export default router;
