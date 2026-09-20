import { Router } from 'express';
import * as controller from '../controllers/redirectController.js';

const router = Router();

// The public short link: GET /<code>. No login needed.
router.get('/:code', controller.redirect);

export default router;