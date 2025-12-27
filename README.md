<div align="center">
  
<img src="assets/icons/appicon-256.png" alt="Tomorin Player Icon" width="120" height="120" />

# Tomorin Player

**基于 B站 API 的音乐播放器**

_使用 Wails v2 构建的跨平台桌面应用_

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)[![Wails](https://img.shields.io/badge/Wails-v2.11-DF0039?logo=wails&logoColor=white)](https://wails.io)[![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go&logoColor=white)](https://golang.org)[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

[功能特性](#功能特性) • [开发环境](#开发环境) • [打包构建](#打包构建) • [项目结构](#项目结构)

</div>

---

## 简介
<div align="center">

Tomorin Player 是一款轻量的的音乐播放器。采用现代化技术栈构建，提供流畅的用户体验。

支持 B 站扫码登录、BV 号解析、收藏夹导入、歌单管理等功能。

</div>

**技术栈**

- **后端**: Go + SQLite + Wails v2
- **前端**: React 18 + TypeScript + Mantine UI v8
- **构建**: Vite + pnpm

**特点**

- 跨平台支持（macOS / Windows / Linux）
- 主题系统（浅色/深色 + 自定义）
- 无需依赖 yt-dlp，直接使用 B站 API
- 本地数据库存储，离线可用

--- 

<div align="center">

这个项目的灵感来自于 [Azusa Player](https://github.com/kenmingwang/azusa-player)，起因是开发者需要一个能够去掉b站视频片头片尾的播放器，于是便有了这个项目。

开发者个人能力有限，本项目大部分代码使用 AI 生成，可能会有较多的bug，欢迎提 issue 或者 PR。

本项目主要是自用，提出的需求不一定会被采纳，但是如果有什么问题或者建议，也欢迎提 issue 或者 PR。

项目在 Linux 和 MacOS 平台上测试通过，Windows 平台尚未测试。

所有平台自动构建的安装包均不保证可用性，建议参考下文的构建方法自行构建。

如果这个项目对你有帮助，请给一个 Star！

</div>

---

## 功能特性

### 账号与登录

- B站扫码登录
- 自动获取用户信息（头像、用户名）
- 登录状态持久化

### 歌单管理

- 创建、编辑、删除歌单
- 从 BV 号添加歌曲（支持分P选择、音频截取）
- 导入 B站 收藏夹（通过 fid 或登录账号）
- 歌单复制功能
- 自动清理未被引用的歌曲

### 音频播放

- 基于 B站 API 的音频解析（无需 yt-dlp）
- 播放地址自动缓存和过期刷新
- 支持播放区间设置（跳过片头片尾）
- 播放模式切换（列表循环/随机/单曲循环）
- 进度控制、音量调节
- 智能音频源管理（元数据更新不中断播放）

### 搜索功能

- 全局搜索（歌曲名、歌手、BV号）
- 远程搜索（B站视频搜索）
- BV 号快速解析
- 实时搜索结果

### 歌曲编辑

- 编辑歌曲信息（名称、歌手、封面）
- 自定义播放区间
- 手动设置播放地址

### 下载管理

- 歌曲离线下载
- 下载进度显示
- 批量下载歌单
- 本地文件管理

### 主题系统

- 内置多款主题（浅色/深色）
- 自定义主题编辑器
- 主题颜色、背景图、透明度调节
- 主题导入/导出

### 其他功能

- 缓存管理
- 音频缓存清理
- 播放列表可视化编辑
- 拖拽排序

---

## 开发环境

### 前置要求

- **Go** 1.21+
- **Node.js** 18+
- **pnpm** (推荐) 或 npm
- **Wails CLI**: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

### 安装依赖

```bash
# 后端依赖
go mod tidy

# 前端依赖
cd frontend
pnpm install
```

### 开发模式

```bash
# 启动开发服务器（热重载）
wails dev
```

或者分别启动前后端：

```bash
# 终端 1: 前端开发服务器
cd frontend
pnpm dev

# 终端 2: Wails 后端
wails dev
```

---

## 打包构建

### macOS

```bash
# 构建 macOS 应用
wails build

# 输出位置
# build/bin/Tomorin Player.app
```

### Windows

```bash
# 构建 Windows 应用
wails build -platform windows/amd64

# 输出位置
# build/bin/Tomorin Player.exe
```

### Linux

```bash
# 构建 Linux 应用
wails build -platform linux/amd64

# 输出位置
# build/bin/tomorin-player
```

### Debian 13 打包 (.deb)

#### 1. 安装系统依赖

```bash
# 安装 Wails CLI
go install github.com/wailsapp/wails/v2/cmd/wails@latest

# 安装构建依赖（注意：Debian 13 使用 webkit2gtk-4.1）
sudo apt install -y libgtk-3-dev libwebkit2gtk-4.1-dev

# 创建兼容性软链接（Wails 需要 webkit2gtk-4.0）
sudo ln -s /usr/lib/x86_64-linux-gnu/pkgconfig/webkit2gtk-4.1.pc \
           /usr/lib/x86_64-linux-gnu/pkgconfig/webkit2gtk-4.0.pc
```

#### 2. 构建前端资源

```bash
cd frontend
pnpm install
pnpm run build
cd ..
```

#### 3. 构建应用程序

```bash
~/go/bin/wails build
```

#### 4. 创建 .deb 包结构

```bash
# 创建目录结构
mkdir -p build/deb/tomorin-player_1.0.0_amd64/{DEBIAN,usr/bin,usr/share/applications,usr/share/icons/hicolor/256x256/apps,usr/share/doc/tomorin-player}

# 复制文件
cp build/bin/tomorin-player build/deb/tomorin-player_1.0.0_amd64/usr/bin/
cp assets/icons/appicon-256.png build/deb/tomorin-player_1.0.0_amd64/usr/share/icons/hicolor/256x256/apps/tomorin-player.png

# 设置权限
chmod 755 build/deb/tomorin-player_1.0.0_amd64/usr/bin/tomorin-player
chmod 644 build/deb/tomorin-player_1.0.0_amd64/usr/share/icons/hicolor/256x256/apps/tomorin-player.png
```

#### 5. 创建控制文件

在 `build/deb/tomorin-player_1.0.0_amd64/DEBIAN/control` 创建：

```
Package: tomorin-player
Version: 1.0.0
Section: sound
Priority: optional
Architecture: amd64
Depends: libgtk-3-0, libwebkit2gtk-4.1-0
Maintainer: Sheyiyuan <sheyiyuantan90@qq.com>
Description: 更好的 bilibili 音乐播放器
 Tomorin Player 是一个基于 B站 API 的音乐播放器，
 支持扫码登录、BV 号解析、音频播放和歌单管理。
Homepage: https://github.com/Sheyiyuan/Tomorin-Player
```

创建桌面快捷方式 `build/deb/tomorin-player_1.0.0_amd64/usr/share/applications/tomorin-player.desktop`:

```ini
[Desktop Entry]
Name=Tomorin Player
Comment=更好的 bilibili 音乐播放器
Exec=/usr/bin/tomorin-player
Icon=tomorin-player
Terminal=false
Type=Application
Categories=AudioVideo;Audio;Player;
```

#### 6. 构建 .deb 包

```bash
cd build/deb
dpkg-deb --build --root-owner-group tomorin-player_1.0.0_amd64
```

#### 7. 安装测试

```bash
sudo dpkg -i tomorin-player_1.0.0_amd64.deb

# 如有依赖问题
sudo apt-get install -f
```

生成的 .deb 包约 4.9 MB，包含完整的前端资源和可执行文件。

### 构建选项

```bash
# 生产构建（压缩优化）
wails build -clean

# 跳过前端构建（加速）
wails build -skipbindings

# 自定义输出目录
wails build -o custom-output-name
```

---

## 项目结构

```
tomorin/
├── main.go                 # Wails 入口
├── internal/
│   ├── db/                # 数据库初始化
│   ├── models/            # 数据模型
│   ├── services/          # 业务逻辑（播放、收藏夹、下载等）
│   └── proxy/             # HTTP 代理配置
├── frontend/
│   ├── src/
│   │   ├── components/    # React 组件
│   │   ├── hooks/         # 自定义 Hooks
│   │   ├── context/       # React Context
│   │   ├── utils/         # 工具函数
│   │   └── types.ts       # TypeScript 类型定义
│   └── wailsjs/           # Wails 自动生成的绑定
├── build/                 # 构建输出
└── wails.json            # Wails 配置
```

---

## 更新日志


### v1.1.0 (2024-12-20)

**已知问题修复**
- ✅ BV 号解析失败问题修复
- ✅ 页面样式完整性提升
- ✅ 登录状态检查完善

**功能增强**
- ✅ 支持播放模式切换（列表/随机/单曲）
- ✅ 优化内置主题

### v1.0.0 (2024-12-19)

**初始版本功能**
- ✅ 完全去除 yt-dlp，改用官方 B站 API
- ✅ 支持扫码登录，展示头像与用户名并持久化
- ✅ BV 号解析与音频播放
- ✅ 歌单管理：创建、编辑、删除、导入我的收藏
- ✅ 主题系统：浅色/深色切换，支持自定义主题
- ✅ 本地缓存与播放设置（跳过片头/片尾）
- ✅ Mantine v8 适配与整体样式修复

**稳定性与修复**
- ✅ 修复 BV 解析失败导致的“未知错误”提示
- ✅ 后端错误信息完善，前端登录态检查补充
- ✅ 前后端接口统一，保证基础流程可用


## 许可证

[MIT License](LICENSE)


