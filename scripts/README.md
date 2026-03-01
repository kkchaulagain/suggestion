# Scripts

## Run CI pipeline locally (`run-ci-local.sh`)

Simulates the GitHub Actions CI: runs tests with coverage for backend and/or frontend, then runs **diff-cover** so that **diff coverage must meet the threshold** (default **80%**) for changed files.

### Prerequisites

- **Node.js 20** and `npm`
- **Python 3** (for `diff-cover`). The script will create `.venv-ci` and install `diff-cover` if needed.
- **Git** working (e.g. if on macOS, complete Xcode license: `sudo xcodebuild -license` so `git` and `diff-cover` can run).

### Usage

```bash
# Run full simulation (backend + frontend)
./scripts/run-ci-local.sh

# Backend only
./scripts/run-ci-local.sh backend

# Frontend only
./scripts/run-ci-local.sh frontend

# Override threshold (default 80)
DIFF_COVERAGE_THRESHOLD=70 ./scripts/run-ci-local.sh backend
```

- **Threshold**: In CI, set the repo secret `DIFF_COVERAGE_THRESHOLD` (e.g. `70` or `80`) to override; default is **80%**. Locally, use the `DIFF_COVERAGE_THRESHOLD` env var.
- **Backend** tests use MongoDB (e.g. in-memory). Ensure you can run them locally (or rely on CI for backend).
- **Diff base branch**: uses `origin/main` by default, or `GITHUB_BASE_REF` if set (e.g. in CI).
- If there are no changes in backend or frontend, the diff-coverage step is skipped for that part.

### Alternative: run the real workflow with Act

If you have [Docker](https://docker.com) and [act](https://github.com/nektos/act) installed:

```bash
# List workflows
act -l

# Run the CI workflow (pull_request)
act pull_request
```

This runs the same jobs as on GitHub (backend-test, frontend-test, diff coverage) in local containers.
