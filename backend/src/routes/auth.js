import { Router } from 'express';
import { validate } from '../middleware/validateMiddleware.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { registerSchema, loginSchema } from '../validators/authSchemas.js';
import * as controller from '../controllers/authController.js';

const router = Router();

router.post('/register', validate(registerSchema), controller.register);
router.post('/login', validate(loginSchema), controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.get('/me', requireAuth, controller.me);

export default router;