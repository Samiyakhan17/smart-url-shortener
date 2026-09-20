# Implementation Plan
## Smart URL Shortener (Advanced)

**Approach:** build the core redirect system first, then layer on features. Every phase ends with something that works end-to-end, is tested, and is committed/tagged. Estimates assume a solo developer working focused blocks; adjust to your own pace.

| Phase | Focus | Est. effort | Milestone tag |
|---|---|---|---|
| 0 | Setup & tooling | 1–2 days | `v0.0.1` |
| 1 | Express foundation + MongoDB | 2–3 days | `v0.1.0` |
| 2 | Authentication | 3–4 days | `v0.2.0` |
| 3 | **Core shortener** (create + redirect + CRUD + alias + expiry) | 5–7 days | `v0.3.0` **(MVP backend)** |
| 4 | Analytics + search/filter/pagination | 5–6 days | `v0.4.0` |
| 5 | Rate limiting, quotas, API keys | 4–5 days | `v0.5.0` |
| 6 | Next.js dashboard | 10–14 days | `v0.6.0` **(usable product)** |
| 7 | Redis caching | 2–3 days | `v0.7.0` |
| 8 | Abuse controls + admin | 4–5 days | `v0.8.0` |
| 9 | Testing hardening + Swagger | 4–5 days | `v0.9.0` |
| 10 | Deployment | 3–4 days | `v1.0.0` **(launch)** |
| 11 | Advanced / V2 features | ongoing | `v1.x` |

**Total to v1.0:** roughly 8–10 weeks part-time. Aim for a working MVP backend (through Phase 3) within the first 2–3 weeks so you have something demo-able early.

---

## Phase 0 — Project Setup (1–2 days)

- [ ] Create GitHub repo `smart-url-shortener` (monorepo: `/backend`, `/frontend`, `/docs`)
- [ ] Copy the six planning docs into `/docs`
- [ ] `backend`: `npm init -y`, set `"type": "module"`, Node 20 (`.nvmrc`)
- [ ] Install core packages:
  ```bash
  npm i express mongoose dotenv cors helmet zod bcrypt jsonwebtoken nanoid cookie-parser pino pino-http express-rate-limit hpp express-mongo-sanitize
  npm i -D nodemon jest supertest mongodb-memory-server eslint prettier husky lint-staged
  ```
- [ ] ESLint + Prettier + Husky pre-commit hook
- [ ] `.gitignore`, `.env.example`, README skeleton
- [ ] `docker-compose.yml` with MongoDB (and Redis, used later)
- [ ] GitHub Actions: lint + test on push/PR
- [ ] Branching: `main` (protected, always deployable) ← feature branches `feat/…`; Conventional Commits

**Done when:** `npm run dev` starts, CI is green on an empty test.

## Phase 1 — Express Foundation & MongoDB (2–3 days)
*(Source plan steps 1–3)*

- [ ] `app.js` / `server.js` split (app is testable without listening)
- [ ] Middleware: request ID, pino-http, Helmet, CORS allow-list, JSON body limit, cookie-parser, mongo-sanitize
- [ ] `GET /api/v1/health` (checks DB connection)
- [ ] Central error handler + `AppError` class + uniform error envelope
- [ ] `config/env.js` that validates env with Zod and fails fast
- [ ] `config/db.js` Mongoose connection with retry + graceful shutdown
- [ ] Models: `User`, `Url` (with indexes)
- [ ] Jest + Supertest setup with in-memory Mongo

**Done when:** health endpoint returns 200 in tests; app refuses to boot with missing env.

## Phase 2 — Authentication (3–4 days)
*(Source plan step 4)*

- [ ] Zod schemas for register/login
- [ ] `authService`: register (bcrypt cost 12), login, token issue, refresh rotation, logout
- [ ] `RefreshToken` model + httpOnly cookie handling
- [ ] `requireAuth` and `requireRole` middleware
- [ ] Routes: `/auth/register|login|refresh|logout|me`
- [ ] Generic login error; suspended-user check
- [ ] Tests: happy path, duplicate email, bad password, expired/invalid JWT, refresh reuse detection

**Done when:** you can register, log in, call `/auth/me` with the bearer token, refresh, and log out — all covered by tests.

## Phase 3 — Core Shortener (5–7 days) → **MVP backend**
*(Source plan steps 5–8)*

**3a. Utilities**
- [ ] `codegen` (nanoid Base62, length 7) + collision-retry helper
- [ ] `urlSafety` (scheme, private IP, self-domain, length, normalisation)
- [ ] `reserved.js` and alias validator

**3b. Create + redirect**
- [ ] `POST /urls` (random code, optional alias, optional expiry)
- [ ] `GET /:code` redirect route mounted **after** `/api` routes; 302; simple 404/410 HTML views
- [ ] Simple click counter (`$inc`) — fire and forget

