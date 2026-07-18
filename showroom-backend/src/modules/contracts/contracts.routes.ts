import { Router } from 'express';
import { createContract, getContract, signContract } from './contracts.controller';
import { verifyToken, requireRole } from '../../middleware/auth.middleware';

const router = Router({ mergeParams: true });

router.use(verifyToken);

router.post('/', requireRole('staff', 'admin'), createContract);
router.get('/', getContract);
router.patch('/sign', requireRole('staff', 'admin'), signContract);

export default router;
