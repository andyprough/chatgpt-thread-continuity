#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
VERSION=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["version"])' "$ROOT/manifest.json")
mkdir -p "$ROOT/dist"
# Package only reviewed extension files, not repository exports, local settings, or git metadata.
(
  cd "$ROOT"
  zip -q "$ROOT/dist/chatgpt-thread-continuity-$VERSION-unsigned.xpi" \
    manifest.json background.js content/exporter-main.js icons/icon-32.svg icons/icon-48.svg icons/icon-96.svg
  zip -q "$ROOT/dist/chatgpt-thread-continuity-$VERSION-source.zip" \
    manifest.json background.js content/exporter-main.js icons/icon-32.svg icons/icon-48.svg icons/icon-96.svg \
    README.md PRIVACY.md CHANGELOG.md PUBLISHING.md TESTING.md .gitignore scripts/package.sh scripts/test-initial-prompt.js scripts/test-compatibility.js
)
printf 'Created version %s unsigned XPI and source ZIP in %s/dist\n' "$VERSION" "$ROOT"
