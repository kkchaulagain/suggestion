# Backend API

## Scripts

- **`npm run lint`** – Runs ESLint and TypeScript type-check on production source (`src/`, excluding `__tests__` and `scripts/`). Use this before pushing to catch type and assignability issues in app code.
- **`npm run typecheck`** – Full TypeScript check including test files. Run this (e.g. in CI) to catch type errors in tests too (e.g. mock request/response not assignable to Express types; use `as unknown as Request`-style casts in tests when needed).
- **`npm run typecheck:src`** – Type-check production code only (same as the check run by `lint`).
