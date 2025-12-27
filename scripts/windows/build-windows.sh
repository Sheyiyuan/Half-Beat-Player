#!/usr/bin/env bash
set -euo pipefail

# Cross-compile Windows build using mingw-w64 and NSIS
# Usage: scripts/windows/build-windows.sh [-c]

CLEAN=false
if [[ ${1:-} == "-c" ]]; then CLEAN=true; fi

# Ensure deps
command -v x86_64-w64-mingw32-gcc >/dev/null || { echo "Install mingw-w64: sudo apt install gcc-mingw-w64-x86-64"; exit 1; }
command -v makensis >/dev/null || command -v nsis >/dev/null || { echo "Install NSIS: sudo apt install nsis"; exit 1; }

# Ensure wails
if command -v wails >/dev/null; then WAILS_CMD=wails; elif [[ -f "$HOME/go/bin/wails" ]]; then WAILS_CMD="$HOME/go/bin/wails"; else echo "wails not found"; exit 1; fi

export CGO_ENABLED=1
export CC=x86_64-w64-mingw32-gcc
export CXX=x86_64-w64-mingw32-g++

# Version injection: prefer APP_VERSION env; else read from frontend/package.json
VERSION=${APP_VERSION:-}
if [[ -z "$VERSION" && -f frontend/package.json ]]; then VERSION=$(jq -r .version frontend/package.json); fi
if [[ -z "$VERSION" ]]; then echo "APP_VERSION not set and package.json missing"; exit 1; fi

# Inject into frontend and wails.json (temporary patch)
export VITE_APP_VERSION="$VERSION"
BACKUP_WAILS_JSON="wails.json.bak"
cp wails.json "$BACKUP_WAILS_JSON"
jq --arg ver "$VERSION" '.windows.info.productVersion = $ver | .info.productVersion = $ver' wails.json > wails.json.tmp && mv wails.json.tmp wails.json
trap 'mv -f "$BACKUP_WAILS_JSON" wails.json 2>/dev/null || true' EXIT

export CGO_ENABLED=1
export CC=x86_64-w64-mingw32-gcc
export CXX=x86_64-w64-mingw32-g++

ARGS=(build -platform windows/amd64 -nsis)
$CLEAN && ARGS=(build -platform windows/amd64 -nsis -clean)

"$WAILS_CMD" "${ARGS[@]}"
"$WAILS_CMD" "${ARGS[@]}"

echo "Artifacts in build/bin/"