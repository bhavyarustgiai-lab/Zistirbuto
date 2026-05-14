#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/apps/backend"
FRONTEND_FILTER="@zistributo/frontend"
GO_CACHE_DIR="$ROOT_DIR/.cache/go-build"

mkdir -p "$GO_CACHE_DIR"

cd "$BACKEND_DIR"
docker compose up -d

if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  source "$ROOT_DIR/.env"
  set +a
fi

if [[ -f "$BACKEND_DIR/.env" ]]; then
  set -a
  source "$BACKEND_DIR/.env"
  set +a
fi

cd "$ROOT_DIR"

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "${FRONTEND_PID:-}" ]]; then
    kill "$FRONTEND_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

if lsof -iTCP:8080 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Backend already running on :8080, reusing existing process."
else
  (
    cd "$BACKEND_DIR"
    env GOCACHE="$GO_CACHE_DIR" go run ./cmd/server
  ) &
  BACKEND_PID=$!
fi

pnpm --filter "$FRONTEND_FILTER" dev &
FRONTEND_PID=$!

while true; do
  if [[ -n "${BACKEND_PID:-}" ]] && ! kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    wait "$BACKEND_PID" || true
    break
  fi
  if ! kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
    wait "$FRONTEND_PID" || true
    break
  fi
  sleep 1
done
