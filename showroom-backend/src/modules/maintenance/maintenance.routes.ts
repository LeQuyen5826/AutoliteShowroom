import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createMaintenance, listMaintenance, updateMaintenance, deleteMaintenance,
} from './maintenance.controller';
import { verifyToken, requireRole } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';

const router = Router();
router.use(verifyToken);

// POST /api/maintenance
router.post(
  '/',
  [
    body('car_id').optional().isUUID().withMessage('car_id không hợp lệ'),
    body('branch_id').optional().isUUID().withMessage('branch_id không hợp lệ'),
    body('customer_id').optional().isUUID().withMessage('customer_id không hợp lệ'),
    body('service_type').trim().notEmpty().withMessage('Loại dịch vụ không được để trống'),
    body('scheduled_at').isISO8601().withMessage('Ngày giờ không hợp lệ'),
    body('notes').optional().isString(),
  ],
  validateRequest,
  createMaintenance
);

// GET /api/maintenance
router.get('/', listMaintenance);

// PATCH /api/maintenance/:id
router.patch(
  '/:id',
  requireRole('staff', 'admin'),
  [
    param('id').isUUID(),
    body('status').optional().isIn(['pending', 'confirmed', 'in_progress', 'done', 'cancelled']),
    body('cost').optional().isNumeric(),
  ],
  validateRequest,
  updateMaintenance
);

// DELETE /api/maintenance/:id
router.delete(
  '/:id',
  requireRole('admin'),
  [param('id').isUUID()],
  validateRequest,
  deleteMaintenance
);

export default router;