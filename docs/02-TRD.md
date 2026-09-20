# Technical Requirements Document (TRD)
## Smart URL Shortener (Advanced)

---

## 1. Architecture Overview

```
Browser / API client
      │ HTTPS
      ▼
 ┌──────────────┐        ┌───────────────────────────┐
 │ Next.js app  │ REST   │  Express API (stateless)  │
 │ app.domain   │───────▶│  go.domain                │
 └──────────────┘        │  ├─ Auth / API-key        │
                         │  ├─ URL service           │
   Short link click ────▶│  ├─ Redirect service (hot)│
   go.domain/:code       │  ├─ Analytics service     │
                         │  └─ Validation / limits   │
                         └───────┬───────────┬───────┘
                                 │           │
                            MongoDB       Redis (cache, rate limits)
                          (source of truth)
```

**Key decisions**

| Decision | Choice | Reason |
|---|---|---|
| Two domains | `go.` (API + redirects) and `app.` (dashboard) | Avoids `/:code` colliding with frontend routes; independent scaling |
| Redirect status | HTTP **302** | Not cached by browsers, so clicks are always counted and edits apply instantly |
| Click logging | Fire-and-forget after response is sent | Redirect latency is unaffected |
| Source of truth | MongoDB | Redis is only a cache |
| API style | REST + JSON, versioned under `/api/v1` | Simple, matches plan |
| Auth | Short-lived JWT access token + rotating refresh token (httpOnly cookie) | Safer than long-lived tokens in localStorage |

## 2. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Runtime | Node.js 20 LTS | ES modules |
| Framework | Express 4 | |
| DB / ODM | MongoDB 7 (Atlas) + Mongoose 8 | |
| Cache | Redis 7 via `ioredis` | Optional in MVP; required for V1 |
| Validation | **Zod** | One schema library shared by routes |
| Auth | `jsonwebtoken`, `bcrypt` (cost 12) | |
| Security | `helmet`, `cors`, `express-rate-limit` + `rate-limit-redis`, `hpp` | |
| Short codes | `nanoid` with custom Base62 alphabet | |
| UA parsing | `ua-parser-js` | |
| Geo | `geoip-lite` (offline DB) | Country only; IP never stored |
| Logging | `pino` + `pino-http` | JSON logs, request IDs |
| Docs | `swagger-ui-express` + OpenAPI 3 YAML | |
| Testing | Jest, Supertest, `mongodb-memory-server` | |
| Lint/format | ESLint, Prettier, Husky + lint-staged | |
| Frontend | Next.js (App Router) + React + Tailwind CSS | |
| Frontend libs | TanStack Query, React Hook Form + Zod, Recharts, `next-themes`, `lucide-react` | |
| CI/CD | GitHub Actions | lint → test → build → deploy |
| Hosting | Vercel (frontend), Render/Railway (API), MongoDB Atlas, Upstash/Redis Cloud | |

## 3. Backend Design

### 3.1 Layering
`routes → middleware → controllers → services → models`. Controllers are thin (parse request, call a service, shape response). All business rules live in services so they can be unit-tested without HTTP.

### 3.2 Request pipeline (API routes)
1. Request ID + pino-http logging
2. Helmet, CORS (allow-list of the dashboard origin), body parser (limit 10 kb)
3. Rate limiter (per route group)
4. Auth middleware (JWT or API key) → `req.user`, `req.auth.method`
5. Zod validation (`body`, `query`, `params`)
6. Controller → service
7. Central error handler → uniform error envelope

### 3.3 Redirect pipeline (hot path, kept minimal)
```
GET /:code
 1. Lightweight rate limiter (high ceiling, per IP)
 2. Normalise code (lowercase for aliases; case-sensitive for random codes handled by lookup key rules, see 3.5)
 3. Redis GET short:{code}
      HIT  → record {urlId, destination, state}
      MISS → MongoDB findOne({ shortCode }) → build record → Redis SET with TTL
 4. Evaluate state: not found | blocked | disabled | expired | (scheduled) | active
 5. Active → res.redirect(302, destination)
 6. After response: enqueue click event (in-process buffer, flushed in batches) + INCR counter
```
Non-active states render a small server-side HTML page (404/410) with a "Report this link" option. No auth, no cookies, no DB writes before the redirect is sent.

