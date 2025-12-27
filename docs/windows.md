# Tomorin Player - Windows 安装与运行

## 安装方式

- 安装程序（推荐）：下载并运行 `Tomorin Player-amd64-installer.exe`
- 绿色版：下载并直接运行 `tomorin-player.exe`

## 系统要求

- Windows 10/11（64位）
- WebView2 运行时（用于渲染界面）

### WebView2 安装

- Windows 11：通常自带，无需安装
- Windows 10：需安装 WebView2 运行时
  - 自动：安装程序会检测并提示安装
  - 手动：
    - 官网下载 Evergreen Standalone Installer：
      https://developer.microsoft.com/zh-cn/microsoft-edge/webview2/#download-section
    - 直接链接： https://go.microsoft.com/fwlink/p/?LinkId=2124703

## 常见问题

- 双击没反应或闪退：通常是缺少 WebView2 运行时
  - 解决：安装 WebView2 或使用安装程序自动安装
- 提示找不到 DLL/无法启动：
  - 解决：安装 Windows 更新与 Visual C++ Redistributable（x64）
- 图标错误：
  - 新版本已修复。安装后如仍异常，可刷新图标缓存（重启 Explorer）。

## 命令行诊断

在安装目录中运行：

```cmd
cd <安装目录>
tomorin-player.exe
```

## 开发/构建说明（给开发者）

- 版本来源：由 `APP_VERSION` 环境变量或 Git Tag 注入（CI 已配置）
- 交叉编译（Linux 主机）：需要 MinGW-w64 与 NSIS；go-sqlite3 需 `CGO_ENABLED=1`

```bash
# Linux 主机交叉编译 Windows（生成 .exe 与 NSIS 安装包）
export APP_VERSION=1.2.3
scripts/windows/build-windows.sh -c
```

- Windows 主机（PowerShell）：

```powershell
$env:APP_VERSION = "1.2.3"
./scripts/windows/build-windows.ps1 -Clean -NSIS
```

构建脚本会：
- 注入 `VITE_APP_VERSION` 到前端
- 临时写入 `wails.json` 的 `productVersion`（构建后恢复）

