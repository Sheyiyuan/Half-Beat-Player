# half-beat - GitHub Copilot 指令

## 项目概述

**half-beat** 是一个基于 B站 API 的音乐播放器，采用 Wails 框架构建桌面应用。

- **语言**: Go (后端) + TypeScript/React (前端)
- **框架**: Wails v2, React 18, Mantine v8
- **主要功能**: B站扫码登录、BV 号解析、音频播放、歌单管理

## 最近完成的工作

### ✅ Phase 1-4: 核心功能实现 (已完成)
1. **完全去除 yt-dlp** → 改用 B站 API
2. **修复页面样式** → 添加 Mantine CSS 导入和全局样式
3. **QR 码生成** → 从第三方 API 改为本地 `qrcode` 库
4. **用户信息显示** → 实现 `GetUserInfo()`，显示头像/用户名，缓存到 localStorage

### ✅ Phase 5: BV 号解析失败修复 (刚完成)

**问题**: 输入 BV 号解析失败，显示"未知错误"

**修复方案**:
- 后端: 改进错误消息，修复 API 字段类型
- 前端: 添加登录状态检查

**编译状态**: ✅ 成功

## 代码规范

### Go 后端
- 错误处理: 使用 `fmt.Errorf` 包装错误，提供上下文
- HTTP 请求: 使用 `s.httpClient`
- 数据模型: 在 `internal/models/models.go` 中定义

### TypeScript/React 前端
- 状态管理: React Hooks
- 通知: Mantine `notifications` API
- 样式: Mantine v8 + `index.css`

## 常见任务

1. **添加新 API**: 在 Go 中实现 → 运行 `wails generate` → 在前端调用
2. **修改 UI**: 编辑 `.tsx` 文件，使用 Mantine 组件
3. **调试**: `wails dev` (http://localhost:34115)

## 重要文件

| 文件 | 用途 |
|-----|-----|
| `main.go` | Wails 入口 |
| `internal/services/service.go` | 核心业务逻辑 |
| `internal/models/models.go` | 数据模型 |
| `frontend/src/App.tsx` | 主 React 组件 |
| `wails.json` | Wails 配置 |

## 下一步改进

- [ ] 添加日志记录系统
- [ ] 实现缓存机制
- [ ] 添加网络重试逻辑
- [ ] 支持 Windows/Linux
- [ ] 添加单元测试

## 系统原生集成规划（新）

- 托盘：仅 Windows/Linux，使用轻量 systray；功能限定为打开/隐藏主窗口与退出，不做播放控制。
- 媒体控件：三平台统一支持歌曲信息与封面同步；媒体键控制播放/暂停/上一首/下一首。
- 优先级：先做媒体控件（Linux MPRIS2 → Windows WinRT → macOS Cocoa/Wails），再补托盘；总目标 6-7 天。
- 前端：新增 `useSystemIntegration` Hook，同步播放状态/元数据到后端接口，不含托盘菜单逻辑。

## 技术与架构方案（托盘 & 媒体控件）

- 后端：Wails v2 + Go。
- 托盘：`getlantern/systray`（Windows/Linux），仅提供打开/隐藏与退出，不含播放控制。
- 媒体控件：
	- Linux：MPRIS2（`godbus/dbus`）。
	- Windows：WinRT SMTC（`go-ole` 调用 WinRT）。
	- macOS：Wails Runtime 的 Cocoa/objc binding（避免自写 cgo）。
- 前端：React + Mantine；新增 `useSystemIntegration` Hook，同步当前曲目/播放状态到后端媒体接口；托盘无前端菜单逻辑。
- 目录结构建议：
	- `internal/media/`: `media.go` 接口 + 平台实现（linux/windows/darwin）。
	- `internal/tray/`: `tray.go` 接口 + 平台实现（linux/windows）。
	- `main.go`: 初始化媒体控制与托盘；`internal/services/service.go` 暴露 RPC。
- 实施顺序：先媒体控件（Linux → Windows → macOS），后托盘；总工期约 6-7 天。