### 3.4 Short code generation
- Random Base62 (`A–Z a–z 0–9`), default length 7 (≈ 3.5 trillion combinations).
- Insert with unique index; on duplicate-key error (E11000) regenerate and retry up to 5 times, then return 500 with alert log.
- Codes and aliases share one namespace (`shortCode` field) so `/:code` has a single lookup. Custom aliases are stored lowercase; random codes keep their case. Lookup tries the exact code, then lowercase alias.

### 3.5 Custom alias rules
- Regex `^[a-z0-9][a-z0-9_-]{2,31}$` after trimming and lowercasing.
- Reserved words (blocked): `api, admin, app, login, logout, register, signup, dashboard, docs, health, static, assets, favicon.ico, robots.txt, sitemap.xml, report, terms, privacy, about, support, help, settings, www` plus profanity list (configurable).
- Uniqueness check first for friendly `409`, unique index as final guard.
- Alias is immutable after creation (prevents hijacking/redirect-swap abuse).

### 3.6 URL validation & SSRF/abuse rules
- Parse with `new URL()`; only `http:` and `https:`; max length 2048; no credentials in URL (`user:pass@`).
- Reject `javascript:`, `data:`, `file:`, `ftp:`, `vbscript:` and any non-http(s) scheme.
- Reject hostnames that are: `localhost`, IP literals in private/loopback/link-local ranges (10/8, 172.16/12, 192.168/16, 127/8, 169.254/16, ::1, fc00::/7), or the shortener's own domain (prevents redirect loops).
- Normalise (lowercase host, strip default ports, punycode IDN) before storing.
- Optional deny-list of known abusive domains (config/DB).
- We do **not** fetch destinations at creation time in v1 (avoids SSRF surface); a later background scan job may.

### 3.7 Authentication & authorization
- **Access token:** JWT (HS256, 15 min), payload `{ sub, role, plan }`, sent in `Authorization: Bearer`.
- **Refresh token:** random 256-bit value, httpOnly + Secure + SameSite=Lax cookie, stored hashed (SHA-256) in `refreshtokens`; rotated on every refresh; reuse of an old token revokes the whole family.
- **Passwords:** bcrypt cost 12; min 8 chars, max 72 (bcrypt limit); generic login error to avoid user enumeration.
- **API keys:** format `usk_live_<32 random bytes base64url>`; shown once; stored as SHA-256 hash + 8-char prefix for display; sent via `X-API-Key` header.
- **Authorization:** middleware `requireAuth`, `requireRole('admin')`; ownership check in services (`url.ownerId === req.user.id || admin`). Return `404` (not `403`) for other users' resources to avoid leaking existence.

### 3.8 Rate limiting
| Group | Limit (default) | Key |
|---|---|---|
| `POST /auth/login`, `/auth/register` | 10 / 15 min | IP (+ email for login) |
| `POST /urls` | 30 / min per user; plan daily quota | user/API key |
| General API | 300 / 15 min | user/API key, else IP |
| `GET /:code` | 300 / min | IP |
| `POST /reports` | 10 / hour | IP |

Return `429` with `Retry-After` and `RateLimit-*` headers. Use Redis store when Redis is enabled (required if more than one instance).

### 3.9 Analytics capture
- Event fields: `urlId, ts, referrerHost, deviceType, browser, os, country, isBot, visitorHash?`.
- Parse UA and geo **after** the redirect is sent; failures never affect the user.
- Events buffered in memory (flush every 2 s or 100 events) with `insertMany({ ordered:false })`; counter updated via atomic `$inc` on `urls.clickCount` (batched per link). Graceful shutdown flushes the buffer.
- Bots detected via UA patterns; stored with `isBot:true`, excluded from counts/charts.
- Visitor hash (V2): `sha256(ip + ua + urlId + dailySalt)`; salt rotates daily and is never stored with the hash, so it cannot be reversed to an IP.
- Retention via TTL index on `ts`; nightly job builds `dailystats` aggregates.

### 3.10 Caching (Redis)
- Key `short:{code}` → JSON `{id, url, status, expiresAt, startsAt}`; TTL = min(1 h, time until expiry).
- Negative cache `short:{code}` = `null` marker for 60 s to blunt scanning of random codes.
- Invalidate (DEL) on update, disable, enable, delete, admin block.
- If Redis is down, fall back to MongoDB (log a warning; never fail the redirect).

