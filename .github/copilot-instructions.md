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
    - 使用 ScrollArea 包装，固定高度 500px，保证一致的视觉效果
    - 支持滚动查看所有设置项
  - JSON 模式: 直接编辑 JSON 配置，包含实时验证
    - 使用 ScrollArea 包装，固定高度 500px，与 GUI 模式保持一致
    - minRows 设置为 20，提供更好的初始显示效果
    - 包含一键复制按钮，支持复制整个 JSON 配置到剪贴板
    - 复制成功时显示绿色通知和图标反馈（Copy → Check）
  - 两种模式完全等价，修改会自动同步

- **ThemeManagerModal** (`frontend/src/components/ThemeManagerModal.tsx`): 主题管理界面
  - 内置主题显示"详情"按钮：允许查看主题配置（只读模式）
  - 自定义主题只显示"编辑"按钮：允许修改主题配置
  - 自定义主题还显示"删除"按钮：支持删除主题

### 关键功能
1. **双模式编辑（固定高度一致）**
   - GUI 模式：用户友好的可视化编辑，ScrollArea 高度 500px
   - JSON 模式：高级用户可直接编辑 JSON，ScrollArea 高度 500px
   - Tab 切换时自动同步数据，高度保持一致

2. **复制功能**
   - JSON 模式下提供"复制 JSON"按钮
   - 一键复制整个 JSON 配置到剪贴板
   - 复制成功时显示绿色通知提示
   - 按钮图标切换反馈（Copy → Check 图标，持续 2 秒）

3. **JSON 类型检查**（保存前强制检查）
   - 验证所有必需字段存在
   - 颜色值必须是有效的十六进制格式 (#RRGGBB)
   - 数值字段检查范围（如不透明度 0-1，模糊 0-50px 等）
   - 枚举字段验证（如 windowControlsPos: 'left'|'right'|'hidden'）
   - 错误信息在 JSON 模式下即时显示

4. **只读模式**
   - 内置主题查看详情时为只读模式
   - 所有输入字段禁用
   - JSON 模式文本区域禁用编辑
   - 仅展示"关闭"按钮
   - 复制按钮隐藏在只读模式

5. **按钮逻辑简化**
   - 内置主题：选择 → 详情
   - 自定义主题：选择 → 编辑 → 删除

### 使用流程
1. 打开主题管理器
2. 内置主题点击"详情"查看（只读），自定义主题点击"编辑"修改
3. 选择 GUI 或 JSON 模式
4. JSON 模式可使用"复制 JSON"按钮复制配置
5. JSON 模式修改后点击"应用 JSON 配置"
6. 点击"保存"（编辑模式）或"关闭"（查看模式）

### 相关 Hook 和处理
- `useThemeEditor`: 主题编辑逻辑，`viewTheme` 方法用于打开查看/编辑模式
- `useModalManager`: `themeDetailModal` 状态管理
- `useAppHandlers`: `handleViewTheme` 处理函数调用 `themeEditor.viewTheme`

## 交互建议
- 在处理 UI 问题时，优先考虑 Mantine 的组件属性。
- 在处理后端逻辑时，注意 Wails 运行时的 context 生命周期。
- 涉及 B站 API 时，参考 `internal/services/` 中已有的请求模式。
- JSON 验证需要保证所有颜色值都是有效的十六进制格式，所有数值都在指定范围内。
## 最近更新（UI/UX 优化）

### ThemeDetailModal 优化
- **固定高度容器**: GUI 和 JSON 编辑面板都使用 `ScrollArea` 包装，高度固定为 500px
  - `marginRight: -16, paddingRight: 16` 用于处理 ScrollArea 的 margin 问题
  - 保证两种模式的视觉一致性和更好的空间利用
  
- **复制功能**: JSON 模式添加"复制 JSON"按钮
  - 使用 `navigator.clipboard.writeText()` 实现剪贴板操作
  - 按钮显示图标状态反馈：`copied ? <Check> : <Copy>`
  - 复制成功时显示绿色通知，2 秒后自动复位
  - 仅在非只读模式下显示

- **JSON 高度调整**: minRows 从 15 增加到 20，提供更好的初始显示

### ThemeManagerModal 优化
- **按钮逻辑条件化**:
  - 内置主题 (`theme.isReadOnly`): 仅显示"选择"和"详情"按钮
  - 自定义主题 (!theme.isReadOnly): 显示"选择"、"编辑"和"删除"按钮
  - 使用条件渲染而非禁用状态，更清晰的视觉反馈

### 相关代码片段
```tsx
// 复制 JSON 处理
const handleCopyJson = useCallback(() => {
    navigator.clipboard.writeText(jsonText).then(() => {
        setCopied(true);
        notifications.show({
            message: "已复制到剪贴板",
            color: "green",
            autoClose: 1500,
        });
        setTimeout(() => setCopied(false), 2000);
    });
}, [jsonText]);

// 固定高度 ScrollArea
<ScrollArea style={{ height: "500px", marginRight: -16, paddingRight: 16 }}>
    {/* 内容 */}
</ScrollArea>

// 按钮条件渲染
{theme.isReadOnly && <Button>详情</Button>}
{!theme.isReadOnly && <>
    <Button>编辑</Button>
    <Button color="red">删除</Button>
</>}
```