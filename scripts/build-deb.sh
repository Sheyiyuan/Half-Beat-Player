#!/bin/bash
set -euo pipefail

# Tomorin Player - Debian packaging script
# Usage: scripts/build-deb.sh [VERSION]
# If VERSION is omitted, tries to read from frontend/package.json

APP_NAME="tomorin-player"
# 优先使用环境变量 APP_VERSION；其次命令行参数；最后从 frontend/package.json 读取
VERSION=${APP_VERSION:-${1:-}}

if [[ -z "$VERSION" ]]; then
  if [[ -f frontend/package.json ]]; then
    VERSION=$(jq -r .version frontend/package.json)
  else
    echo "Version not provided (APP_VERSION/arg) and frontend/package.json missing" >&2
    exit 1
  fi
fi

PKG_NAME="${APP_NAME}_${VERSION}_amd64"
DEB_DIR="build/deb/${PKG_NAME}"

# Ensure tools
command -v jq >/dev/null || { echo "jq is required"; exit 1; }
command -v dpkg-deb >/dev/null || { echo "dpkg-deb missing. sudo apt install dpkg-dev"; exit 1; }

# Find wails
WAILS_CMD=${WAILS_CMD:-}
if [[ -z "$WAILS_CMD" ]]; then
  if command -v wails >/dev/null; then WAILS_CMD="wails"; elif [[ -f "$HOME/go/bin/wails" ]]; then WAILS_CMD="$HOME/go/bin/wails"; else echo "wails not found"; exit 1; fi
fi

echo "Building app (version ${VERSION}) with ${WAILS_CMD}..."

# 将版本注入前端 (Vite 仅暴露以 VITE_ 前缀的环境变量)
export VITE_APP_VERSION="${VERSION}"

# 临时更新 wails.json 的 productVersion
BACKUP_WAILS_JSON="wails.json.bak"
cp wails.json "$BACKUP_WAILS_JSON"
jq --arg ver "$VERSION" '.windows.info.productVersion = $ver | .info.productVersion = $ver' wails.json > wails.json.tmp && mv wails.json.tmp wails.json
trap 'mv -f "$BACKUP_WAILS_JSON" wails.json 2>/dev/null || true' EXIT

"${WAILS_CMD}" build -clean -platform linux/amd64

[[ -f build/bin/${APP_NAME} ]] || { echo "Executable missing"; exit 1; }

rm -rf "${DEB_DIR}"
mkdir -p "${DEB_DIR}/DEBIAN" "${DEB_DIR}/usr/bin" "${DEB_DIR}/usr/share/applications" "${DEB_DIR}/usr/share/icons/hicolor/256x256/apps" "${DEB_DIR}/usr/share/pixmaps"

install -m 0755 build/bin/${APP_NAME} "${DEB_DIR}/usr/bin/${APP_NAME}"
install -m 0644 build/linux/tomorin-player.desktop "${DEB_DIR}/usr/share/applications/tomorin-player.desktop"
install -m 0644 assets/icons/appicon-256.png "${DEB_DIR}/usr/share/icons/hicolor/256x256/apps/${APP_NAME}.png"
install -m 0644 assets/icons/appicon-256.png "${DEB_DIR}/usr/share/pixmaps/${APP_NAME}.png"

cat > "${DEB_DIR}/DEBIAN/control" << EOF
Package: ${APP_NAME}
Version: ${VERSION}
Section: sound
Priority: optional
Architecture: amd64
Depends: libc6, libgtk-3-0, libwebkit2gtk-4.1-0 | libwebkit2gtk-4.0-37
Maintainer: Sheyiyuan <sheyiyuantan90@qq.com>
Description: 基于 B站 API 的音乐播放器
 Tomorin Player 是一款轻量的音乐播放器，采用 Wails v2 构建。
 支持 B 站扫码登录、BV 号解析、收藏夹导入、歌单管理等功能。
Homepage: https://github.com/Sheyiyuan/Tomorin-Player
EOF

cat > "${DEB_DIR}/DEBIAN/postinst" << 'EOF'
#!/bin/bash
set -e
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database -q || true
command -v gtk-update-icon-cache >/dev/null 2>&1 && gtk-update-icon-cache -q -t -f /usr/share/icons/hicolor || true
exit 0
EOF

cat > "${DEB_DIR}/DEBIAN/postrm" << 'EOF'
#!/bin/bash
set -e
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database -q || true
command -v gtk-update-icon-cache >/dev/null 2>&1 && gtk-update-icon-cache -q -t -f /usr/share/icons/hicolor || true
exit 0
EOF

chmod 0755 "${DEB_DIR}/DEBIAN/postinst" "${DEB_DIR}/DEBIAN/postrm"

dpkg-deb --build "${DEB_DIR}" "build/deb/${PKG_NAME}.deb"

echo "Built: build/deb/${PKG_NAME}.deb"