# Product Requirements Document (PRD)
## Smart URL Shortener (Advanced)

| | |
|---|---|
| **Version** | 1.0 (draft) |
| **Product type** | SaaS-style link management platform (REST API + web dashboard) |
| **Core stack** | Node.js, Express, MongoDB, Next.js |
| **Status** | Ready for build |

---

## 1. Summary

Smart URL Shortener turns long URLs into short, memorable links and gives owners control over them: custom aliases, expiry, enable/disable, click analytics, and programmatic access via API keys. It behaves like a small SaaS product rather than a toy shortener, and it is designed to be abuse-resistant and fast on the redirect path.

## 2. Problem & Opportunity

- Long URLs are hard to share, ugly in messages, and impossible to track.
- Free shorteners give little control (no aliases, no expiry, no per-link analytics).
- Developers want an API to create links from their own apps.
- Public shorteners are a magnet for phishing/spam, so safety controls must be built in from the start.

## 3. Goals

| # | Goal | How we know |
|---|------|-------------|
| G1 | Create and manage short links quickly and reliably | Link creation p95 < 300 ms |
| G2 | Redirects are near-instant | Redirect p95 < 50 ms (cache hit), < 150 ms (cache miss) |
| G3 | Owners understand link performance | Analytics dashboard with clicks, referrers, devices, timeline |
| G4 | Service resists abuse | Rate limits, URL validation, reporting and disable flow |
| G5 | Developers can integrate | API keys, documented API (Swagger), quotas |

## 4. Non-Goals (for v1)

- Custom domains, teams/workspaces, webhooks (v2)
- Billing/payments (plans exist as data only)
- Deep-link / mobile app routing
- Real-time (websocket) analytics
- Automated malware scanning (manual report/disable only; hook left for later)

## 5. Target Users / Personas

| Persona | Description | Key needs |
|---|---|---|
| **Visitor** | Anyone clicking a short link | Fast redirect; clear message if link is expired/disabled |
| **Registered user** | Creator, marketer, student, freelancer | Create links, custom aliases, see analytics |
| **Developer** | Integrates via API | API key, stable JSON API, docs, predictable errors and limits |
| **Admin** | Platform operator | See users/links, disable abusive links, handle reports |

## 6. Release Scope

### MVP (core, must ship first)
Register/login, create short link (random code), redirect, list/get/update/delete-disable links, custom alias with validation, expiration, basic click counting, rate limiting, health check.

### V1 (complete product)
Detailed analytics, search/filter/sort/pagination, tags, favorites, API keys + quotas + usage, Next.js dashboard, Redis cache, Swagger docs, abuse reporting, admin panel, tests, deployment.

### V2 (advanced, optional)
QR codes, password-protected links, scheduled activation, UTM builder, bulk actions, unique-visitor estimation, custom domains, teams, webhooks, queues/aggregation jobs.

## 7. Functional Requirements

Priority: **P0** = MVP, **P1** = V1, **P2** = V2.

### 7.1 Accounts & Auth
| ID | Requirement | Pri |
|---|---|---|
| FR-A1 | Register with name, email, password (min 8 chars, strength check) | P0 |
| FR-A2 | Login returns access token; logout invalidates refresh token | P0 |
| FR-A3 | `GET /auth/me` returns profile (never password hash) | P0 |
| FR-A4 | Roles: `user`, `admin`; plan: `free`, `pro` | P0 |
| FR-A5 | Change password / update profile | P1 |
| FR-A6 | Account status (`active`, `suspended`); suspended users cannot log in or create links | P1 |

### 7.2 Link Creation & Management
| ID | Requirement | Pri |
|---|---|---|
| FR-L1 | Create link from a valid `http/https` URL; server generates unique short code | P0 |
| FR-L2 | Optional custom alias (3–32 chars, `a-z 0-9 - _`, case-insensitive, reserved words blocked) | P0 |
| FR-L3 | Optional expiry date/time (must be in the future) | P0 |
| FR-L4 | List own links with pagination | P0 |
| FR-L5 | View link detail | P0 |
| FR-L6 | Edit destination URL, expiry, title, tags (alias and short code are immutable after creation) | P0 |
| FR-L7 | Enable / disable link | P0 |
| FR-L8 | Delete link (soft delete; analytics retained until retention expiry) | P0 |
| FR-L9 | Search (title, alias, URL), filter (status, tag, favorite, date range), sort (created, clicks, expiry) | P1 |
| FR-L10 | Tags and favorites | P1 |
| FR-L11 | Audit trail of destination changes | P1 |
| FR-L12 | Bulk enable/disable/delete/tag | P2 |
| FR-L13 | QR code for a link | P2 |
| FR-L14 | Password-protected links | P2 |
| FR-L15 | Scheduled activation (`startsAt`) | P2 |
| FR-L16 | UTM builder in create form | P2 |

