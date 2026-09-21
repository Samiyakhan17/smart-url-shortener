import * as analyticsService from '../services/analyticsService.js';

export async function get(req, res) {
  const analytics = await analyticsService.getUrlAnalytics(req.user.id, req.params.id);

  res.json({
    success: true,
    data: analytics,
  });
}
export async function dashboardTotals(req, res) {
  const totals = await analyticsService.getDashboardTotals(req.user.id);

  res.json({
    success: true,
    data: totals,
  });
}