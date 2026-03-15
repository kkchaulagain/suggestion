# Central logger design (backend)

## Goals

1. **Single entry point** – All backend code logs via one module (`logger`), not `console.*`.
2. **Environment-aware** – No-op or minimal output in test; full logging in dev/production.
3. **Pluggable in production** – Same API, but in production we can send logs to a cloud service (search, alerts, dashboards).

## API (central interface)

Use a small, consistent API everywhere:

| Method    | When to use |
|-----------|-------------|
| `logger.error(msg, err?)` | Unhandled/reportable errors (DB, auth, R2, etc.) |
| `logger.warn(msg, meta?)`  | Recoverable or noteworthy (e.g. validation, deprecation) |
| `logger.info(msg, meta?)` | Important events (server start, cron, key actions) |
| `logger.debug(msg, meta?)`| Dev-only detail (optional; can no-op in production) |

Call sites stay the same; only the implementation (transport) changes per environment.

## Transport abstraction

The logger delegates to a **transport**:

- **Test** – No-op transport (or in-memory array if tests need to assert on logs).
- **Development** – Console transport (e.g. `console.error`, `console.warn`).
- **Production** – Console **or** a cloud transport (see below).

We switch transport via `NODE_ENV` and **`LOG_TRANSPORT`**:

- **Test** – `NODE_ENV=test` → no-op (always).
- **Dev/production** – `LOG_TRANSPORT=console` (default) or `LOG_TRANSPORT=json`.

## Cloud options for production

Same app code; only the transport implementation changes.

| Option | Notes |
|--------|--------|
| **Structured JSON + stdout** | Log JSON lines to stdout; host (Fly, Railway, etc.) or a sidecar forwards to their log aggregator. No extra SDK; works with any provider. |
| **Pino + pino-cloudwatch** | Fast JSON logger; CloudWatch transport for AWS. |
| **Winston** | Popular; transports for CloudWatch, Datadog, etc. Heavier than Pino. |
| **Axiom / Better Stack / Datadog** | Hosted log services; use their SDK or an HTTP transport. Good for search and alerts. |

**Implemented:** `LOG_TRANSPORT=json` uses **JSON to stdout/stderr** (one JSON line per log). Errors are serialized (`name`, `message`, `stack`, optional `code`). Your host (Fly, Railway, Render, etc.) can capture stdout/stderr and forward to its log aggregator or a third-party service. No extra SDK required.

## Env and transport selection

| `NODE_ENV` | `LOG_TRANSPORT` | Transport |
|------------|-----------------|-----------|
| `test`     | (ignored)        | No-op     |
| any        | `json`          | JSON lines to stdout (info/debug) and stderr (warn/error) |
| any        | `console` or unset | Console (default) |

**JSON line format** (when `LOG_TRANSPORT=json`):

```json
{"level":"error","message":"List users error:","timestamp":"2025-03-15T12:00:00.000Z","err":{"name":"Error","message":"DB error","stack":"..."}}
```

## Migration

1. Introduce the central `logger` with current behavior (no-op in test, console in dev/prod).
2. Replace any remaining `console.error` / `console.warn` in the backend with `logger.error` / `logger.warn`.
3. When ready, add a production transport (e.g. JSON stdout or a cloud SDK) and switch via env.

No changes to existing `logger.error(...)` call sites when you add a cloud transport.

---

## Next steps (optional: direct cloud provider)

To send logs directly to a provider (Axiom, Datadog, etc.): add a new transport that implements `Transport`, call the provider’s API or SDK with the same JSON shape (level, message, timestamp, err), and in `logger.ts` select it when e.g. `LOG_TRANSPORT=axiom`. The existing JSON transport already produces a shape most aggregators accept; many hosts can ingest stdout without a custom transport.
