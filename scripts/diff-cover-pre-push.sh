#!/usr/bin/env bash
# Run diff-cover for backend and frontend (used by pre-push hook).
# Expects: coverage already generated (npm run check:coverage), and diff-cover installed.
# Base ref: origin/main. Set DIFF_COVERAGE_THRESHOLD (default 90).
# Requires: pip install diff-cover (or use .venv-ci from scripts/run-ci-local.sh).

set -e
BASE_REF="${DIFF_COVER_BASE_REF:-origin/main}"
THRESHOLD="${DIFF_COVERAGE_THRESHOLD:-90}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [ -d "$REPO_ROOT/.venv-ci" ]; then
  export PATH="$REPO_ROOT/.venv-ci/bin:$PATH"
fi
if ! command -v diff-cover &>/dev/null; then
  echo "diff-cover not found. Install with: pip install diff-cover (or run ./scripts/run-ci-local.sh once to create .venv-ci)"
  exit 1
fi

echo "Fetching $BASE_REF for diff..."
git fetch origin main 2>/dev/null || true

echo ""
echo "========== Backend: diff coverage (min ${THRESHOLD}%) =========="
if git diff --name-only "$BASE_REF" -- backend/ | grep -q .; then
  git diff "$BASE_REF" -- backend/ > backend/diff.txt
  diff-cover backend/coverage/cobertura.xml --diff-file=backend/diff.txt --fail-under="$THRESHOLD"
else
  echo "No backend files changed, skipping."
fi

echo ""
echo "========== Frontend: diff coverage (min ${THRESHOLD}%) =========="
if git diff --name-only "$BASE_REF" -- frontend/suggestion/ | grep -q .; then
  git diff "$BASE_REF" -- frontend/suggestion/ > frontend/suggestion/diff.txt
  diff-cover frontend/suggestion/coverage/cobertura.xml --diff-file=frontend/suggestion/diff.txt --fail-under="$THRESHOLD"
else
  echo "No frontend files changed, skipping."
fi
