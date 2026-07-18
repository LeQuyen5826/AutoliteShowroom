import { Router } from 'express';
import { body, param } from 'express-validator';
import { createTestDrive, listTestDrives, updateTestDrive } from './test-drives.controller';
import { verifyToken, requireRole } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';

const router = Router();
router.use(verifyToken);

// POST /api/test-drives
router.post(
  '/',
  [
    body('car_id').isUUID().withMessage('car_id không hợp lệ'),
    body('scheduled_at').isISO8601().withMessage('Ngày giờ không hợp lệ'),
    body('notes').optional().isString(),
  ],
  validateRequest,
  createTestDrive
);

// GET /api/test-drives
router.get('/', listTestDrives);

// PATCH /api/test-drives/:id
router.patch(
  '/:id',
  requireRole('staff', 'admin'),
  [
    param('id').isUUID(),
    body('status').optional().isIn(['confirmed', 'done', 'cancelled']),
  ],
  validateRequest,
  updateTestDrive
);

export default router;