### 3.11 Error handling & response format
Success:
```json
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 134 } }
```
Error:
```json
{ "success": false, "error": { "code": "ALIAS_TAKEN", "message": "This alias is already in use.", "details": [] }, "requestId": "..." }
```
Never expose stack traces or DB errors. Standard codes: `VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, ALIAS_TAKEN, ALIAS_RESERVED, LINK_EXPIRED, QUOTA_EXCEEDED, RATE_LIMITED, INTERNAL_ERROR`.

### 3.12 Pagination, search, sorting
Query params: `page` (default 1), `limit` (default 20, max 100), `q`, `status`, `tag`, `favorite`, `from`, `to`, `sort` (`createdAt|clickCount|expiresAt`), `order` (`asc|desc`). Search uses an indexed text field plus prefix match on alias; list response includes `meta.total`.

## 4. API Contract (v1)

Base: `https://go.example.com/api/v1`. Auth column: **J** = JWT, **K** = API key allowed, **A** = admin only, **–** = public.

| Method | Endpoint | Auth | Description | Success |
|---|---|---|---|---|
| POST | `/auth/register` | – | Create account | 201 |
| POST | `/auth/login` | – | Login → access token + refresh cookie | 200 |
| POST | `/auth/refresh` | cookie | Rotate refresh, new access token | 200 |
| POST | `/auth/logout` | J | Revoke refresh token | 204 |
| GET | `/auth/me` | J | Current user | 200 |
| PATCH | `/auth/me` | J | Update profile/password | 200 |
| POST | `/urls` | J K | Create link | 201 |
| GET | `/urls` | J K | List own links (filters) | 200 |
| GET | `/urls/:id` | J K | Link detail | 200 |
| PATCH | `/urls/:id` | J K | Update destination/expiry/status/tags/title | 200 |
| DELETE | `/urls/:id` | J K | Soft delete | 204 |
| GET | `/urls/:id/analytics` | J K | `range`, `granularity` | 200 |
| POST | `/urls/:id/qr` | J K | QR PNG/SVG (V2) | 200 |
| POST | `/urls/bulk` | J K | Bulk actions (V2) | 200 |
| GET | `/analytics/summary` | J K | Dashboard totals, top links | 200 |
| POST | `/keys` | J | Create key (secret returned once) | 201 |
| GET | `/keys` | J | List keys (prefix only) | 200 |
| DELETE | `/keys/:id` | J | Revoke | 204 |
| GET | `/usage` | J K | Quota and usage | 200 |
| POST | `/reports` | – | Report a short link | 201 |
| GET | `/admin/users` | J A | List/search users | 200 |
| PATCH | `/admin/users/:id` | J A | Suspend/reactivate, change plan | 200 |
| GET | `/admin/urls` | J A | Browse all links | 200 |
| PATCH | `/admin/urls/:id` | J A | Block/unblock | 200 |
| GET | `/admin/reports` | J A | Report queue | 200 |
| PATCH | `/admin/reports/:id` | J A | Resolve/dismiss | 200 |
| GET | `/health` | – | Liveness/readiness (DB, Redis) | 200/503 |
| GET | `/:code` | – | **Redirect** (root path, not under `/api`) | 302/404/410 |

Status codes follow the source plan: 201, 200, 204, 400, 401, 403, 404, 409, 410, 429, 500.

