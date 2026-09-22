import * as urlService from '../services/urlService.js';
import { assertCanCreateUrl } from '../services/quotaService.js';

export async function create(req, res) {
  await assertCanCreateUrl(req.user.id, req.user.plan);
  const link = await urlService.createUrl(req.user.id, req.body);
  res.status(201).json({ success: true, data: link });
}
