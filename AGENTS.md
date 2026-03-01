# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is the **Suggestion Platform** — a feedback/suggestion collection app for businesses. It has two services:

| Service | Directory | Dev command | Port | Notes |
|---------|-----------|-------------|------|-------|
| Backend API | `backend/` | `npm run dev` | 3000 | Express + TypeScript + MongoDB |
| Frontend | `frontend/suggestion/` | `npm run dev` | 5173 | React 19 + Vite + TailwindCSS 4 |

Both are required for end-to-end testing. MongoDB must also be running on port 27017.

### Running services locally (without Docker)

Standard commands are documented in the root `README.md`. Key non-obvious notes:

- **MongoDB**: Must be running on `localhost:27017` before starting the backend. Start with: `sudo mongod --dbpath /data/db --fork --logpath /var/log/mongod.log`
- **Frontend `.env` port mismatch**: The `.env.example` sets `VITE_API_URL=http://localhost:3001` (matching the Docker Compose port mapping). When running locally without Docker, the backend listens on port **3000**, so create `frontend/suggestion/.env` with `VITE_API_URL=http://localhost:3000`. Changing this requires restarting the Vite dev server (not hot-reloaded).
- **Backend `.env`**: Copy from `backend/.env.example`; defaults work for local dev.

### Lint / Test / Build

| Task | Backend | Frontend |
|------|---------|----------|
| Lint | `npm run lint` (in `backend/`) | `npm run lint` (in `frontend/suggestion/`) |
| Test | `npm test` (in `backend/`) — uses `mongodb-memory-server`, no external DB needed | `npm test` (in `frontend/suggestion/`) — uses Jest + jsdom, no backend needed |
| Build | N/A (TypeScript compiled at runtime via `ts-node-dev`) | `npm run build` (in `frontend/suggestion/`) |

### Gotchas

- Backend tests use `mongodb-memory-server` and do **not** require an external MongoDB instance.
- The root `package.json` only has deploy scripts — `npm install` at the root does not install backend/frontend deps.
- `bcrypt` (native addon) is used in the backend — if `npm ci` fails on it, ensure build tools are available (`build-essential`).
