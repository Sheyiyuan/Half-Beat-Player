<div align="center">

<img src="assets/icons/appicon-256.png" alt="Half Beat Player Icon" width="120" height="120" />

# Half Beat Player

**基于 B站 API 的音乐播放器，实现电脑上的「听视频」自由**

_使用 Wails v2 构建的跨平台桌面应用_

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Wails](https://img.shields.io/badge/Wails-v2.11-DF0039?logo=wails&logoColor=white)](https://wails.io)
[![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go&logoColor=white)](https://golang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Mantine](https://img.shields.io/badge/Mantine-v8-339AF0?logo=mantine&logoColor=white)](https://mantine.dev)

[功能特性](#功能特性) • [开发环境](#开发环境) • [构建与发布](#构建与发布) • [项目结构](#项目结构) • [更新日志](#更新日志)

</div>

---

## 简介

**Half Beat Player** 是一款轻量级、现代化的桌面音乐播放器，专为 Bilibili 用户设计。它允许你直接播放 Bilibili 视频的音频流，无需下载视频，实现高效的「听视频」体验。

### 核心优势

- **原生体验**: 基于 Wails v2 构建，拥有原生应用的性能和 Web 技术的灵活性。
- **无需 yt-dlp**: 直接调用 Bilibili API 解析音频流，响应速度快，依赖少。
- **现代化 UI**: 使用 Mantine v8 组件库，支持深色/浅色模式及自定义主题。
- **本地优先**: 歌单和配置存储在本地 SQLite 数据库中，支持离线管理。

---

这个项目的灵感来自于 [Azusa Player](https://github.com/kenmingwang/azusa-player)，起因是开发者需要一个能够去掉b站视频片头片尾的播放器，于是便有了这个项目。

开发者个人能力有限，本项目大部分代码使用 AI 生成，可能会有较多的 bug，欢迎提 issue 或者 PR。

本项目主要是自用，提出的需求不一定会被采纳，但是如果有什么问题或者建议，也欢迎提 issue 或者 PR。

所有平台自动构建的安装包均不保证可用性，建议参考下文的构建方法自行构建。

如果这个项目对你有帮助，请给一个 Star！

---

## 功能特性

### Bilibili 集成

- **扫码登录**: 安全便捷的 B站账号接入。
- **用户信息**: 实时同步头像、用户名及登录状态。
- **收藏夹导入**: 一键导入 Bilibili 公开或私有收藏夹。

### 播放体验

- **音频解析**: 支持多码率音频流解析。
- **片段播放**: 支持设置播放区间，自动跳过片头片尾。
- **播放模式**: 列表循环、随机播放、单曲循环。
- **音频代理**: 内置音频代理服务器，解决跨域及防盗链问题。

### 歌单管理

- **灵活组织**: 创建、编辑、删除自定义歌单。
- **BV 号解析**: 支持通过 BV 号快速添加歌曲，支持分 P 选择。
- **歌曲编辑**: 自定义歌曲名、歌手、封面及播放参数。

### 搜索与发现

- **全局搜索**: 快速查找本地库中的歌曲。
- **远程搜索**: 直接在应用内搜索 B站视频并添加至歌单。

---

## 免责声明 (Disclaimer)

1. **项目用途**：本项目仅供学习、研究和技术交流使用，请勿将其用于任何商业用途。
2. **版权声明**：本项目所使用的所有 Bilibili 相关 API 均来自互联网。视频、音频、封面等内容版权归 [Bilibili](https://www.bilibili.com) 及相关权利人所有。
3. **风险自担**：用户在使用本项目时需自行承担风险（包括但不限于账号封禁、数据丢失等）。开发者不对因使用本项目而产生的任何直接或间接损失负责。
4. **及时删除**：如果 Bilibili 或相关权利人认为本项目侵犯了其合法权益，请联系开发者，我将在收到通知后第一时间删除相关代码。
5. **最终解释权**：开发者保留对本项目、相关协议及免责声明的最终解释权与修改权。

---

## 隐私与数据说明

为了提供核心功能，本项目会在本地存储以下数据：

- **数据目录**：通常位于系统的用户配置目录下（如 Linux 的 `~/.config/half-beat/`，Windows 的 `AppData/Roaming/half-beat/`）。
- **登录凭证**：B 站登录后的 Cookie 信息加密存储于本地 `sessdata.json` 中，仅用于与 B 站服务器通信。
- **本地数据库**：歌单、歌曲元数据及应用设置存储在 `half-beat.db` (SQLite) 中。
- **网络说明**：应用启动时会在本地运行一个音频代理服务器（默认端口 `9999`，仅监听 `127.0.0.1`），用于转发音频流以绕过防盗链限制。

本项目**不会**上传任何个人数据到第三方服务器（Bilibili 官方服务器除外）。

---

## 开发环境

### 前置要求

- **Go**: 1.22+
- **Node.js**: 18+
- **pnpm**: 8+
- **Wails**: v2.11+
- **CGO 编译器**: (Windows 需要 gcc, Linux 需要 build-essential)

### 运行开发版

```bash
# 安装前端依赖
cd frontend
pnpm install

# 返回根目录启动开发模式
cd ..
wails dev
```

---

## 构建与发布

### 基础构建

使用 Wails CLI 构建当前平台的可执行文件：

```bash
wails build
```

### 脚本化打包 (推荐)

项目提供了自动化脚本，支持版本注入和多平台打包。

#### 1. 设置版本号 (可选)

可以通过环境变量注入版本号，否则将从 `frontend/package.json` 读取：

```bash
export APP_VERSION=1.0.0
```

#### 2. Linux 打包 (DEB/RPM)

```bash
# 构建 DEB 包 (Debian/Ubuntu)
./scripts/build-deb.sh

# 构建 RPM 包 (Fedora/RHEL)
./scripts/build-rpm.sh
```

#### 3. Windows 打包 (NSIS)

支持在 Linux 下使用 MinGW 交叉编译：

```bash
# 构建 NSIS 安装程序
./scripts/windows/build-windows.sh

# 清理并构建
./scripts/windows/build-windows.sh -c
```

#### 4. macOS 打包

```bash
./scripts/build-macos.sh
```

详细文档请参考：

- [Windows 安装与运行](docs/windows.md)
- [macOS 构建与安装](docs/macos.md)
- [Debian/Ubuntu 打包](docs/debian.md)
- [RPM 打包](docs/rpm.md)

---

## 项目结构

```text
.
├── internal/               # Go 后端逻辑
│   ├── db/                 # 数据库初始化与 GORM 迁移
│   ├── models/             # GORM 数据模型定义
│   ├── proxy/              # 音频代理服务器 (处理 B站 Referer 限制)
│   └── services/           # 核心业务服务
│       ├── login.go        # B站扫码登录逻辑
│       ├── bili_play.go    # B站音频流解析
│       ├── playlist.go     # 歌单管理
│       └── ...             # 搜索、下载、歌词等服务
├── frontend/               # React 前端 (Vite + TS)
│   ├── src/
│   │   ├── components/     # UI 组件 (Mantine v8)
│   │   ├── hooks/          # 业务逻辑封装 (播放器控制、数据获取)
│   │   ├── context/        # 全局状态管理 (主题、播放状态)
│   │   ├── api.ts          # Wails 自动生成的 Go 方法绑定调用
│   │   └── utils/          # 工具函数 (图片处理、时间格式化)
│   └── wailsjs/            # Wails 自动生成的 JS 绑定
├── scripts/                # 跨平台构建与打包脚本
├── build/                  # 构建产物与平台特定配置 (图标、NSIS 脚本)
├── assets/                 # 静态资源
├── main.go                 # 应用入口，初始化服务与 Wails 运行时
└── wails.json              # Wails 项目配置文件
```

---

## 更新日志

- 最新发布与变更请查看 GitHub Releases：
  - [Releases](https://github.com/Sheyiyuan/Half-Beat-Player/releases)
  - [Tags](https://github.com/Sheyiyuan/Half-Beat-Player/tags)

---

## 开源协议

- 本项目**代码**部分采用 [MIT License](LICENSE) 协议开源。
- 本项目使用的 **Logo、图标、视觉资产、文档文字内容及代码文件中与软件功能无关的文案内容**（包括但不限于 README 中的个人说明、项目简介、代码注释等）版权归原作者所有，**不属于** MIT 协议授权范围。未经许可，禁止在其他项目或衍生作品中直接使用这些资产。
