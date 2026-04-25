#!/usr/bin/env bash
set -euo pipefail

# Deploy script for Hostinger managed Node.js hosting
# Builds everything locally, assembles a deploy/ directory, and pushes to the deploy branch.
#
# Usage: ./scripts/deploy.sh

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/deploy"

echo "==> Building all packages..."
cd "$ROOT_DIR"
pnpm build

echo "==> Assembling deploy directory..."
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Maintain the monorepo directory structure so the server's path resolution
# (path.resolve(__dirname, "../../..")) still works unchanged.

# 1. Server compiled output
mkdir -p "$DEPLOY_DIR/apps/server"
cp -r "$ROOT_DIR/apps/server/dist" "$DEPLOY_DIR/apps/server/dist"

# 2. Web built assets
mkdir -p "$DEPLOY_DIR/apps/web"
cp -r "$ROOT_DIR/apps/web/dist" "$DEPLOY_DIR/apps/web/dist"

# 3. Workspace packages (compiled, with their package.json for file: resolution)
mkdir -p "$DEPLOY_DIR/packages/contracts"
cp "$ROOT_DIR/packages/contracts/package.json" "$DEPLOY_DIR/packages/contracts/"
cp -r "$ROOT_DIR/packages/contracts/dist" "$DEPLOY_DIR/packages/contracts/dist"

mkdir -p "$DEPLOY_DIR/packages/domain"
cp "$ROOT_DIR/packages/domain/package.json" "$DEPLOY_DIR/packages/domain/"
cp -r "$ROOT_DIR/packages/domain/dist" "$DEPLOY_DIR/packages/domain/dist"

# 4. Root production package.json (flat deps, file: refs for workspace packages)
cp "$ROOT_DIR/scripts/deploy-package.json" "$DEPLOY_DIR/package.json"

# 5. Startup script
cp "$ROOT_DIR/scripts/start.sh" "$DEPLOY_DIR/start.sh"

# 6. .gitignore for the deploy branch
cat > "$DEPLOY_DIR/.gitignore" << 'GITIGNORE'
node_modules
apps/server/data
.DS_Store
GITIGNORE

# 7. Ensure data directory placeholder exists
mkdir -p "$DEPLOY_DIR/apps/server/data"
touch "$DEPLOY_DIR/apps/server/data/.gitkeep"

echo "==> Deploy directory ready at: $DEPLOY_DIR"
echo ""
echo "To push to the deploy branch:"
echo "  cd deploy"
echo "  git init && git checkout -b deploy"
echo "  git add -A && git commit -m 'deploy'"
echo "  git remote add origin <your-repo-url>"
echo "  git push -u origin deploy --force"
echo ""
echo "Or use: ./scripts/push-deploy.sh"
