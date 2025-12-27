# Tomorin Player - Debian/Ubuntu 打包指南

本项目提供脚本化的 Debian 打包流程，所有版本号均由环境变量或 Tag 注入。

## 前置依赖

```bash
sudo apt-get update
sudo apt-get install -y jq dpkg-dev libgtk-3-dev libwebkit2gtk-4.1-dev nsis gcc-mingw-w64-x86-64
# Wails CLI
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

> 兼容性说明：Wails 目前仍引用 `webkit2gtk-4.0` 的 pkgconfig 名称，Debian 13 提供 `4.1`。
> 如遇编译检测问题，可添加软链接：
>
> ```bash
> sudo ln -s /usr/lib/x86_64-linux-gnu/pkgconfig/webkit2gtk-4.1.pc \
>            /usr/lib/x86_64-linux-gnu/pkgconfig/webkit2gtk-4.0.pc
> ```

## 构建与打包

```bash
# 1) 构建前端
cd frontend
pnpm install
pnpm build
cd ..

# 2) 注入版本并构建 + 打包
export APP_VERSION=1.2.3
scripts/build-deb.sh
```

脚本会：
- 使用 `APP_VERSION`（或 fallback 读取 `frontend/package.json`）
- 注入 `VITE_APP_VERSION` 到前端
- 临时更新 `wails.json` 的 `productVersion`（构建后恢复）
- 生成 `.deb` 包于 `build/deb/`

## 安装测试

```bash
sudo dpkg -i build/deb/tomorin-player_1.2.3_amd64.deb
# 如有依赖问题：
sudo apt-get install -f
```

## 依赖

- 运行时依赖：
  - `libgtk-3-0`
  - `libwebkit2gtk-4.1-0 | libwebkit2gtk-4.0-37`

## 验证

```bash
# 查看控制信息
dpkg-deb -I build/deb/tomorin-player_1.2.3_amd64.deb
# 列出文件
dpkg-deb -c build/deb/tomorin-player_1.2.3_amd64.deb
```

