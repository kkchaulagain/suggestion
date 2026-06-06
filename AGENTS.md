# AGENTS.md

## Cursor Cloud specific instructions

### Product overview

**Suggestion** is a monorepo with:
- `backend/` — Express + MongoDB API (port **3000** bare metal, **3001** via Docker Compose)
- `frontend/suggestion/` — React + Vite SPA (port **5173** bare metal, **3002** via Docker Compose)

See `README.md` and `docs/ENV.md` for env details.

### Services required for local dev

| Service | Port | Notes |
|---------|------|-------|
| MongoDB 7 | 27017 | Required for running the app and backend tests (`suggestion` DB; tests use `suggestion_test`) |
| Backend API | 3000 | `cd backend && npm run dev` |
| Frontend | 5173 | `cd frontend/suggestion && npm run dev` |

### MongoDB without Docker

This environment has no systemd. After a fresh VM, start MongoDB manually if it is not already running:

```bash
pgrep mongod || sudo -u mongodb mongod --dbpath /var/lib/mongodb --bind_ip 127.0.0.1 --port 27017 --fork --logpath /var/log/mongodb/mongod.log
```

Backend tests connect to `mongodb://localhost:27017/suggestion_test` (see `backend/src/__tests__/setup.ts`).

### Env files (not committed)

Copy once if missing:

```bash
cp backend/.env.example backend/.env
cp frontend/suggestion/.env.example frontend/suggestion/.env
```

For **bare-metal** dev (API on 3000), keep `VITE_API_URL=http://localhost:3000` in `frontend/suggestion/.env`. Docker Compose uses `http://localhost:3001` instead.

### Running dev servers

Prefer **tmux** for long-running processes:

```bash
# Backend
cd backend && npm run dev

# Frontend (separate terminal/tmux session)
cd frontend/suggestion && npm run dev
```

**Docker alternative** (all three services): `docker compose up --build` — requires Docker and `backend/.env`.

### Lint, test, build

From repo root (see `package.json`):

| Task | Command |
|------|---------|
| Lint (both) | `npm run lint` |
| Test (both) | `npm run check` |
| Test + coverage | `npm run check:coverage` |
| Full CI locally | `./scripts/run-ci-local.sh` (needs MongoDB; optional Python for diff-cover) |

Per-package: `npm run lint`, `npm test`, `npm run build` (frontend only) inside `backend/` or `frontend/suggestion/`.

### Optional integrations

- **Cloudflare R2** (`R2_*` in `backend/.env`) — image uploads; without it, upload returns 503
- **SMTP** (`EMAIL_USER`, `EMAIL_PASS`) — email notifications; features degrade without it

### Gotchas

- Node **20** is used in CI/Docker; Node 22 on the VM generally works but match CI if debugging version-specific issues.
- `npm run check:frontend` runs `build` as part of the check — slower than lint-only.
- Husky `pre-push` runs `npm run check` (lint + tests, no coverage).
