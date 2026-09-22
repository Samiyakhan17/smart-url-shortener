import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as analytics from '../controllers/analyticsController.js';

const router = Router();

router.use(requireAuth);

router.get('/summary', analytics.dashboardTotals);
router.get('/:id', analytics.get);

export default router;