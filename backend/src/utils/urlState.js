// Works out what state a link is in right now. Nothing has to be saved when a link
// expires: we just compare the expiry time with the clock every time.
export function getUrlState(url, now = new Date()) {
  if (url.deletedAt) return 'deleted';
  if (url.status === 'blocked') return 'blocked';
  if (url.status === 'disabled') return 'disabled';
  if (url.startsAt && url.startsAt > now) return 'scheduled';
  if (url.expiresAt && url.expiresAt <= now) return 'expired';
  return 'active';
}