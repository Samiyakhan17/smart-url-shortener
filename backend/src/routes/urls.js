import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { createUrlSchema } from '../validators/urlSchemas.js';
import { listQuerySchema, updateUrlSchema } from '../validators/urlManageSchemas.js';
import * as controller from '../controllers/urlController.js';
import * as manage from '../controllers/urlManageController.js';
import * as analytics from '../controllers/analyticsController.js';
import { createLimiter, generalApiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Every link route needs a logged-in user.
router.use(requireAuth);
router.use(generalApiLimiter);

router.post('/', createLimiter, validate(createUrlSchema), controller.create);
router.get('/', validate(listQuerySchema, 'query'), manage.list);
router.get('/:id/analytics', analytics.get);
router.get('/:id/history', manage.history);
router.get('/:id', manage.getOne);
router.patch('/:id', validate(updateUrlSchema), manage.update);
router.delete('/:id', manage.remove);

export default router;
