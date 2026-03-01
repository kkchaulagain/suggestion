#!/usr/bin/env bash
# Simulate CI pipeline locally (backend + frontend tests with coverage, then diff-cover).
# Usage: ./scripts/run-ci-local.sh [backend|frontend|all]
# Base branch for diff: origin/main (fetch first if needed).
# Threshold: set DIFF_COVERAGE_THRESHOLD (default 80).

set -e
BASE_BRANCH="${GITHUB_BASE_REF:-main}"
DIFF_COVERAGE_THRESHOLD="${DIFF_COVERAGE_THRESHOLD:-80}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

run_backend() {
  echo "========== Backend: install, test with coverage =========="
  (cd backend && npm ci && npm test -- --ci --coverage)
  echo ""
  echo "========== Backend: diff coverage (min ${DIFF_COVERAGE_THRESHOLD}%) =========="
  git fetch origin "$BASE_BRANCH" 2>/dev/null || true
  if git diff --name-only "origin/$BASE_BRANCH" -- backend/ | grep -q .; then
    git diff "origin/$BASE_BRANCH" -- backend/ > backend/diff.txt
    diff-cover backend/coverage/cobertura.xml --diff-file=backend/diff.txt --fail-under="$DIFF_COVERAGE_THRESHOLD"
  else
    echo "No backend files changed, skipping diff coverage check."
  fi
}

run_frontend() {
  echo "========== Frontend: install, test with coverage =========="
  (cd frontend/suggestion && npm ci && npm test -- --ci --coverage)
  echo ""
  echo "========== Frontend: diff coverage (min ${DIFF_COVERAGE_THRESHOLD}%) =========="
  git fetch origin "$BASE_BRANCH" 2>/dev/null || true
  if git diff --name-only "origin/$BASE_BRANCH" -- frontend/suggestion/ | grep -q .; then
    git diff "origin/$BASE_BRANCH" -- frontend/suggestion/ > frontend/suggestion/diff.txt
    diff-cover frontend/suggestion/coverage/cobertura.xml --diff-file=frontend/suggestion/diff.txt --fail-under="$DIFF_COVERAGE_THRESHOLD"
  else
    echo "No frontend files changed, skipping diff coverage check."
  fi
}

# Ensure diff-cover is available (use project venv if present)
if [ -d "$REPO_ROOT/.venv-ci" ]; then
  export PATH="$REPO_ROOT/.venv-ci/bin:$PATH"
fi
if ! command -v diff-cover &>/dev/null; then
  echo "Installing diff-cover in .venv-ci..."
  (cd "$REPO_ROOT" && python3 -m venv .venv-ci && .venv-ci/bin/pip install -q diff-cover)
  export PATH="$REPO_ROOT/.venv-ci/bin:$PATH"
fi

case "${1:-all}" in
  backend)  run_backend ;;
  frontend) run_frontend ;;
  all)      run_backend; echo ""; run_frontend ;;
  *)        echo "Usage: $0 [backend|frontend|all]"; exit 1 ;;
esac

echo ""
echo "========== CI simulation finished =========="