### 7.3 Redirect
| ID | Requirement | Pri |
|---|---|---|
| FR-R1 | `GET /:code` resolves code/alias and redirects (HTTP 302) to destination | P0 |
| FR-R2 | Unknown code → 404 page; expired → 410 page; disabled/blocked → 410 page (distinct messages) | P0 |
| FR-R3 | Every successful redirect records a click event without delaying the redirect | P0 |
| FR-R4 | Redirect never depends on user authentication | P0 |
| FR-R5 | Cached resolution via Redis with invalidation on change | P1 |

### 7.4 Analytics
| ID | Requirement | Pri |
|---|---|---|
| FR-N1 | Total clicks per link (atomic counter) | P0 |
| FR-N2 | Clicks over time (hour/day granularity), 7d / 30d / 90d range | P1 |
| FR-N3 | Top referrers, device type, browser, OS | P1 |
| FR-N4 | Country (approximate, IP not stored) | P1 |
| FR-N5 | Dashboard summary: total links, total clicks, top links, active vs expired | P1 |
| FR-N6 | Bots excluded from human click stats (flagged, not counted) | P1 |
| FR-N7 | Unique visitor estimate using daily-rotating hash | P2 |
| FR-N8 | Retention: raw click events auto-deleted after 90 days (free) / 365 days (pro); daily aggregates kept longer | P1 |

### 7.5 API Access & Quotas
| ID | Requirement | Pri |
|---|---|---|
| FR-K1 | Create named API keys; secret shown once; only a hash is stored | P1 |
| FR-K2 | List and revoke keys; show last used time | P1 |
| FR-K3 | API keys authenticate the same endpoints as JWT (except key management and admin) | P1 |
| FR-K4 | Per-plan quotas (links, API calls per day) and `GET /usage` | P1 |
| FR-K5 | Swagger/OpenAPI documentation | P1 |

### 7.6 Abuse Protection & Admin
| ID | Requirement | Pri |
|---|---|---|
| FR-S1 | Anyone can report a short link from the interstitial/expired page or via `POST /reports` | P1 |
| FR-S2 | Admin can list users/links/reports, block a link (status `blocked`), suspend a user | P1 |
| FR-S3 | Rate limits on auth, link creation, redirect, and API usage | P0 |
| FR-S4 | Block dangerous schemes, private/loopback destinations, and links pointing back to the shortener itself | P0 |

## 8. Plans & Quotas (initial proposal)

| | Free | Pro | Admin |
|---|---|---|---|
| Active links | 100 | 5,000 | unlimited |
| Link creations / day | 50 | 1,000 | – |
| API keys | 2 | 10 | – |
| API requests / day | 1,000 | 50,000 | – |
| Click-event retention | 90 days | 365 days | – |

*Numbers are configurable in one config file; there is no billing in v1.*

## 9. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Performance | Redirect p95 < 50 ms cached; API p95 < 300 ms |
| Availability | Health endpoint; graceful shutdown; target 99.5% for a hobby-scale deployment |
| Scalability | Stateless API; horizontal scaling; shared Redis for cache/rate limits |
| Security | OWASP API Top 10 considered; hashed passwords/keys; HTTPS only; restricted CORS |
| Privacy | No raw IPs stored; minimal data; documented retention |
| Accessibility | WCAG 2.1 AA for dashboard |
| Compatibility | Latest 2 versions of Chrome, Firefox, Safari, Edge; responsive from 360 px |
| Observability | Structured logs, request IDs, error tracking, uptime check |
| Maintainability | Layered code (routes → controllers → services → models), ≥ 70% test coverage on services |

## 10. Success Metrics

- Redirect p95 latency and error rate
- Links created per registered user
- Clicks recorded vs clicks served (loss < 0.5%)
- Percentage of reported links resolved within 24 h
- API error rate (5xx < 0.5%)
- Test coverage and Swagger completeness (100% of public endpoints documented)

## 11. Assumptions

- Short domain points at the Express API; the dashboard lives on a separate app domain (e.g. `go.example.com` vs `app.example.com`).
- One destination URL per link (no A/B or geo-routing).
- Email verification and password reset are desirable but treated as P1.5 (after core V1).

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Phishing/spam abuse | Reputation, takedown | Scheme/host validation, rate limits, reporting, admin block, interstitial for flagged links |
| Redirect slowness under load | Poor UX | Redis cache, lean redirect handler, async click logging |
| Click collection growth | DB cost/slow queries | TTL retention, compound indexes, daily aggregates |
| Alias squatting/collisions | Broken links | Unique index, reserved words, race-safe insert |
| Scope creep | Never ships | Strict MVP → V1 → V2 order |

## 13. Open Questions

1. Should guests create links from the landing page? **Recommendation:** V1 only, random code only, 7-day expiry, stricter IP rate limit; MVP requires login.
2. 301 or 302? **Decision:** 302 (temporary) so browsers do not cache and clicks keep being counted; destination edits take effect immediately.
3. Expired vs disabled response code? **Decision:** 410 Gone for both, with different messages.
4. Email verification in V1? Recommended yes (P1.5).