**3c. CRUD**
- [ ] `GET /urls` (basic pagination), `GET /urls/:id`
- [ ] `PATCH /urls/:id` (destination, expiry, title, status), `DELETE` (soft)
- [ ] Ownership checks (404 for non-owner)

**3d. Alias + expiry**
- [ ] 409 on duplicate alias; 400 on reserved/invalid alias
- [ ] Expiry derived state in redirect; `410` page for expired/disabled

**Tests (map to source checklist):** valid create · invalid URL rejected · unique codes · collision retry · custom alias · duplicate alias · reserved alias · redirect active · expired · disabled · update destination · delete · owner authorization · concurrent alias creation.

**Done when:** you can create a link with Postman, open the short URL in a browser, and be redirected; expired and disabled links show the right pages. **Tag `v0.3.0` and demo it.**

## Phase 4 — Analytics + Search/Filter (5–6 days)
*(Source plan steps 9–10)*

- [ ] `Click` model + TTL index
- [ ] Click capture: UA parsing, referrer host, geo country, bot flag; in-memory buffer with batch `insertMany`; flush on shutdown
- [ ] Batched counter updates
- [ ] `GET /urls/:id/analytics` (range, granularity) using aggregation pipelines
- [ ] `GET /analytics/summary` (totals, top links, active/expired counts)
- [ ] List endpoint: `q`, `status`, `tag`, `favorite`, date range, `sort`, `order`, `page`, `limit`, `meta.total`
- [ ] Tags + favorites fields and endpoints via PATCH
- [ ] Verify indexes with `explain()`; add missing ones
- [ ] `AuditLog` for destination changes

**Done when:** analytics numbers match test fixtures, bots excluded, list filters work and use indexes.

## Phase 5 — Rate Limiting, Quotas, API Keys (4–5 days)
*(Source plan steps 11–12)*

- [ ] Rate-limit groups per TRD §3.8 (memory store for now)
- [ ] `plans.js` and `quotaService` (active links, daily creates)
- [ ] `ApiKey` model; create/list/revoke endpoints; SHA-256 hashing; prefix display
- [ ] Auth middleware accepts `X-API-Key`; throttled `lastUsedAt` update
- [ ] `GET /usage`
- [ ] Tests: 429 with `Retry-After`, quota exceeded, revoked/expired key, key never returned after creation

**Done when:** a script using an API key can create links until quota, then receives clear 429/`QUOTA_EXCEEDED` errors.

## Phase 6 — Next.js Dashboard (10–14 days)
*(Source plan step 13)*

Order of build:
1. [ ] Scaffold Next.js (App Router) + Tailwind + fonts + theme tokens (`next-themes`)
2. [ ] UI kit: Button, Input, Field, Badge, Card, Modal, Toast, Skeleton, Table, Tabs, CopyButton (see UI brief §6)
3. [ ] API client with silent refresh + TanStack Query provider
4. [ ] Auth pages + route protection middleware
5. [ ] App shell (sidebar, top bar, mobile nav)
6. [ ] My Links: table, filters, pagination, actions, empty/loading/error states
7. [ ] Create / Edit modal with live alias check and expiry chips
8. [ ] Link details + analytics (Recharts)
9. [ ] Dashboard home KPIs and top links
10. [ ] API Keys page + usage bars
11. [ ] Settings page
12. [ ] Landing page (guest create if enabled)
13. [ ] Polish: accessibility pass (keyboard, contrast, ARIA), responsive pass at 360 / 768 / 1280 px, dark mode pass
14. [ ] Playwright e2e: register → create → open short link → see click in analytics

**Done when:** a new user can complete the whole journey in the UI on desktop and mobile widths, in both themes.

## Phase 7 — Redis Caching (2–3 days)
*(Source plan step 14)*

- [ ] `config/redis.js` (ioredis, lazy connect, error handling → fall back)
- [ ] `cacheService`: get/set/del with TTL rules and negative caching
- [ ] Integrate into redirect service; invalidate on every mutation path (update, status change, delete, admin block)
- [ ] Switch rate limiter to `rate-limit-redis`
- [ ] Tests: hit, miss, invalidation, Redis-down fallback
- [ ] Benchmark before/after with autocannon/k6 and record results in `/docs/benchmarks.md`

**Done when:** cache hit p95 is measurably lower and edits are reflected on the next redirect.

## Phase 8 — Abuse Controls & Admin (4–5 days)
*(Source plan step 17)*

