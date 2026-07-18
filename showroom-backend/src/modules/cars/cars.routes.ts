import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  listCars, getCarById, createCar, updateCar, deleteCar, addCarImage, deleteCarImage, setPrimaryCarImage,
} from './cars.controller';
import { verifyToken, requireRole } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';

const router = Router();

// ─── PUBLIC ───────────────────────────────────────────────────────────────────

// GET /api/cars
router.get('/', listCars);

// GET /api/cars/:id
router.get(
  '/:id',
  [param('id').isUUID().withMessage('Car ID không hợp lệ')],
  validateRequest,
  getCarById
);

// ─── STAFF / ADMIN ────────────────────────────────────────────────────────────

// POST /api/cars
router.post(
  '/',
  verifyToken,
  requireRole('staff', 'admin'),
  [
    body('branch_id').trim().notEmpty().withMessage('branch_id không hợp lệ'),
    body('brand').trim().notEmpty().withMessage('Hãng xe không được để trống'),
    body('model').trim().notEmpty().withMessage('Model không được để trống'),
    body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Năm không hợp lệ'),
    body('price').isNumeric().withMessage('Giá không hợp lệ'),
    body('fuel_type').notEmpty().withMessage('Loại nhiên liệu không được để trống'),
    body('transmission').notEmpty().withMessage('Hộp số không được để trống'),
    body('condition').optional().isIn(['new_car', 'used_car']).withMessage('Tình trạng xe không hợp lệ'),
  ],
  validateRequest,
  createCar
);

// PUT /api/cars/:id
router.put(
  '/:id',
  verifyToken,
  requireRole('staff', 'admin'),
  [param('id').isUUID().withMessage('Car ID không hợp lệ')],
  validateRequest,
  updateCar
);

// DELETE /api/cars/:id  (admin only)
router.delete(
  '/:id',
  verifyToken,
  requireRole('admin'),
  [param('id').isUUID().withMessage('Car ID không hợp lệ')],
  validateRequest,
  deleteCar
);

// POST /api/cars/:id/images
router.post(
  '/:id/images',
  verifyToken,
  requireRole('staff', 'admin'),
  [
    param('id').isUUID().withMessage('Car ID không hợp lệ'),
    body('url').isURL().withMessage('URL ảnh không hợp lệ'),
  ],
  validateRequest,
  addCarImage
);

// DELETE /api/cars/:id/images/:imageId
router.delete(
  '/:id/images/:imageId',
  verifyToken,
  requireRole('staff', 'admin'),
  [
    param('id').isUUID().withMessage('Car ID không hợp lệ'),
    param('imageId').isUUID().withMessage('Image ID không hợp lệ'),
  ],
  validateRequest,
  deleteCarImage
);

// PATCH /api/cars/:id/images/:imageId/primary
router.patch(
  '/:id/images/:imageId/primary',
  verifyToken,
  requireRole('staff', 'admin'),
  [
    param('id').isUUID().withMessage('Car ID không hợp lệ'),
    param('imageId').isUUID().withMessage('Image ID không hợp lệ'),
  ],
  validateRequest,
  setPrimaryCarImage
);

export default router;