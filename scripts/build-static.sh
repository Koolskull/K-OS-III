#!/usr/bin/env bash
# Static export (K_OS_EXPORT=true) can't coexist with the server-only API
# routes added for accounts/PRODEV/etc — `next build` with `output: export`
# hard-fails the moment it sees a route handler that isn't statically
# exportable (auth, Postgres, cookies — none of which can be). Since the
# static build (GitHub Pages, or an FTP-only host like this project's
# DreamHost 2kool.tv deploy) never needs those routes at all — no server to
# run them on — temporarily move src/app/api (and any other DB-backed
# dynamic routes, e.g. src/app/render) OUT OF src/app entirely for the
# duration of the static build, then always restore them, even on failure.
#
# Backups must land outside src/app — Next's app router discovers routes by
# directory name, so a backup dir merely renamed *within* src/app (e.g.
# src/app/api.bak) is still picked up as a route and the export still fails.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export PATH="$ROOT/node_modules/.bin:$PATH"
if [ ! -x "$ROOT/node_modules/.bin/next" ]; then
  echo "next not found at $ROOT/node_modules/.bin/next — run npm install first." >&2
  exit 1
fi

DYNAMIC_DIRS=("src/app/api" "src/app/render")
BACKUP_ROOT=".build-static-backup"

rm -rf "$BACKUP_ROOT"
mkdir -p "$BACKUP_ROOT"

for dir in "${DYNAMIC_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    mv "$dir" "$BACKUP_ROOT/$(basename "$dir")"
  fi
done

restore() {
  for dir in "${DYNAMIC_DIRS[@]}"; do
    base="$(basename "$dir")"
    if [ -d "$BACKUP_ROOT/$base" ]; then
      rm -rf "$dir"
      mv "$BACKUP_ROOT/$base" "$dir"
    fi
  done
  rm -rf "$BACKUP_ROOT"
}
trap restore EXIT

K_OS_EXPORT=true NEXT_PUBLIC_STATIC_EXPORT=true \
  NEXT_PUBLIC_BASE_PATH="${NEXT_PUBLIC_BASE_PATH:-}" \
  NEXT_PUBLIC_BRAND="${NEXT_PUBLIC_BRAND:-kos3}" \
  NEXT_PUBLIC_MEDIA_ORIGIN="${NEXT_PUBLIC_MEDIA_ORIGIN:-}" \
  NEXT_PUBLIC_ETH_RPC_URL="${NEXT_PUBLIC_ETH_RPC_URL:-}" \
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="${NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID:-}" \
  NEXT_PUBLIC_HAS_ACCOUNT="${NEXT_PUBLIC_HAS_ACCOUNT:-}" \
  next build