- [ ] `Report` model + `POST /reports` + "Report this link" on status pages
- [ ] Admin endpoints (users, urls, reports) with role guard
- [ ] Block/unblock link, suspend/reactivate user, `blocked` status page
- [ ] Deny-list for domains (config or collection)
- [ ] Admin panel UI (users, links, reports queue)
- [ ] Audit log entries for all admin actions
- [ ] Security review against TRD §9 checklist (CORS, headers, cookie flags, enumeration, logs free of secrets)

**Done when:** a reported link can be blocked by an admin and visitors immediately see the removal page (cache invalidated).

## Phase 9 — Testing Hardening & Documentation (4–5 days)
*(Source plan steps 15–16)*

- [ ] Fill test gaps until services ≥ 70% coverage; coverage gate in CI
- [ ] Concurrency and error-response tests
- [ ] Load test redirect endpoint; document limits
- [ ] OpenAPI 3 spec (`docs/openapi.yaml`) for every public endpoint; serve Swagger UI at `/api/docs`
- [ ] README: overview, screenshots/GIF, architecture diagram, quick start, env table, API examples, design decisions
- [ ] `npm audit` and dependency updates

**Done when:** all items in the source "Testing Checklist" pass and Swagger covers every endpoint.

## Phase 10 — Deployment (3–4 days)
*(Source plan step 18)*

- [ ] MongoDB Atlas cluster (backups on, IP allow-list, least-privilege user)
- [ ] Managed Redis (Upstash / Redis Cloud)
- [ ] Deploy API to Render/Railway: env vars, health check path, auto-deploy from `main`
- [ ] Deploy frontend to Vercel: `NEXT_PUBLIC_API_URL`, preview deployments
- [ ] Domains + HTTPS: `go.` → API, `app.` → dashboard; CORS set to `app.` origin; cookie domain/SameSite verified across subdomains
- [ ] Create production admin with seed script; rotate secrets; ensure no dev secrets in prod
- [ ] Uptime monitor + Sentry + log drain + alerts (5xx rate, latency)
- [ ] Production smoke-test script: register → create → redirect → analytics → revoke key
- [ ] Backup restore drill; run final production checklist from the source plan

**Done when:** a stranger can sign up on the live site, create a link, and have it redirect from the short domain.

## Phase 11 — Advanced / V2 (pick by value)

Suggested order: QR codes → password-protected links → scheduled activation → UTM builder → unique visitors → bulk actions → daily aggregation job (`dailystats`) → BullMQ click queue → custom domains → teams/workspaces → webhooks → URL reputation scan (Safe Browsing).

---

## Cross-Cutting Workstreams

| Workstream | Practice |
|---|---|
| Testing | Write tests with each feature (not at the end); CI blocks merges on failure |
| Security | Re-check TRD §9 at end of Phases 2, 5, 8, 10 |
| Docs | Update OpenAPI + README in the same PR as endpoint changes |
| Performance | Measure redirect latency at Phases 3, 7, 10 |
| Git | Small PRs (< 400 lines), descriptive Conventional Commits, tag each milestone |
| Refactoring | Reserve ~10% of each phase for cleanup |

## Definition of Done (per task)
Code merged via PR · lint and tests green · validation and error cases handled · docs updated · no secrets committed · manually tested via Postman/UI.

## Definition of Done (project, from the source plan)
- [ ] Authenticated users can create and manage links
- [ ] Short codes redirect correctly
- [ ] Custom aliases work safely
- [ ] Expired/disabled links are handled
- [ ] Analytics are visible
- [ ] Pagination/search/filtering work
- [ ] Rate limiting enabled
- [ ] API keys can be managed
- [ ] Redis caching works
- [ ] APIs tested and documented (Swagger)
- [ ] Dashboard polished and responsive (light + dark)
- [ ] Deployed with secure configuration

## Risks & Contingencies

| Risk | Trigger | Response |
|---|---|---|
| Scope creep | Adding V2 features before MVP is stable | Only start Phase N+1 when Phase N's "Done when" is true |
| Dashboard takes longer than planned | Phase 6 exceeds 3 weeks | Ship MVP screens first (Login, My Links, Create, Details); defer admin UI and settings polish |
| Cross-domain cookie problems | Refresh fails in production | Proxy API through Next.js route handlers or use a shared parent domain cookie |
| Redis unavailable/expensive | Free tier limits | Keep Redis optional; in-memory LRU fallback for single instance |
| Click volume surprises | Slow analytics queries | Introduce `dailystats` earlier; shorten retention |

## Suggested First Week

| Day | Task |
|---|---|
| 1 | Phase 0: repo, tooling, CI, Docker Compose |
| 2 | Phase 1: Express app, error handling, env validation, health route |
| 3 | Phase 1: Mongo connection, `User` and `Url` models, test harness |
| 4–5 | Phase 2: register/login/me with tests |
| 6–7 | Phase 3a–3b: code generator, URL safety, create + redirect (first demo!) |
