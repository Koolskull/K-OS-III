#!/usr/bin/env bash
# Upload the Stardrain shell over the stardrain.app document root.
# Root index.html is replaced on purpose. NEVER deletes.
# Does not upload into /mialien/ or any other metadata folder.
#
# Login is the cPanel FTP account "stardrain" on s103.etcserver.com.
# Password: macOS Keychain internet password for that account, or
# deploy/.env.ftp.stardrain (gitignored). Do not use the koolskull.com login.
# That account's public_html/stardrain is a different, older page.
#
#   ./deploy/deploy-stardrain.sh
#   ./deploy/deploy-stardrain.sh --dry-run
#   ./deploy/deploy-stardrain.sh --skip-build
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

ENV_FILE="deploy/.env.ftp.stardrain"
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
else
  FTP_HOST="${FTP_HOST:-s103.etcserver.com}"
  FTP_USER="${FTP_USER:-stardrain}"
  FTP_PROTOCOL="${FTP_PROTOCOL:-ftp}"
  FTP_PASSWORD="$(security find-internet-password -s "$FTP_HOST" -a "$FTP_USER" -w)"
fi

for var in FTP_HOST FTP_USER FTP_PASSWORD; do
  if [ -z "${!var:-}" ]; then
    echo "$var is empty. Add deploy/.env.ftp.stardrain or a Keychain FTP password for account stardrain." >&2
    exit 1
  fi
done

if [ "$FTP_USER" = "koolskull" ]; then
  echo "Refusing the koolskull.com FTP login. stardrain.app is a different account." >&2
  exit 1
fi

PROTOCOL="${FTP_PROTOCOL:-ftp}"
case "$PROTOCOL" in
  sftp) URL="sftp://${FTP_HOST}" ;;
  ftps|ftp) URL="ftp://${FTP_HOST}" ;;
  *) echo "FTP_PROTOCOL must be ftp, ftps, or sftp (got $PROTOCOL)" >&2; exit 1 ;;
esac

if [ -n "$SKIP_BUILD" ]; then
  if [ ! -f public/stardrain/catalog.xml ] || [ ! -f site/stardrain-www/index.html ] || [ ! -f site/stardrain-www/assets/pixi.min.mjs ]; then
    echo "Shell or catalog is missing. Omit --skip-build." >&2
    exit 1
  fi
else
  echo "==> Building Stardrain art, catalog, field manual, and root shell..."
  python3 scripts/build-stardrain-art.py
  node scripts/build-stardrain-catalog.mjs
  node scripts/build-stardrain-www.mjs
fi

if [ -d site/stardrain-www/mialien ] || [ -d site/stardrain-www/metadata ]; then
  echo "Refusing to upload a tree that contains mialien or metadata." >&2
  exit 1
fi

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

# shellcheck disable=SC2086
remote_exec() {
  lftp -u "$FTP_USER,$FTP_PASSWORD" "$URL" <<EOF
set net:timeout 25
set cmd:fail-exit yes
set sftp:auto-confirm yes
$LFTP_SSL
$PORT_LINE
$1
bye
EOF
}

echo "==> Checking the stardrain.app document root..."
LIST="$(remote_exec "cls -1")"
# cls prints public_html/mialien/ and sometimes a trailing CR. Match the last path part.
names_of() {
  printf '%s\n' "$1" | tr -d '\r' | sed -e 's/[[:space:]]*$//' -e 's|/$||' -e 's|.*/||' | sed '/^$/d'
}
has_name() {
  names_of "$LIST" | grep -qx "$1"
}

if has_name "public_html"; then
  DOCROOT="public_html"
  LIST="$(remote_exec "cls -1 public_html")"
else
  DOCROOT="."
fi

if ! names_of "$LIST" | grep -qx "mialien"; then
  echo "Refusing upload. This login has no mialien directory, so it is not the stardrain.app document root." >&2
  exit 1
fi

if [ "$DOCROOT" = "public_html" ]; then
  ROOT_TARGET="public_html"
  MANUAL_TARGET="public_html/stardrain"
else
  ROOT_TARGET="."
  MANUAL_TARGET="stardrain"
fi

echo "==> Replacing the root shell at ${FTP_HOST}:${ROOT_TARGET} (no delete)${DRY_RUN:+ [DRY RUN]}"
echo "    Root index.html is overwritten. /mialien stays."
remote_exec "mirror -R --verbose --transfer-all --ignore-time --exclude-glob .DS_Store --exclude-glob README.md $DRY_RUN site/stardrain-www \"$ROOT_TARGET\""

echo "==> Uploading the field manual to ${MANUAL_TARGET} (no delete)${DRY_RUN:+ [DRY RUN]}"
remote_exec "mirror -R --verbose --transfer-all --ignore-time --exclude-glob .DS_Store $DRY_RUN public/stardrain \"$MANUAL_TARGET\""

echo "==> Done. Shell: https://stardrain.app/"
echo "    Field manual: https://stardrain.app/stardrain/"
echo "    Catalog: https://stardrain.app/stardrain/catalog.xml"
