import { Url } from '../models/Url.js';
import { getPlanLimits } from '../config/plans.js';
import { AppError } from '../utils/errors.js';

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function getUsage(userId, plan) {
  const limits = getPlanLimits(plan);
  const [activeLinks, dailyCreates] = await Promise.all([
    Url.countDocuments({ ownerId: userId, deletedAt: null, status: 'active' }),
    Url.countDocuments({ ownerId: userId, createdAt: { $gte: startOfToday() } }),
  ]);
  return { plan: plan ?? 'free', limits, activeLinks, dailyCreates };
}

export async function assertCanCreateUrl(userId, plan) {
  const usage = await getUsage(userId, plan);
  if (usage.activeLinks >= usage.limits.activeLinks || usage.dailyCreates >= usage.limits.dailyCreates) {
    throw new AppError(429, 'QUOTA_EXCEEDED', 'Your plan limit has been reached.', usage);
  }
  return usage;
}
