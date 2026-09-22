export const PLANS = {
  free: { activeLinks: 100, dailyCreates: 25 },
  pro: { activeLinks: 10000, dailyCreates: 1000 },
};

export function getPlanLimits(plan) {
  return PLANS[plan] ?? PLANS.free;
}
