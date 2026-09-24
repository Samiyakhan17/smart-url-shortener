# Smart URL Shortener (Advanced)

Node.js + Express + MongoDB API with a Next.js dashboard.
Planning docs live in [`/docs`](./docs): PRD, TRD, App Flow, UI/UX brief, Backend Schema, Implementation Plan.

## Quick start (local)

```bash
docker compose up -d          # MongoDB + Redis
cd backend
cp .env.example .env
npm install
npm run dev
```

## Status
- [x] Phase 0: Project setup
- [x] Phase 1: Express foundation + MongoDB
- [x] Phase 2: Login system
- [x] Phase 3: Core shortener (create, redirect, list, edit, delete)
- [x] Phase 4: Analytics, search, filters, destination history
- [x] Phase 5: Rate limiting, plan quotas, API keys, usage
- [x] Phase 6: Frontend UI + dashboard integration