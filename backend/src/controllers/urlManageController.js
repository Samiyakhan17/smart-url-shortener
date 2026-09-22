import * as urlManageService from '../services/urlManageService.js';

export async function list(req, res) {
  const { items, meta } = await urlManageService.listUrls(req.user.id, req.validated.query);
  res.json({ success: true, data: items, meta });
}

export async function getOne(req, res) {
  const link = await urlManageService.getUrl(req.user.id, req.params.id);
  res.json({ success: true, data: link });
}

export async function update(req, res) {
  const link = await urlManageService.updateUrl(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: link });
}

export async function remove(req, res) {
  await urlManageService.deleteUrl(req.user.id, req.params.id);
  res.status(204).end();
}

export async function history(req, res) {
  const entries = await urlManageService.getUrlHistory(req.user.id, req.params.id);
  res.json({ success: true, data: entries });
}