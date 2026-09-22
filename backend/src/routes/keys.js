import { Router } from 'express';
import { requireJwtAuth } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { createApiKeySchema } from '../validators/apiKeySchemas.js';
import * as controller from '../controllers/apiKeyController.js';

const router = Router();
router.use(requireJwtAuth);
router.post('/', validate(createApiKeySchema), controller.create);
router.get('/', controller.list);
router.delete('/:id', controller.remove);
export default router;
