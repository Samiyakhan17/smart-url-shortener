# UI/UX Design Brief
## Smart URL Shortener (Advanced)

---

## 1. Design Goals

1. **Speed to first link.** A new visitor should create a short link in under 10 seconds.
2. **Clarity over decoration.** Modern SaaS look: clean cards, generous spacing, obvious primary actions.
3. **Trustworthy.** A link tool must feel safe: clear status badges, honest error pages, visible security cues.
4. **Data made readable.** Analytics should answer "is my link working?" at a glance.
5. **Works everywhere.** Fully responsive from 360 px phones to wide desktops, light and dark themes, keyboard accessible.

## 2. Audience & Tone

Students, freelancers, marketers, and developers. Tone of voice: friendly, concise, plain English. No jargon in the UI ("Link expired", not "410 Gone" – although status codes can appear in developer docs and API-key screens).

## 3. Visual Language

### 3.1 Colour tokens

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--bg` | `#F8FAFC` | `#0B1120` | App background |
| `--surface` | `#FFFFFF` | `#111827` | Cards, tables |
| `--surface-2` | `#F1F5F9` | `#1F2937` | Inputs, hover rows |
| `--border` | `#E2E8F0` | `#273449` | Dividers |
| `--text` | `#0F172A` | `#E5E7EB` | Primary text |
| `--text-muted` | `#64748B` | `#9CA3AF` | Secondary text |
| `--primary` | `#4F46E5` | `#6366F1` | Primary buttons, links, active nav |
| `--success` | `#16A34A` | `#22C55E` | Active status |
| `--warning` | `#D97706` | `#F59E0B` | Expiring soon |
| `--danger` | `#DC2626` | `#EF4444` | Errors, destructive actions |
| `--neutral` | `#64748B` | `#94A3B8` | Disabled / deleted |

Chart palette (colour-blind safe, in order): indigo `#4F46E5`, teal `#0D9488`, amber `#F59E0B`, rose `#E11D48`, sky `#0EA5E9`, slate `#64748B`.

### 3.2 Typography
- Font: **Inter** (UI) and **JetBrains Mono** (short URLs, API keys, code).
- Scale: 12 / 14 (body) / 16 / 20 / 24 / 30 / 40 px. Headings 600 weight; body 400.
- Short URLs always display in mono, with the domain muted and the code emphasised.

### 3.3 Shape, spacing, elevation
- 4 px spacing grid (4, 8, 12, 16, 24, 32, 48).
- Radius: 8 px controls, 12 px cards, full for badges.
- Elevation: 1 px border + very soft shadow for cards; stronger shadow only on modals/menus.
- Icons: Lucide, 16–20 px, stroke 1.75.

### 3.4 Motion
150–200 ms ease-out for hover/focus/toggles; modal fade+scale 200 ms; skeleton shimmer for loading. Respect `prefers-reduced-motion`.

## 4. Layout & Navigation

- **Landing/auth pages:** centred single column, top bar with logo and Login/Register.
- **App shell:** left sidebar (240 px, collapsible to icons at ≤ 1024 px, becomes bottom sheet / hamburger drawer on mobile) + top bar (search, theme toggle, user menu) + content area max-width 1200 px.
- **Sidebar items:** Dashboard · My Links · Analytics · API Keys · Settings · *(Admin, if role)*.
- **Primary CTA:** "＋ New link" button fixed in top bar (desktop) and floating action button (mobile).

## 5. Screen Specifications

### 5.1 Landing page
- Hero: headline ("Short links you control"), sub-copy, **URL input + "Shorten" button** side by side (stacked on mobile).
- After submit (guest, V1): result card with short URL, Copy button, note "Sign up to track clicks and manage this link".
- Sections: 3 feature cards (Analytics, Custom aliases, API), a short "how it works" (paste → shorten → share), footer (Terms, Privacy, API docs, Report a link).

