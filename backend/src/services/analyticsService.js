import { Click } from '../models/Click.js';
import { Url } from '../models/Url.js';
import { AppError } from '../utils/errors.js';

const OBJECT_ID = /^[a-f\d]{24}$/i;

export async function getUrlAnalytics(ownerId, id) {
  if (!OBJECT_ID.test(id)) {
    throw new AppError(404, 'NOT_FOUND', 'Link not found.');
  }

  const url = await Url.findOne({
    _id: id,
    ownerId,
    deletedAt: null,
  });

  if (!url) {
    throw new AppError(404, 'NOT_FOUND', 'Link not found.');
  }

  const [stats] = await Click.aggregate([
    { $match: { urlId: url._id } },
    {
      $facet: {
        total: [{ $count: 'count' }],

        lastClickedAt: [
          { $sort: { ts: -1 } },
          { $limit: 1 },
          { $project: { _id: 0, ts: 1 } },
        ],

        referrers: [
          { $group: { _id: '$referrerHost', clicks: { $sum: 1 } } },
          { $sort: { clicks: -1 } },
          { $project: { _id: 0, name: '$_id', clicks: 1 } },
        ],

        devices: [
          { $group: { _id: '$deviceType', clicks: { $sum: 1 } } },
          { $sort: { clicks: -1 } },
          { $project: { _id: 0, name: '$_id', clicks: 1 } },
        ],

        browsers: [
          { $group: { _id: '$browser', clicks: { $sum: 1 } } },
          { $match: { _id: { $ne: null } } },
          { $sort: { clicks: -1 } },
          { $project: { _id: 0, name: '$_id', clicks: 1 } },
        ],

        operatingSystems: [
          { $group: { _id: '$os', clicks: { $sum: 1 } } },
          { $match: { _id: { $ne: null } } },
          { $sort: { clicks: -1 } },
          { $project: { _id: 0, name: '$_id', clicks: 1 } },
        ],

        countries: [
          { $group: { _id: '$country', clicks: { $sum: 1 } } },
          { $match: { _id: { $ne: null } } },
          { $sort: { clicks: -1 } },
          { $project: { _id: 0, name: '$_id', clicks: 1 } },
        ],
      },
    },
  ]);

  return {
    totalClicks: stats.total[0]?.count ?? 0,
    lastClickedAt: stats.lastClickedAt[0]?.ts ?? null,
    referrers: stats.referrers,
    devices: stats.devices,
    browsers: stats.browsers,
    operatingSystems: stats.operatingSystems,
    countries: stats.countries,
  };
}
export async function getDashboardTotals(ownerId) {
 const urls = await Url.find({
  ownerId,
  deletedAt: null,
});

  const urlIds = urls.map((url) => url._id);

  const totalClicks = urls.reduce(
    (total, url) => total + url.clickCount,
    0,
  );

  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [today, last7Days, last30Days] = await Promise.all([
    Click.countDocuments({
      urlId: { $in: urlIds },
      ts: { $gte: startOfToday },
    }),

    Click.countDocuments({
      urlId: { $in: urlIds },
      ts: { $gte: sevenDaysAgo },
    }),

    Click.countDocuments({
      urlId: { $in: urlIds },
      ts: { $gte: thirtyDaysAgo },
    }),
  ]);

  return {
    totalClicks,
    today,
    last7Days,
    last30Days,
  };
}