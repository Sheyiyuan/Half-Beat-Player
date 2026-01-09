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

# Generate macOS ICNS file from PNG source
echo "Generating macOS icon..."
if [[ -f scripts/generate-icons.sh ]]; then
    bash scripts/generate-icons.sh darwin
else
    # Fallback: inline generation
    mkdir -p build/darwin
    if command -v iconutil >/dev/null 2>&1 && command -v sips >/dev/null 2>&1; then
        # Create iconset directory
        ICONSET_DIR="build/darwin/icon.iconset"
        mkdir -p "$ICONSET_DIR"
        
        # Generate required macOS icon sizes using sips
        sips -z 16 16 assets/icons/appicon-256.png --out "$ICONSET_DIR/icon_16x16.png" >/dev/null 2>&1
        sips -z 32 32 assets/icons/appicon-256.png --out "$ICONSET_DIR/icon_16x16@2x.png" >/dev/null 2>&1
        sips -z 32 32 assets/icons/appicon-256.png --out "$ICONSET_DIR/icon_32x32.png" >/dev/null 2>&1
        sips -z 64 64 assets/icons/appicon-256.png --out "$ICONSET_DIR/icon_32x32@2x.png" >/dev/null 2>&1
        sips -z 128 128 assets/icons/appicon-256.png --out "$ICONSET_DIR/icon_128x128.png" >/dev/null 2>&1
        sips -z 256 256 assets/icons/appicon-256.png --out "$ICONSET_DIR/icon_128x128@2x.png" >/dev/null 2>&1
        sips -z 256 256 assets/icons/appicon-256.png --out "$ICONSET_DIR/icon_256x256.png" >/dev/null 2>&1
        sips -z 512 512 assets/icons/appicon-256.png --out "$ICONSET_DIR/icon_256x256@2x.png" >/dev/null 2>&1
        sips -z 512 512 assets/icons/appicon-256.png --out "$ICONSET_DIR/icon_512x512.png" >/dev/null 2>&1
        sips -z 1024 1024 assets/icons/appicon-256.png --out "$ICONSET_DIR/icon_512x512@2x.png" >/dev/null 2>&1
        
        # Generate ICNS file
        iconutil -c icns "$ICONSET_DIR" -o build/darwin/icon.icns
        rm -rf "$ICONSET_DIR"
        echo "✓ Generated build/darwin/icon.icns using native macOS tools"
    else
        echo "Warning: macOS native tools not available, copying PNG as fallback"
        cp assets/icons/appicon-256.png build/darwin/icon.icns
    fi
fi

# Verify the icon file exists
if [[ ! -f build/darwin/icon.icns ]]; then
    echo "Error: Icon file build/darwin/icon.icns was not generated"
    exit 1
fi

echo "macOS icon file info:"
ls -lh build/darwin/icon.icns
file build/darwin/icon.icns 2>/dev/null || true

# Build frontend first to ensure assets are available
echo "Building frontend..."
cd frontend
pnpm install
pnpm build
cd ..

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
  APP_PATH="build/bin/half-beat.app"
  DMG_PATH="build/bin/half-beat-${APP_VERSION}.dmg"
  create-dmg \
    --volname "half-beat" \
    --window-pos 200 120 \
    --window-size 800 400 \
    --icon-size 100 \
    --icon "half-beat.app" 200 190 \
    --hide-extension "half-beat.app" \
    --app-drop-link 600 185 \
    "$DMG_PATH" \
    "$APP_PATH" || true
fi

echo "macOS build done. Artifacts in build/bin/"
