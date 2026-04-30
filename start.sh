#!/usr/bin/env bash
# Startup script for Hostinger Node.js hosting
# Set defaults for any env vars not configured in hPanel
export NODE_ENV="${NODE_ENV:-production}"
export PORT="${PORT:-3000}"
export HOST="${HOST:-0.0.0.0}"
export DB_PATH="${DB_PATH:-./apps/server/data/sudoku.db}"

exec node apps/server/dist/index.js
