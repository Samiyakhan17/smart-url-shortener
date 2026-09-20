# Backend Schema Document
## Smart URL Shortener (Advanced) — MongoDB + Mongoose

---

## 1. Overview

| Collection | Purpose | Phase | Growth |
|---|---|---|---|
| `users` | Accounts, roles, plans | MVP | Low |
| `urls` | Short link metadata | MVP | Medium |
| `clicks` | Raw click events (TTL) | MVP/V1 | **High** |
| `refreshtokens` | Rotating refresh sessions | MVP | Medium |
| `apikeys` | Programmatic access keys | V1 | Low |
| `reports` | Abuse reports | V1 | Low |
| `auditlogs` | Destination edits and admin actions | V1 | Low–Medium |
| `dailystats` | Pre-aggregated per-link daily analytics | V1/V2 | Medium |
| `tags` | Tag catalogue (optional) | V2 | Low |

```
users 1 ─── * urls 1 ─── * clicks
  │            │ └───── * dailystats
  ├── * apikeys │ └───── * auditlogs
  ├── * refreshtokens
  └── * reports (as resolver)      urls 1 ─── * reports
```

Conventions: `_id` is ObjectId · timestamps via Mongoose `{ timestamps: true }` · all times stored in UTC · references use `ObjectId` with `ref` · soft delete via `deletedAt`.

---

## 2. `users`

| Field | Type | Req | Default | Notes |
|---|---|---|---|---|
| `_id` | ObjectId | ✔ | auto | |
| `name` | String | ✔ | | trim, 2–60 chars |
| `email` | String | ✔ | | lowercase, trim, **unique** |
| `passwordHash` | String | ✔ | | bcrypt; `select: false` |
| `role` | String enum | ✔ | `user` | `user`, `admin` |
| `plan` | String enum | ✔ | `free` | `free`, `pro` |
| `status` | String enum | ✔ | `active` | `active`, `suspended` |
| `emailVerified` | Boolean | | false | V1.5 |
| `lastLoginAt` | Date | | | |
| `createdAt` / `updatedAt` | Date | ✔ | auto | |

**Indexes:** `{ email: 1 }` unique · `{ role: 1, status: 1 }` (admin lists)
**Hooks/transforms:** `toJSON` removes `passwordHash` and `__v`.

## 3. `urls`

| Field | Type | Req | Default | Notes |
|---|---|---|---|---|
| `_id` | ObjectId | ✔ | auto | |
| `ownerId` | ObjectId → users | ✔* | | `null` only for guest links (V1) |
| `shortCode` | String | ✔ | generated | **unique**; holds random code or custom alias |
| `isCustomAlias` | Boolean | ✔ | false | true if user-chosen |
| `originalUrl` | String | ✔ | | normalised http/https, ≤ 2048 |
| `originalHost` | String | ✔ | | denormalised for admin search/deny-list |
| `title` | String | | | ≤ 100 chars |
| `status` | String enum | ✔ | `active` | `active`, `disabled`, `blocked` |
| `startsAt` | Date | | null | V2 scheduled activation |
| `expiresAt` | Date | | null | null = never |
| `clickCount` | Number | ✔ | 0 | human clicks; updated with `$inc` |
| `lastClickedAt` | Date | | null | |
| `tags` | [String] | | [] | lowercase, ≤ 10 tags, ≤ 24 chars each |
| `isFavorite` | Boolean | | false | |
| `passwordHash` | String | | | V2 password-protected links; `select:false` |
| `blockedReason` | String | | | set by admin |
| `deletedAt` | Date | | null | soft delete |
| `createdAt` / `updatedAt` | Date | ✔ | auto | |

**Derived (virtual) `state`:** `deleted` if `deletedAt` → `blocked` if status=blocked → `disabled` if status=disabled → `scheduled` if `startsAt` > now → `expired` if `expiresAt` ≤ now → otherwise `active`.

