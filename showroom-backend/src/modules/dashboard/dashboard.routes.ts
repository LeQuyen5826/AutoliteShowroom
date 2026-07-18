import { Router } from 'express';
import { getOverview, getRevenue, getCarsStatus } from './dashboard.controller';
import { verifyToken, requireRole } from '../../middleware/auth.middleware';

const router = Router();

router.use(verifyToken, requireRole('admin', 'staff'));

router.get('/overview', getOverview);
router.get('/revenue', getRevenue);
router.get('/cars-status', getCarsStatus);

export default router;
