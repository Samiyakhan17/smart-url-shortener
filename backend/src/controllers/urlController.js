import * as urlService from '../services/urlService.js';

export async function create(req, res) {
  const link = await urlService.createUrl(req.user.id, req.body);
  res.status(201).json({ success: true, data: link });
}