#!/usr/bin/env bash
#
# dev.sh — start the local development environment for web-app
#
# Starts the Express backend (nodemon) and the Vite frontend dev server,
# prints the active configuration, and streams both logs to this terminal
# with color-coded prefixes:  [backend] in yellow, [frontend] in cyan.
#
# Usage:  ./dev.sh
# Stop:   Ctrl+C (kills both processes)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# ── Colors ────────────────────────────────────────────────────────────────
if [ -t 1 ]; then
  YELLOW=$'\033[1;33m'; CYAN=$'\033[1;36m'; GREEN=$'\033[1;32m'
  RED=$'\033[1;31m'; BOLD=$'\033[1m'; DIM=$'\033[2m'; RESET=$'\033[0m'
else
  YELLOW=''; CYAN=''; GREEN=''; RED=''; BOLD=''; DIM=''; RESET=''
fi

info()  { printf '%s\n' "${GREEN}==>${RESET} ${BOLD}$*${RESET}"; }
die()   { printf '%s\n' "${RED}error:${RESET} $*" >&2; exit 1; }

# ── Preflight checks ──────────────────────────────────────────────────────
command -v node >/dev/null 2>&1 || die "node is not installed (need Node 18+)"
command -v yarn >/dev/null 2>&1 || die "yarn is not installed"

# Create .env files from examples if missing
for dir in "$BACKEND_DIR" "$FRONTEND_DIR"; do
  if [ ! -f "$dir/.env" ] && [ -f "$dir/.env.example" ]; then
    cp "$dir/.env.example" "$dir/.env"
    info "Created $(basename "$dir")/.env from .env.example"
  fi
done

# Install workspace dependencies if needed
if [ ! -d "$ROOT_DIR/node_modules" ]; then
  info "Installing dependencies (yarn install)..."
  (cd "$ROOT_DIR" && yarn install)
fi

# ── Read config from .env files ───────────────────────────────────────────
env_val() {  # env_val <file> <key> <default>
  local v
  v=$(grep -E "^${2}=" "$1" 2>/dev/null | tail -n1 | cut -d= -f2- | tr -d '"' || true)
  printf '%s' "${v:-$3}"
}

BACKEND_PORT=$(env_val "$BACKEND_DIR/.env" PORT 3080)
NODE_ENV=$(env_val "$BACKEND_DIR/.env" NODE_ENV development)
PHOTOS_DIR=$(env_val "$BACKEND_DIR/.env" PHOTOS_DIR "frontend/public/images/photos (default)")
API_URL=$(env_val "$FRONTEND_DIR/.env" VITE_API_URL "http://localhost:${BACKEND_PORT}/api")
MOCK_API=$(env_val "$FRONTEND_DIR/.env" VITE_USE_MOCK_API false)
FRONTEND_PORT=3000   # set in frontend/vite.config.js

# ── Print configuration summary ───────────────────────────────────────────
printf '\n%s\n' "${BOLD}charno.net — local development${RESET}"
printf '%s\n' "${DIM}────────────────────────────────────────────────────${RESET}"
printf '  %-18s %s\n' "Backend:"       "${YELLOW}http://localhost:${BACKEND_PORT}${RESET}  (Express + nodemon)"
printf '  %-18s %s\n' "Frontend:"      "${CYAN}http://localhost:${FRONTEND_PORT}${RESET}  (Vite + React)"
printf '  %-18s %s\n' "API URL:"       "$API_URL"
printf '  %-18s %s\n' "NODE_ENV:"      "$NODE_ENV"
printf '  %-18s %s\n' "Mock API:"      "$MOCK_API"
printf '  %-18s %s\n' "Photos dir:"    "$PHOTOS_DIR"
printf '  %-18s %s\n' "Content:"       "backend/content/ (file-based, no DB)"
printf '%s\n' "${DIM}────────────────────────────────────────────────────${RESET}"
printf '  %s\n\n' "${DIM}Ctrl+C stops both services${RESET}"

# ── Start services with prefixed, color-coded logs ────────────────────────
prefix() {  # prefix <color> <label>
  awk -v p="$1[$2]$RESET " '{ print p $0; fflush() }'
}

cleanup() {
  trap - INT TERM EXIT
  info "Shutting down..."
  # Kill everything in this script's process group
  kill 0 2>/dev/null
  wait 2>/dev/null
}
trap cleanup INT TERM EXIT

( cd "$BACKEND_DIR"  && exec yarn dev 2>&1 ) | prefix "$YELLOW" "backend"  &
( cd "$FRONTEND_DIR" && exec yarn dev 2>&1 ) | prefix "$CYAN"   "frontend" &

wait
