import * as redirectService from '../services/redirectService.js';
import { renderStatusPage } from '../views/statusPage.js';

export async function redirect(req, res) {
  const { state, url } = await redirectService.resolveCode(req.params.code);

  if (state === 'active') {
    // 302 = "temporary redirect": browsers do not remember it, so every click is counted
    // and a changed destination works immediately.
    res.set('Cache-Control', 'no-store');
    res.redirect(302, url.originalUrl);

    // Count the click AFTER the visitor is on their way, so it never slows them down.
    redirectService
      .recordClick(url._id)
      .catch((err) => req.log.error({ err }, 'Failed to record click'));
    return;
  }

  const page = renderStatusPage(state);
  res.status(page.status).set('Cache-Control', 'no-store').type('html').send(page.html);
}