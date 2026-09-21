import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { createUrlSchema } from '../validators/urlSchemas.js';
import { listQuerySchema, updateUrlSchema } from '../validators/urlManageSchemas.js';
import * as controller from '../controllers/urlController.js';
import * as manage from '../controllers/urlManageController.js';

const router = Router();

// Every link route needs a logged-in user.
router.use(requireAuth);

router.post('/', validate(createUrlSchema), controller.create);
router.get('/', validate(listQuerySchema, 'query'), manage.list);
router.get('/:id', manage.getOne);
router.patch('/:id', validate(updateUrlSchema), manage.update);
router.delete('/:id', manage.remove);

export default router;