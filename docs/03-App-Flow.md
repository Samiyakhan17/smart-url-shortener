# App Flow Document
## Smart URL Shortener (Advanced)

Diagrams use [Mermaid](https://mermaid.js.org) (renders on GitHub, VS Code with a Mermaid extension, and most Markdown viewers).

---

## 1. Site Map & Navigation

```mermaid
flowchart TD
    A[Landing page] --> B[Login]
    A --> C[Register]
    B --> D[Dashboard]
    C --> D
    D --> E[My Links]
    D --> F[Analytics overview]
    D --> G[API Keys]
    D --> H[Settings / Profile]
    D --> I[Admin panel - admins only]
    E --> E1[Create link]
    E --> E2[Link details]
    E2 --> E3[Edit link]
    E2 --> E4[Link analytics]
    E2 --> E5[QR code - V2]
    I --> I1[Users]
    I --> I2[All links]
    I --> I3[Reports queue]
```

**Public routes:** `/`, `/login`, `/register`, `/forgot-password`, `/terms`, `/privacy`
**Protected routes:** `/dashboard`, `/links`, `/links/new`, `/links/:id`, `/links/:id/edit`, `/analytics`, `/keys`, `/settings`
**Admin routes:** `/admin/users`, `/admin/links`, `/admin/reports`
**Short-domain routes (API server):** `/:code` (redirect), `/api/v1/...`

## 2. Flow: Registration & Login

```mermaid
flowchart TD
    S[Visitor opens Register] --> F[Fill name, email, password]
    F --> V{Client validation OK?}
    V -- No --> F
    V -- Yes --> P[POST /auth/register]
    P --> R{Server result}
    R -- 409 email exists --> E1[Show: email already registered - link to Login]
    R -- 400 invalid --> E2[Show field errors]
    R -- 429 --> E3[Show: too many attempts, try later]
    R -- 201 --> L[Auto-login: access token in memory + refresh cookie]
    L --> D[Redirect to Dashboard]
```

Login: `POST /auth/login` → 200 → dashboard. 401 shows a generic "Email or password is incorrect" (never reveals which). Suspended users see "Account suspended, contact support."

**Session handling:** access token (15 min) is kept in memory. When an API call returns 401, the client silently calls `POST /auth/refresh`; if that fails, the user is sent to `/login?next=<current path>`. Logout calls `POST /auth/logout` and clears client state.

## 3. Flow: Create a Short Link

```mermaid
flowchart TD
    A[User clicks New Link] --> B[Form: destination URL, optional alias, optional expiry, title, tags]
    B --> C{Client validation}
    C -- Invalid --> B
    C -- Valid --> D[POST /urls]
    D --> E{Server checks}
    E -- Not logged in / token expired --> R[Refresh token, retry once, else Login]
    E -- URL blocked or invalid --> X1[Inline error on URL field]
    E -- Alias reserved --> X2[Error: this alias is not available]
    E -- Alias taken 409 --> X3[Error + suggest alternatives]
    E -- Quota exceeded --> X4[Upgrade / delete-old-links message]
    E -- Rate limited 429 --> X5[Toast: slow down, retry in N s]
    E -- OK 201 --> S[Success panel: short URL, Copy button, QR - V2, View details]
    S --> T[Link appears at top of My Links]
```

**Optional live alias check:** while typing an alias, the UI debounces (400 ms) and calls a lightweight availability check; the server still enforces uniqueness on submit.

## 4. Flow: Visitor Clicks a Short Link (Redirect)

```mermaid
flowchart TD
    V[Visitor requests go.domain/code] --> RL{Rate limit OK?}
    RL -- No --> T429[429 Too many requests]
    RL -- Yes --> C{Redis cache hit?}
    C -- Hit --> ST
    C -- Miss --> DB[Query MongoDB by shortCode]
    DB --> ST{Link state}
    ST -- Not found --> N404[404 page: link does not exist]
    ST -- Blocked --> B410[410 page: link removed for policy reasons + Report]
    ST -- Disabled --> D410[410 page: link disabled by owner]
    ST -- Expired --> E410[410 page: link expired]
    ST -- Active --> RD[HTTP 302 to original URL]
    DB -. store in cache .-> ST
    RD --> LOG[After response: buffer click event + increment counter]
```

Notes
- The redirect never requires login and never waits for analytics.
- Cache misses populate Redis; unknown codes are briefly negative-cached.
- Every error page has a "Report this link" and "Create your own short link" call to action.

## 5. Flow: Manage Links (List → Search → Edit → Disable/Delete)

```mermaid
flowchart TD
    L[My Links] --> Q[Search / filter / sort / paginate]
    Q --> R[GET /urls with query params]
    R --> T[Table or card list]
    T --> A1[Copy short URL]
    T --> A2[Favorite toggle - optimistic]
    T --> A3[Enable / Disable toggle - optimistic]
    T --> A4[Open details]
    T --> A5[Delete - confirmation dialog]
    A4 --> ED[Edit form: destination, title, tags, expiry]
    ED --> SV[PATCH /urls/:id]
    SV --> OK[200: toast Saved, cache invalidated]
    A5 --> DEL[DELETE /urls/:id -> 204, row removed, undo toast 5 s]
```

Rules surfaced in the UI: alias and short code are read-only after creation; changing the destination shows a confirmation ("Existing short link will now go to the new URL") and is recorded in the audit log.

## 6. Flow: View Analytics

```mermaid
flowchart TD
    A[Open link details or Analytics page] --> B[Select range: 7d / 30d / 90d]
    B --> C[GET /urls/:id/analytics]
    C --> D{Data?}
    D -- No clicks yet --> E[Empty state: share your link to start collecting data]
    D -- Has data --> F[KPI cards + timeline chart + referrers + devices + browsers + OS + countries]
```

Dashboard home uses `GET /analytics/summary` for totals, active vs expired counts, clicks over time, and top links.

## 7. Flow: API Keys & Programmatic Use

```mermaid
flowchart TD
    K[API Keys page] --> N[Create key: name, optional expiry]
    N --> P[POST /keys]
    P --> S[Modal shows full key ONCE with Copy button and warning]
    S --> L[List shows name, prefix, last used, status]
    L --> RV[Revoke -> confirmation -> DELETE /keys/:id]
    subgraph Client app
      X[Request with header X-API-Key] --> M[Auth middleware hashes key, looks up]
      M --> Ok{Valid, not revoked, not expired?}
      Ok -- No --> U401[401 Unauthorized]
      Ok -- Yes --> Q[Quota + rate limit check]
      Q --> H[Handler runs as key owner]
    end
```

## 8. Flow: Abuse Reporting & Admin Moderation

```mermaid
flowchart TD
    A[Anyone sees suspicious short link] --> B[Report form: code, reason, optional email]
    B --> C[POST /reports -> 201]
    C --> D[Report enters admin queue: status open]
    D --> E[Admin reviews destination and link details]
    E --> F{Decision}
    F -- Abusive --> G[Block link - status blocked, cache invalidated, optional suspend owner]
    F -- Fine --> H[Dismiss report]
    G --> I[Report resolved, audit log entry]
    H --> I
```

Blocked links show the policy-removal page to visitors; the owner sees a "Blocked by admin" badge and cannot re-enable it.

## 9. Flow: Link Lifecycle (state machine)

```mermaid
stateDiagram-v2
    [*] --> Active: created
    Active --> Disabled: owner disables
    Disabled --> Active: owner enables
    Active --> Expired: expiresAt reached (derived, no write needed)
    Expired --> Active: owner sets a new future expiry
    Active --> Blocked: admin blocks
    Disabled --> Blocked: admin blocks
    Blocked --> Active: admin unblocks
    Active --> Deleted: owner deletes (soft)
    Disabled --> Deleted
    Expired --> Deleted
    Deleted --> [*]
```

`Expired` is computed from `expiresAt` at read time, so there is nothing to update when a link expires. A nightly job only cleans up old data.

## 10. Flow: Admin Panel

1. Admin logs in (role `admin`) → sidebar shows **Admin**.
2. **Users:** search, view plan/status, suspend/reactivate, change plan.
3. **Links:** search by code/alias/domain/owner, block/unblock.
4. **Reports:** queue sorted by newest/open, resolve or dismiss.
5. Every admin action writes to `auditlogs`.

## 11. Error & Edge-Case Handling (global)

| Situation | User experience |
|---|---|
| Network failure | Toast "Can't reach the server" + retry button; forms keep their data |
| 401 during session | Silent refresh; if it fails, redirect to login with return path |
| 403 / not owner | Show "Not found" (does not reveal existence) |
| 404 route | Friendly 404 page with link home |
| 429 | Toast with countdown from `Retry-After` |
| 500 | Generic error with request ID for support |
| Redis down | Invisible to users; redirects fall back to MongoDB |
| Very long URL / unsupported scheme | Inline field error explaining accepted formats |
| Concurrent alias create | One succeeds, others get "alias taken" |

## 12. Page-Level Data Dependencies

| Page | API calls |
|---|---|
| Dashboard home | `/analytics/summary`, `/urls?limit=5&sort=createdAt` |
| My Links | `/urls` (query params) |
| Create / Edit | `POST /urls`, `PATCH /urls/:id` |
| Link details | `/urls/:id`, `/urls/:id/analytics` |
| API Keys | `/keys`, `/usage` |
| Settings | `/auth/me`, `PATCH /auth/me` |
| Admin | `/admin/users`, `/admin/urls`, `/admin/reports` |