**Indexes**
```js
{ shortCode: 1 }                                   // unique — redirect lookup & collision guard
{ ownerId: 1, deletedAt: 1, createdAt: -1 }        // My Links default listing
{ ownerId: 1, status: 1, createdAt: -1 }           // status filter
{ ownerId: 1, clickCount: -1 }                     // sort by clicks
{ ownerId: 1, expiresAt: 1 }                       // expiring soon / expired filters
{ ownerId: 1, tags: 1 }                            // tag filter
{ ownerId: 1, isFavorite: 1 }                      // favorites filter
{ expiresAt: 1 }  partial: { expiresAt: { $type: "date" } } // cleanup job
{ originalHost: 1 }                                // admin/deny-list lookups
{ title: "text", originalUrl: "text" }             // text search (or use prefix regex on shortCode)
```

**Constraint note:** Because random codes and aliases share `shortCode`, one unique index guarantees a single namespace. Aliases are stored lowercase; the alias validator rejects reserved words before insert; E11000 → `409 ALIAS_TAKEN` (alias) or retry (random code).

**Mongoose sketch**
```js
const urlSchema = new Schema({
  ownerId:       { type: Schema.Types.ObjectId, ref: 'User', index: true },
  shortCode:     { type: String, required: true, unique: true, trim: true },
  isCustomAlias: { type: Boolean, default: false },
  originalUrl:   { type: String, required: true, maxlength: 2048 },
  originalHost:  { type: String, required: true },
  title:         { type: String, maxlength: 100 },
  status:        { type: String, enum: ['active','disabled','blocked'], default: 'active' },
  startsAt:      { type: Date, default: null },
  expiresAt:     { type: Date, default: null },
  clickCount:    { type: Number, default: 0, min: 0 },
  lastClickedAt: { type: Date, default: null },
  tags:          { type: [String], default: [] },
  isFavorite:    { type: Boolean, default: false },
  blockedReason: String,
  deletedAt:     { type: Date, default: null },
}, { timestamps: true });

urlSchema.virtual('state').get(function () {
  const now = new Date();
  if (this.deletedAt) return 'deleted';
  if (this.status === 'blocked') return 'blocked';
  if (this.status === 'disabled') return 'disabled';
  if (this.startsAt && this.startsAt > now) return 'scheduled';
  if (this.expiresAt && this.expiresAt <= now) return 'expired';
  return 'active';
});
```

## 4. `clicks` (raw events)

| Field | Type | Req | Notes |
|---|---|---|---|
| `_id` | ObjectId | ✔ | |
| `urlId` | ObjectId → urls | ✔ | |
| `ts` | Date | ✔ | event time (UTC) |
| `referrerHost` | String | | host only (e.g. `twitter.com`); `direct` if none |
| `deviceType` | String enum | | `desktop`, `mobile`, `tablet`, `bot`, `other` |
| `browser` | String | | e.g. Chrome |
| `os` | String | | e.g. Windows, Android |
| `country` | String | | ISO-3166 alpha-2, approximate |
| `isBot` | Boolean | ✔ | bots kept for visibility, excluded from stats |
| `visitorHash` | String | | V2; daily-salted hash, irreversible |

Privacy: **no raw IP address and no full user-agent string are stored.**

**Indexes**
```js
{ urlId: 1, ts: -1 }                        // analytics per link
{ ts: 1 }  expireAfterSeconds: 7776000      // TTL 90 days (free); pro retention via nightly purge job or separate TTL policy
{ urlId: 1, isBot: 1, ts: -1 }              // human-only queries (optional)
```
Use MongoDB **time-series collection** (`timeField: ts`, `metaField: urlId`) as a later optimisation if volume grows.

**Retention by plan:** a single TTL index covers the largest window (365 d); the nightly job deletes free-plan events older than 90 d. Aggregates in `dailystats` persist beyond raw retention.

## 5. `refreshtokens`

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId → users | |
| `tokenHash` | String | SHA-256 of the token; unique |
| `familyId` | String | rotation family; reuse of a rotated token revokes the family |
| `expiresAt` | Date | |
| `revokedAt` | Date | null while valid |
| `replacedBy` | ObjectId | next token in chain |
| `userAgent` | String | short, for "active sessions" list (optional) |
| `createdAt` | Date | |

