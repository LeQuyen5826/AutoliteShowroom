import { Router } from 'express';
import { body, param } from 'express-validator';
import { listBranches, getBranchById, createBranch, updateBranch, deleteBranch } from './branches.controller';
import { verifyToken, requireRole } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';

const router = Router();

router.get('/', listBranches);
router.get('/:id', [param('id').isUUID()], validateRequest, getBranchById);

router.post(
  '/',
  verifyToken, requireRole('admin'),
  [body('name').trim().notEmpty().withMessage('Tên chi nhánh không được để trống')],
  validateRequest, createBranch
);

router.put(
  '/:id',
  verifyToken, requireRole('admin'),
  [param('id').isUUID()],
  validateRequest, updateBranch
);

router.delete(
  '/:id',
  verifyToken, requireRole('admin'),
  [param('id').isUUID()],
  validateRequest, deleteBranch
);

export default router;
