# Suggestion – Basic Backend

A minimal Node.js + Express API with MongoDB and email/password auth.

## Setup

```bash
npm install
```

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
