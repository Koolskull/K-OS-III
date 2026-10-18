#!/usr/bin/env bash
# Upload the koolskull.com OS next to existing server files.
# NEVER deletes. Leaves /mp3 /art /store /biz /miyamakermini /gallery
# WordPress and the rest of public_html alone.
#
# Credentials: copy deploy/.env.ftp.koolskull.example → deploy/.env.ftp.koolskull
# Do NOT use deploy/.env.ftp (that file is DreamHost 2kool.tv).
#
#   ./deploy/deploy-koolskull.sh
#   ./deploy/deploy-koolskull.sh --dry-run
#   ./deploy/deploy-koolskull.sh --skip-build   # upload existing out/
set -euo pipefail

cd "$(dirname "$0")/.."

DRY_RUN=""
SKIP_BUILD=""
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN="--dry-run" ;;
    --skip-build) SKIP_BUILD="1" ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

ENV_FILE="deploy/.env.ftp.koolskull"
if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE — copy deploy/.env.ftp.koolskull.example and fill host/user/password." >&2
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

PROTOCOL="${FTP_PROTOCOL:-ftp}"
case "$PROTOCOL" in
  sftp) URL="sftp://${FTP_HOST}" ;;
  ftps|ftp) URL="ftp://${FTP_HOST}" ;;
  *) echo "FTP_PROTOCOL must be ftp, ftps, or sftp (got $PROTOCOL)" >&2; exit 1 ;;
esac

if [ -n "$SKIP_BUILD" ]; then
  if [ ! -f out/index.html ]; then
    echo "out/index.html missing — run npm run build:koolskull first, or omit --skip-build." >&2
    exit 1
  fi
  echo "==> Skipping rebuild, uploading existing out/"
else
  echo "==> Building koolskull static export..."
  npm run build:koolskull
fi

echo "==> Mirroring out/ to ${FTP_HOST}:${FTP_REMOTE_DIR} (${PROTOCOL}, no delete)${DRY_RUN:+ [DRY RUN]}..."
echo "    Existing /mp3 /art /store /biz /miyamakermini /gallery stay on the server."

LFTP_SSL=""
if [ "$PROTOCOL" = "ftps" ]; then
  LFTP_SSL="set ftp:ssl-force true
set ftp:ssl-protect-data true
set ssl:verify-certificate no"
elif [ "$PROTOCOL" = "ftp" ]; then
  LFTP_SSL="set ftp:ssl-allow yes
set ssl:verify-certificate no"
fi

PORT_LINE=""
if [ -n "${FTP_PORT:-}" ]; then
  PORT_LINE="set ftp:port ${FTP_PORT}"
fi

lftp -u "$FTP_USER,$FTP_PASSWORD" "$URL" <<EOF
set net:timeout 20
set sftp:auto-confirm yes
$LFTP_SSL
$PORT_LINE
mirror -R --verbose --transfer-all --ignore-time --exclude-glob .DS_Store --exclude Instruments/ --exclude-glob secrets.php $DRY_RUN out "$FTP_REMOTE_DIR"
bye
EOF

echo "==> Done. Check https://koolskull.com/  (Miyamaker metadata still at /miyamakermini/)"
