#!/usr/bin/env bash
# Static koolskull.com export. Does NOT copy live media (mp3/art/skins) —
# those already live on the server and stay there. Miyamaker metadata at
# /miyamakermini is never part of this build.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MEDIA_NAMES=(mp3 album-thumbs album-large album-fullscreen webampskins art)
STASH=".build-media-stash"
rm -rf "$STASH"
mkdir -p "$STASH"

stashed=()
for name in "${MEDIA_NAMES[@]}"; do
  if [ -e "public/$name" ] || [ -L "public/$name" ]; then
    mv "public/$name" "$STASH/$name"
    stashed+=("$name")
  fi
done

restore_media() {
  for name in "${stashed[@]+"${stashed[@]}"}"; do
    rm -rf "public/$name"
    if [ -e "$STASH/$name" ] || [ -L "$STASH/$name" ]; then
      mv "$STASH/$name" "public/$name"
    fi
  done
  rm -rf "$STASH"
}
trap restore_media EXIT

if [ -f deploy/.env.koolskull ]; then
  # shellcheck disable=SC1091
  set -a
  source deploy/.env.koolskull
  set +a
fi

export NEXT_PUBLIC_BASE_PATH="${NEXT_PUBLIC_BASE_PATH:-}"
export NEXT_PUBLIC_BRAND="${NEXT_PUBLIC_BRAND:-koolskull}"
export NEXT_PUBLIC_MEDIA_ORIGIN="${NEXT_PUBLIC_MEDIA_ORIGIN:-https://koolskull.com}"
export NEXT_PUBLIC_ETH_RPC_URL="${NEXT_PUBLIC_ETH_RPC_URL:-}"
export NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="${NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID:-}"
export NEXT_PUBLIC_HAS_ACCOUNT="${NEXT_PUBLIC_HAS_ACCOUNT:-true}"

echo "==> Static export brand=${NEXT_PUBLIC_BRAND} media=${NEXT_PUBLIC_MEDIA_ORIGIN}"
./scripts/build-static.sh

for name in "${MEDIA_NAMES[@]}"; do
  rm -rf "out/$name"
done

mkdir -p out/api
cp deploy/koolskull-php/_lib.php \
   deploy/koolskull-php/scatter-collection.php \
   deploy/koolskull-php/scatter-mint.php \
   deploy/koolskull-php/miyamaker-status.php \
   deploy/koolskull-php/miyamaker-owned.php \
   deploy/koolskull-php/proxy.php \
   deploy/koolskull-php/.htaccess \
   out/api/
# Never copy secrets.php or examples into the web tree.

# Never clobber WordPress / cPanel rewrite at the domain root.
rm -f out/.htaccess

echo "==> out/ ready (media dirs stripped, PHP shims in out/api/)"
