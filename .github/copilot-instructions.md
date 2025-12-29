# Half Beat Player - GitHub Copilot 指令

> **重要提示**: 每次提交代码或完成重大功能更新时，**必须**同时更新此文档，以确保 AI 助手掌握最新的项目状态。

## 项目概述

**Half Beat Player** 是一个基于 Bilibili API 的桌面音乐播放器，使用 Wails v2 框架构建。它旨在提供轻量、高效的音频播放体验，支持跳过视频片头片尾。

- **核心架构**: Wails v2 (Go 后端 + TS/React 前端)
- **数据存储**: SQLite (GORM)
- **核心功能**: B站扫码登录、BV 号解析、音频代理、歌单管理、系统媒体集成。

## 技术栈规范

### Go 后端 (`internal/`)
- **版本**: Go 1.22+
- **错误处理**: 始终使用 `fmt.Errorf("context: %w", err)` 包装错误。
- **并发**: 谨慎使用 Goroutine，确保 context 正确传递以支持取消。
- **API 设计**: 在 `internal/services/service.go` 中定义方法，通过 Wails 绑定到前端。
- **数据库**: 使用 GORM 进行操作，模型定义在 `internal/models/`。

### TypeScript/React 前端 (`frontend/`)
- **版本**: React 18, TypeScript 5.3+
- **UI 框架**: Mantine v8 (使用 `@mantine/core`, `@mantine/hooks`, `@mantine/notifications`)。
- **状态管理**: 优先使用 React Context (`frontend/src/context/`) 和自定义 Hooks (`frontend/src/hooks/`)。
- **样式**: 结合 Mantine 主题系统与全局 CSS (`index.css`)。
- **图标**: 使用 `lucide-react` 或 `@tabler/icons-react`。

## 项目结构参考

| 路径 | 用途 |
|-----|-----|
| `main.go` | 应用入口，初始化数据库、服务和 Wails 运行时 |
| `internal/services/` | 业务逻辑层 (登录、播放、歌单、搜索等) |
| `internal/models/` | GORM 数据模型 |
| `internal/proxy/` | 音频代理服务器，处理 B站音频流转发 |
| `frontend/src/App.tsx` | 前端主入口 |
| `frontend/src/components/` | 可复用的 UI 组件 |
| `frontend/src/hooks/` | 业务逻辑封装 (播放器控制、数据获取等) |

## 编码准则

1. **Wails 绑定**: 修改后端 `Service` 方法后，需运行 `wails generate module` 更新前端绑定。
2. **音频播放**: 播放地址通过 `internal/proxy/` 转发，以绕过 B站的 Referer 限制。
3. **系统集成**: 
   - Linux 使用 MPRIS2 (`godbus/dbus`)。
   - Windows 使用 SMTC (`go-ole`)。
   - 托盘功能仅限 Windows/Linux，功能保持简洁。
4. **资源管理**: 确保在应用关闭时正确停止代理服务器和数据库连接。

## 当前进度与计划

### ✅ 已完成
- 核心播放逻辑与 B站 API 对接。
- 扫码登录与用户信息同步。
- 歌单管理与 BV 号解析。
- 基础 UI 框架与主题系统。
- **主题详情编辑器**: 支持 GUI 和 JSON 两种模式切换，JSON 模式包含完整的类型验证。
- **主题查看功能**: 内置主题支持只读查看。

### 🛠️ 进行中 / 待办
- [ ] **系统集成**: 实现 Linux MPRIS2 和 Windows SMTC 媒体控制。
- [ ] **系统托盘**: 实现基础的托盘菜单（显示/隐藏/退出）。
- [ ] **日志系统**: 建立后端日志记录机制。
- [ ] **缓存优化**: 改进音频流和封面的本地缓存。

## 主题编辑功能（最新更新）

### 组件架构
- **ThemeDetailModal** (`frontend/src/components/ThemeDetailModal.tsx`): 新的主题详情组件，支持两种模式
  - GUI 模式: 使用 Mantine 组件进行可视化编辑（滑块、颜色选择器等）
  - JSON 模式: 直接编辑 JSON 配置，包含实时验证
  - 两种模式完全等价，修改会自动同步

- **ThemeManagerModal** (`frontend/src/components/ThemeManagerModal.tsx`): 主题管理界面
  - 新增"详情"按钮：所有主题都可以查看详情
  - 内置主题显示为只读（无编辑/删除按钮）
  - 自定义主题显示编辑/删除按钮

### 关键功能
1. **双模式编辑**
   - GUI 模式：用户友好的可视化编辑
   - JSON 模式：高级用户可直接编辑 JSON
   - Tab 切换时自动同步数据

2. **JSON 类型检查**（保存前强制检查）
   - 验证所有必需字段存在
   - 颜色值必须是有效的十六进制格式 (#RRGGBB)
   - 数值字段检查范围（如不透明度 0-1，模糊 0-50px 等）
   - 枚举字段验证（如 windowControlsPos: 'left'|'right'|'hidden'）
   - 错误信息在 JSON 模式下即时显示

3. **只读模式**
   - 内置主题和已加载的主题可以查看详情
   - 所有输入字段禁用
   - 仅展示"关闭"按钮
   - JSON 模式下文本区域禁用编辑

### 使用流程
1. 打开主题管理器
2. 点击任何主题的"详情"按钮
3. 选择 GUI 或 JSON 模式编辑
4. JSON 模式下修改后点击"应用 JSON 配置"
5. 点击"保存"（编辑模式）或"关闭"（查看模式）

### 相关 Hook 和处理
- `useThemeEditor`: 主题编辑逻辑，新增 `viewTheme` 方法
- `useModalManager`: 新增 `themeDetailModal` 状态
- `useAppHandlers`: 新增 `handleViewTheme` 处理函数

## 交互建议
- 在处理 UI 问题时，优先考虑 Mantine 的组件属性。
- 在处理后端逻辑时，注意 Wails 运行时的 context 生命周期。
- 涉及 B站 API 时，参考 `internal/services/` 中已有的请求模式。
- JSON 验证需要保证所有颜色值都是有效的十六进制格式，所有数值都在指定范围内。
