#!/usr/bin/env bash
# Static export (K_OS_EXPORT=true) can't coexist with the server-only API
# routes added for accounts/PRODEV/etc — `next build` with `output: export`
# hard-fails the moment it sees a route handler that isn't statically
# exportable (auth, Postgres, cookies — none of which can be). Since the
# static build (GitHub Pages, or an FTP-only host like this project's
# DreamHost 2kool.tv deploy) never needs those routes at all — no server to
# run them on — temporarily move src/app/api out of the tree for the
# duration of the static build, then always restore it, even on failure.
set -euo pipefail

API_DIR="src/app/api"
BACKUP_DIR=".build-static-api-backup"

if [ -d "$API_DIR" ]; then
  rm -rf "$BACKUP_DIR"
  mv "$API_DIR" "$BACKUP_DIR"
fi

restore() {
  if [ -d "$BACKUP_DIR" ]; then
    rm -rf "$API_DIR"
    mv "$BACKUP_DIR" "$API_DIR"
  fi
}
trap restore EXIT

K_OS_EXPORT=true NEXT_PUBLIC_BASE_PATH="${NEXT_PUBLIC_BASE_PATH:-}" next build