## 5. Frontend Technical Requirements
- Next.js App Router; server components for static/marketing pages, client components for interactive dashboard.
- Access token held in memory; silent refresh through the refresh cookie (proxy through Next route handlers, or configure CORS + credentials).
- Data fetching with TanStack Query (caching, optimistic updates for enable/disable and favorites).
- Forms: React Hook Form + the same Zod rules as the backend (shared package or duplicated schema file).
- Charts with Recharts; theme via `next-themes` (light/dark/system).
- Route protection with Next middleware (redirect unauthenticated users to `/login`).
- Env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SHORT_DOMAIN`.

## 6. Configuration (environment variables)

```
NODE_ENV=production
PORT=4000
BASE_SHORT_URL=https://go.example.com
APP_ORIGIN=https://app.example.com          # CORS allow-list
MONGODB_URI=
REDIS_URL=
JWT_ACCESS_SECRET=
JWT_ACCESS_TTL=15m
REFRESH_TOKEN_TTL_DAYS=30
BCRYPT_COST=12
ANALYTICS_SALT_SECRET=
RATE_LIMIT_ENABLED=true
LOG_LEVEL=info
SENTRY_DSN=
```
Secrets only via env/secret manager, never committed; `.env.example` is committed.

## 7. Folder Structure

```
backend/
├─ src/
│  ├─ config/        env.js, db.js, redis.js, plans.js, reserved.js
│  ├─ models/        User, Url, Click, ApiKey, RefreshToken, Report, AuditLog, DailyStat
│  ├─ routes/        auth, urls, analytics, keys, usage, reports, admin, redirect
│  ├─ controllers/
│  ├─ services/      authService, urlService, redirectService, analyticsService,
│  │                 cacheService, apiKeyService, quotaService, reportService
│  ├─ middleware/    auth, rateLimit, validate, error, requestId
│  ├─ validators/    Zod schemas
│  ├─ jobs/          cleanup, aggregateDaily
│  ├─ utils/         codegen, urlSafety, ua, geo, errors, logger
│  ├─ views/         expired.html, notfound.html, blocked.html
│  ├─ app.js
│  └─ server.js
├─ tests/            unit/, integration/
├─ docs/openapi.yaml
├─ .env.example
└─ package.json

frontend/
├─ app/              (marketing), (auth)/login|register, (dashboard)/links|analytics|keys|settings|admin
├─ components/       ui/, links/, charts/, layout/
├─ lib/              api client, auth, validators, utils
└─ hooks/
```

## 8. Testing Strategy
- **Unit:** code generator, alias/URL validators, quota logic, UA/geo parsing, cache service (mock Redis).
- **Integration (Supertest + memory Mongo):** auth flows, CRUD + ownership, alias conflicts, expiry, redirect states, analytics increments, rate limits, API keys, admin.
- **Concurrency:** 50 parallel creates of the same alias → exactly one 201, rest 409.
- **Load (k6/autocannon):** redirect endpoint, cache hit vs miss, target ≥ 1,000 req/s on a small instance.
- **Frontend:** component tests (Testing Library) + a few Playwright e2e paths (register → create → redirect → view analytics).
- **Coverage gate in CI:** 70% lines on services.
- The full checklist from the source plan is mapped to integration tests one-to-one.

## 9. Security Checklist
Helmet headers · strict CORS · body size limits · Zod on every input · parameterised Mongoose queries (also strip `$`-keys via `express-mongo-sanitize`) · bcrypt · hashed API keys/refresh tokens · rate limits · SSRF/loop/private-IP blocking · reserved aliases · admin role checks · audit log for admin and destination changes · dependency audit in CI (`npm audit`) · no secrets in logs · HTTPS + HSTS · cookie flags · abuse reporting.

## 10. Deployment & Operations
- Environments: `local` (Docker Compose: mongo + redis), `staging`, `production`.
- CI: install → lint → test → build → deploy on `main`; PR previews for frontend.
- Backend on Render/Railway with health-check path `/api/v1/health`; min 2 instances once traffic warrants (needs Redis rate-limit store).
- MongoDB Atlas with backups, IP allow-list, least-privilege DB user.
- Monitoring: uptime pinger, Sentry, log drain, alerts on 5xx rate and redirect latency.
- Graceful shutdown (SIGTERM): stop accepting requests, flush click buffer, close DB/Redis.

## 11. Performance Targets & Capacity Notes
- Redirect: p95 < 50 ms cached, error rate < 0.1%.
- Click write path must never block a redirect; buffer cap 10k events (drop oldest and log if exceeded).
- Analytics queries use compound index `{urlId, ts}` and `dailystats` for ranges > 30 days.
- Keep documents small; store `referrerHost` not full referrer URLs.

## 12. Out of Scope / Future Technical Work
Queues (BullMQ) for click ingestion at scale · malware/URL reputation scanning (Google Safe Browsing) · custom domain TLS provisioning · webhooks · multi-region · sharding of clicks by time.
