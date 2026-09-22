import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as controller from '../controllers/usageController.js';

const router = Router();
router.get('/', requireAuth, controller.get);
export default router;
