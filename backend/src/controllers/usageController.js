import { getUsage } from '../services/quotaService.js';

export async function get(req, res) {
  res.json({ success: true, data: await getUsage(req.user.id, req.user.plan) });
}