### 5.2 Register / Login
- Card form, labels above fields, show/hide password, inline validation, password-strength meter on register.
- Errors appear under the field; form-level error in an alert at top. Buttons show a spinner and disable while submitting.

### 5.3 Dashboard home
```
┌ Sidebar ┬───────────────────────────────────────────────────────────┐
│ Logo    │  Search…                          ☾   (Avatar ▾)  [+ New link]│
│ ▸ Dash  │  ───────────────────────────────────────────────────────── │
│   Links │  [Total links] [Total clicks] [Clicks (7d)] [Active/Expired]│
│   Anal. │  ┌────────────── Clicks over time (30d) ───────────────┐   │
│   Keys  │  │  ▁▂▃▅▆▇▅▃▂▄▆█                                       │   │
│   Sett. │  └─────────────────────────────────────────────────────┘   │
│         │  Top links (table, 5 rows)      Recent links (5 rows)      │
└─────────┴───────────────────────────────────────────────────────────┘
```
KPI cards: number, label, small trend vs previous period (▲/▼ with colour **and** text/icon).

### 5.4 My Links
- Toolbar: search field, filters (Status, Tag, Favorites, Date), Sort dropdown, view toggle (table/cards).
- **Table columns:** ★ favorite · Title (or destination host) + destination truncated · Short URL (mono) + copy icon · Clicks · Status badge · Created · Expires · ⋯ actions menu.
- Row actions: Copy, Open, Details, Edit, Enable/Disable, Delete.
- Mobile: cards with short URL on top, badges, clicks, and an actions menu.
- Pagination footer (page size 10/20/50) with total count; keep filter state in the URL query string.

### 5.5 Create / Edit link (modal on desktop, full page on mobile)
Fields in order: Destination URL* · Title · Custom alias (prefix shows `go.example.com/`, live availability indicator) · Expiry (quick chips: 1 day, 7 days, 30 days, Custom, Never) · Tags (chips input).
- Edit mode: alias shown read-only with lock icon and tooltip "Aliases can't be changed".
- Changing destination on an existing link shows a confirmation note.
- Primary "Create link", secondary "Cancel". After success: inline result panel with Copy, "Create another", "View details".

### 5.6 Link details & analytics
- Header: title, short URL with Copy/Open, status badge, action buttons (Edit, Disable, Delete).
- Info strip: destination (full, with external-link icon), created, expires, tags.
- Range tabs: 7d · 30d · 90d.
- KPI row: Total clicks, Clicks in range, Top referrer, Top country.
- Timeline chart (line/area), then a 2×2 grid: Referrers (bar), Devices (donut), Browsers (bar), OS (bar); Countries list below.
- Audit history (destination changes) in a collapsible section.
- Empty state: illustration + "No clicks yet – share your link!" with copy button.

### 5.7 API Keys
- Explanation text + link to API docs.
- Table: Name · Key prefix (`usk_live_ab12…`) · Created · Last used · Expires · Status · Revoke.
- Create modal → success modal shows full key **once** in mono with Copy and a warning banner ("You won't see this again").
- Usage panel: progress bars for daily API calls and active links vs plan limits.

### 5.8 Settings / Profile
Sections: Profile (name, email), Password, Theme preference, Danger zone (delete account – V2).

### 5.9 Admin panel
- **Users:** table with role/plan/status chips, search, suspend/reactivate, change plan.
- **Links:** search by code/alias/owner/destination host; Block/Unblock.
- **Reports:** queue with status filter; detail drawer showing report reason, link, destination, owner, and Resolve/Dismiss/Block actions.

### 5.10 Public status pages (served by the API)
Small, standalone, lightweight HTML (no JS framework):
| State | Icon | Headline | Body | Actions |
|---|---|---|---|---|
| Not found | ❓ | Link not found | This short link doesn't exist or was typed incorrectly. | Go home |
| Expired | ⏳ | This link has expired | The owner set it to stop working after a certain date. | Go home · Report |
| Disabled | ⏸ | Link unavailable | The owner has turned this link off. | Go home · Report |
| Blocked | ⛔ | Link removed | This link was removed for violating our policies. | Go home |

