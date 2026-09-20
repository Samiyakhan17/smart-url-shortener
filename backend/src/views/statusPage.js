import { env } from '../config/env.js';

const PAGES = {
  not_found: {
    status: 404,
    icon: '❓',
    title: 'Link not found',
    message: "This short link doesn't exist, or it was typed incorrectly.",
  },
  expired: {
    status: 410,
    icon: '⏳',
    title: 'This link has expired',
    message: 'The owner set this link to stop working after a certain date.',
  },
  disabled: {
    status: 410,
    icon: '⏸️',
    title: 'Link unavailable',
    message: 'The owner has turned this link off.',
  },
  blocked: {
    status: 410,
    icon: '⛔',
    title: 'Link removed',
    message: 'This link was removed for breaking our rules.',
  },
};

// Builds a small, standalone web page for links that cannot be opened.
// It never prints anything the visitor typed, so nothing can be injected into it.
export function renderStatusPage(state) {
  const page = PAGES[state] ?? PAGES.not_found;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${page.title}</title>
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
         font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; padding: 24px;
         box-sizing: border-box; background: #f8fafc; color: #0f172a; }
  .card { max-width: 420px; text-align: center; }
  .icon { font-size: 48px; }
  h1 { font-size: 24px; margin: 12px 0 8px; }
  p { color: #64748b; line-height: 1.5; margin: 0 0 24px; }
  a { color: #4f46e5; text-decoration: none; font-weight: 600; }
  @media (prefers-color-scheme: dark) {
    body { background: #0b1120; color: #e5e7eb; }
    p { color: #9ca3af; }
    a { color: #818cf8; }
  }
</style>
</head>
<body>
  <main class="card">
    <div class="icon">${page.icon}</div>
    <h1>${page.title}</h1>
    <p>${page.message}</p>
    <a href="${env.APP_ORIGIN}">Go to homepage</a>
  </main>
</body>
</html>`;
  return { status: page.status, html };
}