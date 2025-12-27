#!/usr/bin/env bash
set -euo pipefail

# Tomorin Player - macOS build script
# Usage: APP_VERSION=1.2.3 scripts/build-macos.sh [-c]
# Requires: macOS host, Xcode toolchain, Wails CLI, Node/pnpm, optional create-dmg

CLEAN=false
if [[ ${1:-} == "-c" ]]; then CLEAN=true; fi

APP_VERSION=${APP_VERSION:-}
if [[ -z "$APP_VERSION" ]]; then
  if [[ -f frontend/package.json ]]; then
    APP_VERSION=$(jq -r .version frontend/package.json)
  else
    echo "APP_VERSION not provided and frontend/package.json missing" >&2
    exit 1
  fi
fi

export APP_VERSION
export VITE_APP_VERSION="$APP_VERSION"

# Ensure wails
WAILS_CMD=${WAILS_CMD:-wails}
if ! command -v "$WAILS_CMD" >/dev/null; then
  if [[ -x "$HOME/go/bin/wails" ]]; then WAILS_CMD="$HOME/go/bin/wails"; else echo "wails not found" >&2; exit 1; fi
fi

ARGS=(build -platform darwin/universal -clean)
$CLEAN || ARGS=(build -platform darwin/universal)

# Temporarily patch wails.json productVersion
BACKUP_WAILS_JSON="wails.json.bak"
cp wails.json "$BACKUP_WAILS_JSON"
jq --arg ver "$APP_VERSION" '.windows.info.productVersion = $ver | .info.productVersion = $ver' wails.json > wails.json.tmp && mv wails.json.tmp wails.json
trap 'mv -f "$BACKUP_WAILS_JSON" wails.json 2>/dev/null || true' EXIT

"$WAILS_CMD" "${ARGS[@]}"

# Optional: create DMG if create-dmg is available
if command -v create-dmg >/dev/null; then
  APP_PATH="build/bin/Tomorin Player.app"
  DMG_PATH="build/bin/Tomorin-Player-${APP_VERSION}.dmg"
  create-dmg \
    --volname "Tomorin Player" \
    --window-pos 200 120 \
    --window-size 800 400 \
    --icon-size 100 \
    --icon "Tomorin Player.app" 200 190 \
    --hide-extension "Tomorin Player.app" \
    --app-drop-link 600 185 \
    "$DMG_PATH" \
    "$APP_PATH" || true
fi

echo "macOS build done. Artifacts in build/bin/"
