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
| `R2_*` (see below) | optional in `.env` | **Secrets** (optional) | [Cloudflare R2](https://developers.cloudflare.com/r2/) for image uploads; omit to disable uploads |

**R2 storage – dev vs prod (same bucket):** Use one bucket for both. In **local dev** set `R2_KEY_PREFIX=dev/` so keys are `dev/uploads/...`. In **prod** leave `R2_KEY_PREFIX` unset so keys are `uploads/...`. Same credentials, clear separation.

#### How to get R2 tokens (Option 1 – one bucket)

1. **Log in to Cloudflare** → [dash.cloudflare.com](https://dash.cloudflare.com).
2. **Create an R2 bucket**
   - Left sidebar: **R2 Object Storage** → **Overview** → **Create bucket**.
   - Name it (e.g. `suggestion-uploads`) → **Create bucket**.
   - **R2_BUCKET_NAME** = this name.
3. **Get your Account ID**
   - In the right sidebar on any R2 page, or **Overview** → **Account ID**.
   - **R2_ACCOUNT_ID** = this value (hex string).
4. **Enable public access** (so uploaded images are viewable)
   - Open your bucket → **Settings** → **Public access** → **Allow Access**.
   - Note the **R2.dev subdomain** (e.g. `https://pub-xxxxxxxxxxxx.r2.dev`).  
   - **R2_PUBLIC_URL** = that URL (no trailing slash).
5. **Create an API token**
   - Left sidebar: **R2** → **Manage R2 API Tokens** (or **Overview** → **Manage R2 API Tokens**).
   - **Create API token** → name it (e.g. `suggestion-app`).
   - **Permissions:** Object Read & Write (or **Edit** for that bucket).
   - **Specify bucket** (optional): restrict to your bucket for safety.
   - **Create API Token**.
   - Copy **Access Key ID** → **R2_ACCESS_KEY_ID**.
   - Copy **Secret Access Key** → **R2_SECRET_ACCESS_KEY** (shown once; save it).
6. **Set env**
   - Local dev: in `backend/.env` set all five + `R2_KEY_PREFIX=dev/`.
   - Prod: `fly secrets set R2_ACCOUNT_ID="..." R2_ACCESS_KEY_ID="..." R2_SECRET_ACCESS_KEY="..." R2_BUCKET_NAME="..." R2_PUBLIC_URL="https://pub-xxxx.r2.dev" -a suggestion` (do **not** set `R2_KEY_PREFIX` in prod).

### Local and Docker

**Local:** Copy `.env.example` to `.env` and edit:

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with real values (or leave defaults for dev)
```

**Docker Compose:** The `api` service loads env from `backend/.env` via `env_file`. Create it from the example so the API has `JWT_SECRET`, `MONGODB_URI`, and optional R2 vars:

```bash
cp backend/.env.example backend/.env
# Edit backend/.env, then: docker compose up --build
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
# Optional: R2 for image uploads (do not set R2_KEY_PREFIX in prod so keys are uploads/...)
# fly secrets set R2_ACCOUNT_ID="..." R2_ACCESS_KEY_ID="..." R2_SECRET_ACCESS_KEY="..." R2_BUCKET_NAME="..." R2_PUBLIC_URL="https://pub-xxxx.r2.dev" -a suggestion
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
