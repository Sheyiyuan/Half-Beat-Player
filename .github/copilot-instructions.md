# Half Beat Player - GitHub Copilot 指令（精简版）

> **重要提示**：每次提交代码或完成重大功能更新时，必须同步更新此文档（只保留“仍然有效”的规则与最新变更）。

## 项目概述

Half Beat Player 是基于 Bilibili API 的桌面音乐播放器（Wails v2），支持跳过片头片尾。

- 架构：Wails v2（Go 后端 + TS/React 前端）
- 数据：SQLite（GORM）
- 关键能力：扫码登录、BV 解析、音频代理播放、歌单管理、下载管理

## 技术栈与目录

### 后端（Go）

- 版本：Go 1.22+
- 错误处理：统一用 `fmt.Errorf("context: %w", err)` 包装
- API：在 `internal/services/service.go` 定义方法并通过 Wails 绑定
- DB 模型：`internal/models/`

### 前端（TS/React）

- React 18 + TypeScript 5.3+
- UI：Mantine v8（`@mantine/core`, `@mantine/hooks`, `@mantine/notifications`）
- 状态：以 `frontend/src/hooks/useAppStore.ts` 为单一数据入口（store + actions）
- 样式：Mantine theme + `frontend/src/index.css`
- 图标：`lucide-react` 或 `@tabler/icons-react`

### 常用入口

- `main.go`：应用入口 + AutoMigrate
- `internal/proxy/proxy.go`：音频代理（绕过 Referer 限制）
- `frontend/src/App.tsx`：前端主入口
- `frontend/src/components/`：布局/卡片/模态框

## 开发约定（必须遵守）

1. 修改后端 Service 导出方法后，运行 `wails generate module` 更新前端绑定。
2. 音频播放必须走本地代理（`internal/proxy/`），不要直接把 B 站直链塞给 `<audio>`。
3. 并发：谨慎使用 goroutine；确保 context 可取消；后台任务尽量 best-effort，不阻塞播放。
4. 资源管理：应用关闭时正确停止代理与关闭 DB。

## 数据持久化与缓存（关键约束）

### 登录会话 / 播放记录入库

- `LoginSession` 与 `PlayHistory` 采用“单行表”（ID=1）保存；首次读取支持从旧 JSON 文件一次性迁移并 best-effort 删除旧文件。
- 关键路径：
  - `internal/services/login.go`
  - `internal/services/download.go`
  - `internal/models/models.go`、`main.go`（AutoMigrate）

### 音频缓存目录

- 缓存目录：`~/.config/half-beat/app_data/audio_cache`（Linux；`~/.config` 默认隐藏）
- 启动时创建 `audio_cache`，确保目录可见。
- `ClearAudioCache()`：清空目录内容但保留目录本身。

### 播放即缓存（落盘）

- 前端：代理播放 URL 追加 `sid=<song.id>`
- 后端代理：收到 `/audio` 且带 `sid` 时，后台 best-effort 拉取完整音频并写入 `audio_cache/<sid>.m4s`（不阻塞当前播放）

## UI 约定（与 Wails 相关）

### 顶栏拖拽

- 使用 Wails CSS 自定义属性：`--wails-draggable: drag`
- 可点击元素上使用 `--wails-draggable: no-drag` 以避免误拖拽（如 `.window-control`、`button`、`.app-no-drag`）

### 文本省略号策略

- 底部播放条：歌名滚动展示时不使用省略号（由容器裁切）。
- 列表/面板：标题/列表项空间不足时使用单行省略号（通常用 `truncate` 或 `lineClamp={1}`，并确保父容器 `minWidth: 0`）。

## 主题系统（要点）

### 主题模型与序列化

- 后端 Theme 模型精简为：`id`, `name`, `data(JSON)`, `isDefault`, `isReadOnly`（后端不强制 schema）。
- 前端通过 `convertTheme()` 将 `data` 反序列化为完整 Theme 对象，并提供合理默认值。

### colorScheme（亮/暗）

- 字段：`colorScheme: 'light' | 'dark'`（默认 `dark`）
- 应用主题时需同步调用 Mantine 的 `setColorScheme()`。

### 常见踩坑：重启回默认主题

- 正确：主题选择/编辑后调用 `store.actions.applyTheme(theme)`，它会同步 UI 并写入 `localStorage`（`half-beat.currentThemeId`）。
- 错误：只更新 UI setters / 只更新 `currentThemeId`，可能导致下次启动回退。

### 主题详情/编辑（简述）

- 支持 GUI 与 JSON 两种模式；两者等价并互相同步。
- JSON 模式包含强校验、错误提示、复制 JSON（只读模式不显示复制）。
- 两种模式容器高度固定为 500px（ScrollArea）。

## 最近更新（2026-01-08）

- 顶栏可拖拽：TopBar 使用 `--wails-draggable`，交互元素 no-drag。
- UI 文本：底部滚动标题不省略；列表项单行省略号。
- 登录/播放记录：统一迁移到 SQLite 单行表（含旧文件迁移）。
- 缓存：音频缓存目录 `audio_cache` 启动即创建；清缓存保留目录；播放即缓存落盘到 `audio_cache/<sid>.m4s`。

## ⚠️ 添加新字段时的关键检查清单

当添加新的主题配置字段（如 `colorScheme`）时，必须在以下所有位置同步修改，否则容易出现 `Can't find variable` / `undefined`：

### 1. 后端模型层

- [ ] 在 Go 结构体中添加字段（`internal/models/models.go`）
- [ ] 确保字段有正确的 JSON 标签

### 2. 前端类型定义层

- [ ] `frontend/wailsjs/go/models.ts`
- [ ] `frontend/src/utils/constants.ts`
- [ ] `frontend/src/types.ts`

### 3. 状态管理层

- [ ] 若字段参与 UI 状态：在 store/state 与 apply 逻辑中处理（优先跟随 `useAppStore` 体系）

### 4. 组件层

- [ ] Props 类型补齐
- [ ] ⚠️ 关键：组件函数参数解构中显式解构该字段

### 5. Hook 层

- [ ] Hook 入参/返回类型补齐
- [ ] ⚠️ 关键：Hook 函数参数解构中显式解构该字段

### 常见错误速查

| 错误 | 常见原因 | 解决方案 |
|------|----------|----------|
| `Can't find variable: xxx` | 使用了字段但忘了在参数解构中取出 | 检查函数签名/解构并补齐 |
| `undefined` | 初始化/默认值遗漏 | 补齐默认值与 apply 逻辑 |

最易出错的地方：**参数解构**。