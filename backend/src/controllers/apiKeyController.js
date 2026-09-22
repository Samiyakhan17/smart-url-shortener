import * as apiKeyService from '../services/apiKeyService.js';

export async function create(req, res) {
  const key = await apiKeyService.createApiKey(req.user.id, req.body);
  res.status(201).json({ success: true, data: key });
}

export async function list(req, res) {
  res.json({ success: true, data: await apiKeyService.listApiKeys(req.user.id) });
}

export async function remove(req, res) {
  await apiKeyService.revokeApiKey(req.user.id, req.params.id);
  res.status(204).end();
}