**Indexes:** `{ tokenHash: 1 }` unique · `{ userId: 1 }` · `{ expiresAt: 1 }` TTL (`expireAfterSeconds: 0`).

## 6. `apikeys`

| Field | Type | Req | Notes |
|---|---|---|---|
| `userId` | ObjectId → users | ✔ | |
| `name` | String | ✔ | 1–50 chars |
| `prefix` | String | ✔ | first 8–12 chars for display (`usk_live_ab12`) |
| `keyHash` | String | ✔ | SHA-256 of full key; **unique**; `select:false` |
| `status` | String enum | ✔ | `active`, `revoked` |
| `lastUsedAt` | Date | | throttled update (at most once/min) |
| `expiresAt` | Date | | optional |
| `createdAt` | Date | ✔ | |

**Indexes:** `{ keyHash: 1 }` unique · `{ userId: 1, status: 1 }`.
The raw key is generated once, returned in the create response, and never persisted.

## 7. `reports`

| Field | Type | Notes |
|---|---|---|
| `urlId` | ObjectId → urls | may be null if code no longer exists |
| `shortCode` | String | as reported |
| `reason` | String enum | `phishing`, `malware`, `spam`, `illegal`, `other` |
| `details` | String | ≤ 500 chars |
| `reporterEmail` | String | optional |
| `reporterIpHash` | String | hashed, for de-duplication/rate limiting |
| `status` | String enum | `open`, `resolved`, `dismissed` |
| `resolvedBy` | ObjectId → users | |
| `resolutionNote` | String | |
| `createdAt` / `updatedAt` | Date | |

**Indexes:** `{ status: 1, createdAt: -1 }` · `{ urlId: 1 }`.

## 8. `auditlogs`

| Field | Type | Notes |
|---|---|---|
| `actorId` | ObjectId → users | who did it (or null for system) |
| `actorType` | String enum | `user`, `admin`, `apikey`, `system` |
| `action` | String | `url.update_destination`, `url.block`, `user.suspend`, `report.resolve`, … |
| `targetType` / `targetId` | String / ObjectId | |
| `before` / `after` | Mixed | minimal changed fields (e.g. old and new `originalUrl`) |
| `createdAt` | Date | |

**Indexes:** `{ targetType: 1, targetId: 1, createdAt: -1 }` · `{ actorId: 1, createdAt: -1 }`.

## 9. `dailystats` (V1/V2)

| Field | Type | Notes |
|---|---|---|
| `urlId` | ObjectId | |
| `date` | Date | UTC midnight |
| `clicks` | Number | human clicks that day |
| `uniqueVisitors` | Number | V2 |
| `referrers` | Map<String, Number> | top N hosts |
| `devices`, `browsers`, `oses`, `countries` | Map<String, Number> | |

