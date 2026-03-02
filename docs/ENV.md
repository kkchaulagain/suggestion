# Environment variables

How to manage env for local dev and Fly.io.

## Rules

- **Never commit** `.env` (it’s in `.gitignore`).
- **Do commit** `.env.example` as a template (no real secrets).
- **Secrets** (DB URLs, JWT keys) → use Fly **secrets** or local `.env` only.

---

## Backend

| Variable | Local | Fly.io | Notes |
|----------|--------|--------|--------|
| `PORT` | `.env` or default `3000` | `fly.toml` `[env]` | Set in fly.toml |
| `MONGODB_URI` | `backend/.env` | **Secret** | Required in prod |
| `JWT_SECRET` | `backend/.env` | **Secret** | Required in prod |
| `FRONTEND_FORM_BASE_URL` | optional in `.env` | **Secret** (optional) | For QR form links |

### Local

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with real values (or leave defaults for dev)
```

### Fly.io

**Non-secret** (already in `backend/fly.toml`):

```toml
[env]
  PORT = "3000"
```

**Secrets** (set once per app):

```bash
fly secrets set MONGODB_URI="mongodb+srv://..." JWT_SECRET="your-secret" -a suggestion
# Optional: base URL for form link and QR (frontend URL where /feedback-forms is served)
fly secrets set FRONTEND_FORM_BASE_URL="https://suggestion-web.fly.dev/feedback-forms" -a suggestion
```

List: `fly secrets list -a suggestion`

---

## Frontend

| Variable | Local | Fly.io | Notes |
|----------|--------|--------|--------|
| `VITE_API_URL` | `frontend/suggestion/.env` or default | **Build arg** in `fly.toml` | API base URL (no trailing slash). Baked in at **build** time. |

### Local

```bash
cp frontend/suggestion/.env.example frontend/suggestion/.env
# Optional: change VITE_API_URL if API runs elsewhere (default: http://localhost:3001)
```

### Fly.io

The API URL is set at **build** time in `frontend/suggestion/fly.toml`:

```toml
[build.args]
  VITE_API_URL = "https://suggestion.fly.dev"
```

To use another backend URL:

```bash
fly deploy ./frontend/suggestion --build-arg VITE_API_URL=https://your-api.fly.dev -a suggestion-web
```

---

## Quick reference

| Where | Backend env | Frontend env |
|-------|-------------|--------------|
| **Local** | `backend/.env` (from `backend/.env.example`) | `frontend/suggestion/.env` (from `.env.example`) |
| **Fly backend** | `fly secrets set` + `[env]` in `backend/fly.toml` | — |
| **Fly frontend** | — | `[build.args]` in `frontend/suggestion/fly.toml` |
