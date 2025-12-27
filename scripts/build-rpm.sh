#!/usr/bin/env bash
set -euo pipefail

# Tomorin Player - RPM packaging script
# Usage: APP_VERSION=1.2.3 scripts/build-rpm.sh
# Requirements: fpm, rpm, jq, wails, ImageMagick (for icon resize), gtk/webkit dev packages

APP_NAME="tomorin-player"
APP_VERSION=${APP_VERSION:-}

if [[ -z "$APP_VERSION" ]]; then
  if [[ -f frontend/package.json ]]; then
    APP_VERSION=$(jq -r .version frontend/package.json)
  else
    echo "APP_VERSION not provided and frontend/package.json missing" >&2
    exit 1
  fi
fi

# Ensure tools
command -v fpm >/dev/null || { echo "fpm is required (sudo gem install fpm)" >&2; exit 1; }
command -v convert >/dev/null || { echo "ImageMagick 'convert' is required" >&2; exit 1; }

# Build binary
export APP_VERSION
export VITE_APP_VERSION="$APP_VERSION"
WAILS_CMD="${WAILS_CMD:-wails}"
if ! command -v "$WAILS_CMD" >/dev/null; then
  if [[ -x "$HOME/go/bin/wails" ]]; then WAILS_CMD="$HOME/go/bin/wails"; else echo "wails not found" >&2; exit 1; fi
fi

echo "Building app (version $APP_VERSION) for linux/amd64..."

# Temporarily patch wails.json productVersion
BACKUP_WAILS_JSON="wails.json.bak"
cp wails.json "$BACKUP_WAILS_JSON"
jq --arg ver "$APP_VERSION" '.windows.info.productVersion = $ver | .info.productVersion = $ver' wails.json > wails.json.tmp && mv wails.json.tmp wails.json
trap 'mv -f "$BACKUP_WAILS_JSON" wails.json 2>/dev/null || true' EXIT

"$WAILS_CMD" build -clean -platform linux/amd64

# Stage files
ROOT="build/rpm/${APP_NAME}_${APP_VERSION}"
rm -rf "$ROOT"
mkdir -p "$ROOT/usr/bin" "$ROOT/usr/share/applications" "$ROOT/usr/share/icons/hicolor/256x256/apps" "$ROOT/usr/share/pixmaps"

install -m 0755 build/bin/${APP_NAME} "$ROOT/usr/bin/${APP_NAME}"
install -m 0644 assets/icons/appicon-256.png "$ROOT/usr/share/icons/hicolor/256x256/apps/${APP_NAME}.png"
install -m 0644 assets/icons/appicon-256.png "$ROOT/usr/share/pixmaps/${APP_NAME}.png"

cat > "$ROOT/usr/share/applications/${APP_NAME}.desktop" <<'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Tomorin Player
Comment=更好的 bilibili 音乐播放器
Exec=tomorin-player
Icon=tomorin-player
Categories=AudioVideo;Audio;Player;
Terminal=false
StartupNotify=true
EOF

# Build RPM via fpm
mkdir -p build/rpm
pushd "$ROOT" >/dev/null
fpm -s dir -t rpm \
  -n "$APP_NAME" \
  -v "$APP_VERSION" \
  -a amd64 \
  --description "基于 B站 API 的音乐播放器" \
  --url "https://github.com/Sheyiyuan/Tomorin-Player" \
  --license "MIT" \
  --depends gtk3 \
  --depends "webkit2gtk4.1 | webkit2gtk4.0" \
  -C "$ROOT" \
  usr
popd >/dev/null

mv "$ROOT"/*.rpm build/rpm/
echo "RPM built: build/rpm/${APP_NAME}-${APP_VERSION}-1.amd64.rpm"
