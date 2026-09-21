import * as analyticsService from '../services/analyticsService.js';

export async function get(req, res) {
  const analytics = await analyticsService.getUrlAnalytics(req.user.id, req.params.id);

  res.json({
    success: true,
    data: analytics,
  });
}