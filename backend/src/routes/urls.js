import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { createUrlSchema } from '../validators/urlSchemas.js';
import * as controller from '../controllers/urlController.js';

const router = Router();

// Every link route needs a logged-in user.
router.use(requireAuth);

router.post('/', validate(createUrlSchema), controller.create);

export default router;