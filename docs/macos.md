# Tomorin Player - macOS 构建与安装

## 系统要求
- macOS 12+（Intel/Apple Silicon）
- Xcode Command Line Tools
- Wails CLI, Go 1.22+, Node.js 18+, pnpm

## 构建
```bash
# 安装前端依赖
cd frontend
pnpm install
pnpm build
cd ..

# 构建（统一版本注入）
export APP_VERSION=1.2.3
scripts/build-macos.sh -c
```

脚本行为：
- 使用 `APP_VERSION`/`VITE_APP_VERSION` 注入版本
- 执行 `wails build -platform darwin/universal`
- 如安装了 `create-dmg`，会尝试生成 DMG：`build/bin/Tomorin-Player-<version>.dmg`

## 安装
- `.app` 直接拖入 `/Applications`
- 如生成 DMG，双击挂载后拖拽安装

## 签名与公证（可选）
- 目前脚本未包含签名/公证；需自行使用 `codesign` 与 `notarytool` 处理

## 常见问题
- `wails` 未找到：确认已安装并在 PATH（或放在 `$HOME/go/bin`）
- 缺少 `create-dmg`：通过 `brew install create-dmg` 安装，或直接使用 `.app`
