#!/usr/bin/env bash
# Build the 2kool.tv static export and mirror it up to DreamHost over FTP.
# Reads credentials from deploy/.env.ftp (gitignored, never committed) —
# see deploy/.env.ftp.example. Run from the repo root:
#   ./deploy/deploy-2kooltv.sh
set -euo pipefail

cd "$(dirname "$0")/.."

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

echo "==> Mirroring out/ to ${FTP_HOST}:${FTP_REMOTE_DIR} ..."
lftp -u "$FTP_USER,$FTP_PASSWORD" "ftp://$FTP_HOST" <<EOF
set ftp:ssl-allow yes
set ssl:verify-certificate no
mirror -R --delete --verbose out "$FTP_REMOTE_DIR"
bye
EOF

echo "==> Done. Check https://2kool.tv/"