**Indexes:** `{ urlId: 1, date: -1 }` unique compound `{ urlId, date }`.
Built by a nightly job (`$group` over yesterday's `clicks`, upsert). Queries over 30+ days read from here; last 24–48 h read from `clicks`.

## 10. `tags` (optional, V2)
`{ userId, name (lowercase), color?, createdAt }` with unique `{ userId: 1, name: 1 }`. For MVP/V1, tags are simply a string array on `urls`.

---

## 11. Validation Rules Summary

| Field | Rule |
|---|---|
| email | RFC-valid, lowercase, ≤ 254 |
| password | 8–72 chars, at least one letter and one number |
| originalUrl | http/https only, ≤ 2048, no credentials, host not private/loopback/self |
| alias | `^[a-z0-9][a-z0-9_-]{2,31}$`, not in reserved list |
| expiresAt | ISO-8601, in the future, ≤ 5 years ahead |
| tags | ≤ 10 per link, `^[a-z0-9-]{1,24}$` |
| title | ≤ 100 chars, trimmed, no control characters |

## 12. Key Queries & Aggregations

**Redirect lookup (hot path)**
```js
Url.findOne({ shortCode: code, deletedAt: null })
   .select('originalUrl status startsAt expiresAt')
   .lean();
```

**Increment counters (batched)**
```js
Url.updateOne({ _id }, { $inc: { clickCount: n }, $set: { lastClickedAt: now } });
```

**List with filters**
```js
const filter = { ownerId, deletedAt: null };
if (status) filter.status = status;
if (tag) filter.tags = tag;
if (q) filter.$or = [{ shortCode: new RegExp('^' + escape(q), 'i') }, { $text: { $search: q } }];
Url.find(filter).sort({ [sortField]: order }).skip((page-1)*limit).limit(limit);
```
(Note: `$text` cannot be combined inside `$or` with other non-indexed clauses in some cases — implement as two queries merged, or use Atlas Search later.)

**Clicks over time (last 30 days, per day)**
```js
Click.aggregate([
  { $match: { urlId, isBot: false, ts: { $gte: from, $lt: to } } },
  { $group: { _id: { $dateTrunc: { date: '$ts', unit: 'day' } }, clicks: { $sum: 1 } } },
  { $sort: { _id: 1 } }
]);
```

**Breakdowns (referrer/device/browser/os/country)**
```js
Click.aggregate([
  { $match: { urlId, isBot: false, ts: { $gte: from, $lt: to } } },
  { $group: { _id: '$referrerHost', clicks: { $sum: 1 } } },
  { $sort: { clicks: -1 } }, { $limit: 10 }
]);
```

**Dashboard summary:** totals with `Url.aggregate` on `{ ownerId, deletedAt:null }` (`$sum: '$clickCount'`, count by computed state), top links = `Url.find().sort({clickCount:-1}).limit(5)`.

**Expired-link cleanup (optional job):** no status change needed; the job only reports/archives. Guest links (`ownerId:null`) past expiry can be hard-deleted.

## 13. Example Documents

```json
// urls
{
  "_id": "66f1c2a9b7d4a1a2b3c4d5e6",
  "ownerId": "66f1c0f3b7d4a1a2b3c4d5aa",
  "shortCode": "portfolio",
  "isCustomAlias": true,
  "originalUrl": "https://example.com/some/very/long/path",
  "originalHost": "example.com",
  "title": "My portfolio",
  "status": "active",
  "expiresAt": "2027-01-01T00:00:00.000Z",
  "clickCount": 42,
  "tags": ["portfolio", "resume"],
  "isFavorite": true,
  "deletedAt": null,
  "createdAt": "2026-09-19T10:00:00.000Z",
  "updatedAt": "2026-09-19T10:00:00.000Z"
}

// clicks
{
  "urlId": "66f1c2a9b7d4a1a2b3c4d5e6",
  "ts": "2026-09-19T12:31:07.221Z",
  "referrerHost": "linkedin.com",
  "deviceType": "mobile",
  "browser": "Chrome",
  "os": "Android",
  "country": "IN",
  "isBot": false
}
```

## 14. Data Lifecycle & Integrity

| Concern | Approach |
|---|---|
| Deleting a link | Set `deletedAt`; redirect returns 404; clicks kept until TTL; hard-delete job after 30 days |
| Deleting a user (V2) | Soft-delete user, disable all links, purge PII |
| Blocked link | `status: blocked` remains queryable for admins; owner cannot unblock |
| Cache consistency | Every write path that changes `status`, `originalUrl`, `expiresAt`, `deletedAt` calls `cache.del('short:'+shortCode)` |
| Migrations | Use `migrate-mongo`; index creation via migrations or `autoIndex: false` in production with explicit `syncIndexes` on deploy |
| Backups | Atlas continuous backups; restore drill before launch |
| Referential integrity | Enforced in services (MongoDB has no FKs); orphaned clicks are removed by TTL |

## 15. Seed & Config Data

- Admin seed script (`npm run seed:admin`) reading email/password from env.
- `config/plans.js` — limits per plan (see PRD §8).
- `config/reserved.js` — reserved alias list (see TRD §3.5).
