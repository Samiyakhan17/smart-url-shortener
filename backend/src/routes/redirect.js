import { Router } from 'express';
import * as controller from '../controllers/redirectController.js';
import { redirectLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// The public short link: GET /<code>. No login needed.
router.get('/:code', redirectLimiter, controller.redirect);

export default router;
