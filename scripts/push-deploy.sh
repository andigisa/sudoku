#!/usr/bin/env bash
set -euo pipefail

# Pushes the deploy/ directory to the 'deploy' branch on origin.
# The deploy branch is an orphan — it only contains production artifacts.
#
# Usage: ./scripts/push-deploy.sh

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/deploy"
REMOTE_URL=$(git -C "$ROOT_DIR" remote get-url origin)

if [ ! -d "$DEPLOY_DIR" ]; then
  echo "Error: deploy/ directory not found. Run ./scripts/deploy.sh first."
  exit 1
fi

echo "==> Pushing deploy/ to branch 'deploy' on $REMOTE_URL"

cd "$DEPLOY_DIR"

# Initialize a throwaway git repo in deploy/ (or reuse existing)
if [ ! -d ".git" ]; then
  git init
  git checkout -b deploy
  git remote add origin "$REMOTE_URL"
fi

git add -A
git commit -m "deploy $(date -u +%Y-%m-%dT%H:%M:%SZ)" --allow-empty
git push origin deploy --force

echo "==> Done. Branch 'deploy' updated on origin."