## 6. Components Library (build once, reuse)

Button (primary/secondary/ghost/danger, sizes, loading) · Input / Textarea / Select · Field wrapper (label, hint, error) · Copy-to-clipboard button (icon → check for 1.5 s) · Status badge · Tag chip · Toggle switch · Modal / Drawer / Confirm dialog · Dropdown menu · Tabs · Data table + pagination · Card / KPI card · Toast · Skeleton · Empty state · Chart wrappers (line, bar, donut) · Breadcrumbs · Theme toggle · Avatar menu.

### Status badges
| Status | Colour | Label |
|---|---|---|
| Active | success | ● Active |
| Expiring soon (< 48 h) | warning | ◔ Expires in 1d |
| Expired | neutral | ○ Expired |
| Disabled | neutral | ⏸ Disabled |
| Blocked | danger | ⛔ Blocked |
| Scheduled (V2) | primary | ⏰ Starts Jan 1 |

Badges always include text + icon; colour is never the only signal.

## 7. States & Feedback

| State | Treatment |
|---|---|
| Loading | Skeletons matching the final layout (tables: 5 skeleton rows; charts: grey block) |
| Empty (no links) | Illustration, "Create your first short link", primary button |
| Empty (no search results) | "No links match your filters" + Clear filters |
| Error (fetch) | Inline card with message + Retry |
| Success | Toast (bottom-right desktop, top mobile), auto-dismiss 4 s, "Undo" for deletes |
| Destructive actions | Confirm dialog naming the item; danger button; typed confirmation only for bulk delete |
| Copy | Icon morphs to ✓ and a toast "Copied" (also announced to screen readers) |

## 8. Microcopy Examples
- Placeholder URL: `https://example.com/your-very-long-link`
- Alias hint: "3–32 characters: letters, numbers, - and _"
- Alias taken: "That alias is taken. Try `portfolio-2`, `my-portfolio`."
- Expiry helper: "After this time, visitors will see an 'expired' page."
- Rate limit: "You're going a bit fast. Try again in 30 seconds."
- Key warning: "Copy this key now. For security, we can't show it again."

## 9. Responsive Behaviour

| Breakpoint | Behaviour |
|---|---|
| < 640 px | Bottom/hamburger nav, cards instead of tables, full-screen modals, KPI cards 2-up |
| 640–1023 px | Collapsed icon sidebar, tables with horizontal scroll inside container |
| ≥ 1024 px | Full sidebar, full tables, 4-up KPI cards |

The page body never scrolls horizontally; wide tables scroll inside their own container. Touch targets ≥ 44 × 44 px.

## 10. Accessibility (WCAG 2.1 AA)
- Colour contrast ≥ 4.5:1 for text, 3:1 for UI components (both themes).
- Full keyboard navigation with visible focus ring (2 px primary outline).
- Semantic HTML, ARIA labels on icon buttons, `aria-live` for toasts and copy confirmation.
- Forms: labels tied to inputs, errors linked with `aria-describedby`.
- Charts include text summaries / data tables for screen readers.
- Modals trap focus and restore it on close; `Esc` closes.
- Respect reduced-motion and system colour scheme.

## 11. Dark Mode
Implemented with CSS variables and `next-themes` (system default, manual toggle persisted per user). Charts and badges use the dark token set; avoid pure black (`#000`) and pure white text.

## 12. Deliverables for Design Phase
1. Low-fidelity wireframes for the 10 screens above (Figma or hand sketches).
2. Design tokens + component sheet (buttons, inputs, badges, tables, charts).
3. High-fidelity mockups: Landing, Dashboard, My Links, Create modal, Link details, API Keys (light + dark, desktop + mobile).
4. Clickable prototype of the create-link → copy → view analytics path.
5. Tailwind config mapping the tokens above.
