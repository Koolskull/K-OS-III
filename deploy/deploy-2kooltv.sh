#!/usr/bin/env bash
# Build the 2kool.tv static export and mirror it up to DreamHost over SFTP
# (plain FTP is rejected by this account — DreamHost has it SFTP-only).
# Reads credentials from deploy/.env.ftp (gitignored, never committed) —
# see deploy/.env.ftp.example. Run from the repo root:
#   ./deploy/deploy-2kooltv.sh          # real upload
#   ./deploy/deploy-2kooltv.sh --dry-run  # preview only, uploads nothing
#
# Deliberately NEVER deletes: FTP_REMOTE_DIR (2kool.tv/) already has real,
# unrelated content on the server (samplepacks/, media/, agents.txt,
# robots.txt, existing favicons) that this build doesn't produce — a
# delete-mirror would wipe all of that. This only adds/overwrites files
# this build actually produces.
set -euo pipefail

cd "$(dirname "$0")/.."

DRY_RUN=""
if [ "${1:-}" = "--dry-run" ]; then
  DRY_RUN="--dry-run"
fi

ENV_FILE="deploy/.env.ftp"
if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE — copy deploy/.env.ftp.example to $ENV_FILE and fill it in first." >&2
  exit 1
fi
# shellcheck disable=SC1090
source "$ENV_FILE"

for var in FTP_HOST FTP_USER FTP_PASSWORD FTP_REMOTE_DIR; do
  if [ -z "${!var:-}" ]; then
    echo "$var is not set in $ENV_FILE" >&2
    exit 1
  fi
done

echo "==> Building static export (2KOOL.TV, root path)..."
npm run build:2kooltv

echo "==> Mirroring out/ to ${FTP_HOST}:${FTP_REMOTE_DIR} (SFTP, no delete)${DRY_RUN:+ [DRY RUN]}..."
lftp -u "$FTP_USER,$FTP_PASSWORD" "sftp://$FTP_HOST" <<EOF
set net:timeout 15
set sftp:auto-confirm yes
mirror -R --verbose $DRY_RUN out "$FTP_REMOTE_DIR"
bye
EOF

echo "==> Done. Check https://2kool.tv/"
