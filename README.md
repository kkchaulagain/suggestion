# Suggestion – Basic Backend

A minimal Node.js + Express API with MongoDB and email/password auth.

## Setup

```bash
npm install
```

**Env:** See **[docs/ENV.md](docs/ENV.md)** for how to manage env (local `.env` and Fly.io secrets). Quick start: copy `backend/.env.example` → `backend/.env` and optionally `frontend/suggestion/.env.example` → `frontend/suggestion/.env`; defaults work for local dev.

## Run

**With Docker (API + MongoDB):**

```bash
docker compose up --build
```

**Locally (requires MongoDB on port 27017 or set `MONGODB_URI`):**

```bash
npm start
```

Runs at [http://localhost:3000](http://localhost:3000). **API docs (Swagger):** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

Development with auto-reload:

```bash
npm run dev
```

## Tests (TDD)

```bash
npm test
```

Uses in-memory MongoDB by default; set `MONGODB_URI` to use a real DB.

## Endpoints

- `GET /api-docs` – Swagger UI
- `GET /api-docs.json` – OpenAPI spec (JSON)
- `GET /` – Welcome message
- `GET /health` – Health check
- `POST /api/auth/register` – Register with `{ "email": "...", "password": "..." }` (min 6 chars). Returns user (no password) and 201; 400 for validation, 409 if email exists.
- `POST /api/auth/login` – Login with `{ "email": "...", "password": "..." }`. Returns token and 200.
- `POST /api/feedback-forms` – Create feedback form with custom fields:
  - Supported field `type`: `checkbox`, `short_text`, `long_text`, `big_text`, `image_upload`
  - Also accepts field type aliases like `"short text"`, `"long-text"`, `"image upload"` and normalizes them.
- `GET /api/feedback-forms` – List feedback forms
- `GET /api/feedback-forms/:id` – Get one feedback form
- `PUT /api/feedback-forms/:id` – Update an existing feedback form
- `DELETE /api/feedback-forms/:id` – Delete a feedback form
- `POST /api/feedback-forms/:id/qr` – Generate a QR code for the form URL that should open on frontend.
  - Returns:
    - `formUrl`: frontend URL with form id appended
    - `qrCodeDataUrl`: PNG QR image in data URL format
  - Uses `FRONTEND_FORM_BASE_URL` env var when set (example: `https://frontend.example.com/forms`)

## Deploy on Fly.io (backend + frontend)

One app per directory; deploy from **repo root** so you never `cd` into subdirs.

| App     | Directory              | Command                    | URL (example)              |
|---------|------------------------|----------------------------|----------------------------|
| Backend | `backend/`             | `fly deploy ./backend`     | https://suggestion.fly.dev |
| Frontend| `frontend/suggestion/` | `fly deploy ./frontend/suggestion` | https://suggestion-web.fly.dev |

**From root (recommended):**
```bash
npm run deploy:backend    # or: fly deploy ./backend
npm run deploy:frontend    # or: fly deploy ./frontend/suggestion
```

**First-time setup**
- Backend: `fly secrets set MONGODB_URI="..." JWT_SECRET="..." -a suggestion`  
  Optional: `fly secrets set FRONTEND_FORM_BASE_URL="https://suggestion-web.fly.dev/forms" -a suggestion`
- Frontend: create app once with `fly apps create suggestion-web`, then `npm run deploy:frontend`.  
  To use a different API URL: `fly deploy ./frontend/suggestion --build-arg VITE_API_URL=https://your-api.fly.dev`
