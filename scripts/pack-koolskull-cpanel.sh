#!/usr/bin/env bash
# Pack the koolskull static export into two zip files for cPanel.
# FTP of 30k tiny TFM files is unusable; two zips extract on the server in seconds.
#
#   npm run pack:koolskull
#   ./scripts/pack-koolskull-cpanel.sh --os-only   # skip instruments zip
#
# Writes:
#   dist/koolskull-os.zip            OS, mint pages, fonts, PHP shims — no Instruments
#   dist/koolskull-instruments.zip   tracker Instruments/ (TFM + samples + GenMDM)
#   dist/unzip-koolskull.php         optional one-hit extractor for public_html
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f out/index.html ]; then
  echo "out/index.html missing — run npm run build:koolskull first." >&2
  exit 1
fi

OS_ONLY=""
for arg in "$@"; do
  case "$arg" in
    --os-only) OS_ONLY="1" ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

mkdir -p dist
rm -f dist/koolskull-os.zip
if [ -z "$OS_ONLY" ]; then
  rm -f dist/koolskull-instruments.zip
fi

cp deploy/koolskull-root.htaccess out/.htaccess
cp deploy/koolskull-root.htaccess dist/htaccess-upload-to-public-html.txt

echo "==> Zipping OS (no Instruments)…"
(
  cd out
  zip -r -q ../dist/koolskull-os.zip . \
    -x "Instruments/*" \
    -x "Instruments/**" \
    -x "*.DS_Store"
)

if [ -z "$OS_ONLY" ]; then
  if [ -d out/Instruments ]; then
    echo "==> Zipping Instruments…"
    (
      cd out
      zip -r -q ../dist/koolskull-instruments.zip Instruments -x "*.DS_Store"
    )
  else
    echo "==> No out/Instruments — skipping instruments zip"
  fi
fi

cp deploy/koolskull-php/unzip-koolskull.php dist/unzip-koolskull.php

echo "==> Ready:"
ls -lh dist/koolskull-os.zip dist/unzip-koolskull.php dist/htaccess-upload-to-public-html.txt
if [ -f dist/koolskull-instruments.zip ]; then ls -lh dist/koolskull-instruments.zip; fi
echo
echo "cPanel: File Manager → public_html → Upload both zips → Extract each there → delete the zips."
echo "If File Manager rejects the big zip, FTP only these 2–3 files (fast), then Extract."
echo "Or FTP the zips + unzip-koolskull.php and open https://koolskull.com/unzip-koolskull.php once."
