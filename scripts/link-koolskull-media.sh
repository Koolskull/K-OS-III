#!/usr/bin/env bash
# Symlink live koolskull.com media into K-OS-III/public for local Discography/Webamp.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DUMP="${KOOLSKULL_MEDIA:-$HOME/Documents/Github/koolskull.com-live/public_html}"
cd "$ROOT"
for name in mp3 album-thumbs album-large album-fullscreen webampskins art; do
  if [ ! -d "$DUMP/$name" ]; then
    echo "missing $DUMP/$name" >&2
    exit 1
  fi
  ln -sfn "$DUMP/$name" "public/$name"
  echo "linked public/$name -> $DUMP/$name"
done
