import { Router } from 'express';
import { body, param } from 'express-validator';
import { createOrder, listOrders, getOrderById, updateOrderStatus } from './orders.controller';
import { verifyToken, requireRole } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';

const router = Router();

router.use(verifyToken);

// POST /api/orders
router.post(
  '/',
  [
    body('car_id').isUUID().withMessage('car_id không hợp lệ'),
    body('type').isIn(['deposit', 'purchase']).withMessage('type phải là deposit hoặc purchase'),
    body('notes').optional().isString(),
  ],
  validateRequest,
  createOrder
);

// GET /api/orders
router.get('/', listOrders);

// GET /api/orders/:id
router.get(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  getOrderById
);

// PATCH /api/orders/:id/status
router.patch(
  '/:id/status',
  requireRole('staff', 'admin'),
  [
    param('id').isUUID(),
    body('status').isIn(['confirmed', 'completed', 'cancelled']).withMessage('Trạng thái không hợp lệ'),
  ],
  validateRequest,
  updateOrderStatus
);

export default router;
