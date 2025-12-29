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
- **主题 colorScheme 字段**: 支持亮色/暗色主题切换。
- **禁用按钮样式优化**: 根据亮色/暗色主题自动调整禁用状态下的按钮外观。

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
## 最近更新（亮色/暗色主题配置恢复 & 禁用按钮样式优化）

### 主题配置系统重构
- **Backend 层改动** (`internal/models/models.go`):
  - 将 Theme 模型从 30+ 个类型化字段改为简化的 5 字段设计
  - 字段: `id`, `name`, `data` (JSON), `isDefault`, `isReadOnly`
  - 后端不强制验证 schema，允许前端灵活定义配置字段
  - 优点: 新增字段无需修改数据库迁移脚本

- **Frontend 类型系统** (`frontend/src/types.ts`):
  - 创建 `convertTheme()` 函数将 JSON data 反序列化为完整的 Theme 对象
  - Theme 接口扩展 28 个可选字段对应所有配置项
  - 所有字段都有合理的默认值，避免 undefined 问题

- **主题序列化/反序列化**:
  - **保存主题**: `submitTheme()` 中构建完整的 themeData 对象，JSON.stringify 后存储在 data 字段
  - **加载主题**: `convertTheme()` 解析 data JSON，展平到 Theme 对象供前端使用
  - **缓存主题**: 本地缓存存储转换后的完整 Theme 对象，避免重复反序列化

### colorScheme 字段（亮色/暗色主题选择）
- **新增字段**: `colorScheme: 'light' | 'dark'`
- **默认值**: 'dark'（用户未选择时）
- **DEFAULT_THEMES**:
  - 亮色主题: `colorScheme: 'light'`, 亮色背景 #f8fafc, 白色面板
  - 暗色主题: `colorScheme: 'dark'`, 深色背景 #210b13, 深色面板
- **Mantine 集成**: 主题应用时根据 colorScheme 调用 `setColorScheme()` 自动切换 Mantine 配色
- **UI 组件**: ThemeDetailModal/ThemeEditorModal 中使用 SegmentedControl 提供亮/暗选项

### 禁用按钮样式优化（CSS）
在 `index.css` 中针对亮色/暗色主题区分禁用状态:
```css
/* 亮色主题禁用状态 */
:not([data-mantine-color-scheme="dark"]) button:disabled {
    background-color: #e8e8e8 !important;
    color: #b0b0b0 !important;
}

/* 暗色主题禁用状态 */
[data-mantine-color-scheme="dark"] button:disabled {
    background-color: rgba(100, 100, 100, 0.5) !important;
    color: #888888 !important;
}
```
- 确保禁用元素在两种主题下都有足够的对比度
- Slider、输入框等原生 Mantine 组件自动适配

### 关键代码路径
1. **主题应用**: `App.tsx` applyThemeToUi() → setColorScheme() + 25 个状态设置
2. **主题编辑**: `useThemeEditor.ts` editTheme/submitTheme → JSON 序列化
3. **主题加载**: `useAppLifecycle.ts` GetThemes() → convertThemes() → 前端渲染
4. **Context**: `ThemeContext.tsx` 维护 colorScheme 状态 + applyTheme() 处理
5. **组件**: ThemeDetailModal/ThemeEditorModal 提供 GUI 和 JSON 双模式编辑

### 数据流示例
```
用户选择主题 colorScheme='light'
  → useState(colorSchemeDraft, 'light')
  → submitTheme() 构建 { colorScheme: 'light', ... 其他字段 }
  → JSON.stringify() → Theme.data 存储
  → Backend: CreateTheme/UpdateTheme
  → Frontend: convertTheme(response) 反序列化
  → applyTheme() 调用 setColorScheme('light')
  → Mantine 自动切换亮色配色
  → CSS 选择器 :not([data-mantine-color-scheme="dark"]) 激活
```
  - 创建新工具函数 `getColorSchemeFromBackground()` 在 `frontend/src/utils/color.ts`
  - 使用相对亮度公式判断颜色是否为亮色
  - 在应用主题时自动调用 `setColorScheme()` 更新 Mantine 颜色方案
  - 主题编辑/详情中的 JSON 编辑器也使用相同的颜色方案判断逻辑
  - 确保 UI 库内置的控件（如 Slider、Button 等）能根据面板背景自动显示正确的对比度

### 实现细节
- 颜色判断算法：`brightness = (R*0.299 + G*0.587 + B*0.114) / 1000`，阈值 128
- 支持处理带透明度的颜色值 (#RRGGBBAA)
- Mantine 颜色方案切换只需调用 `setColorScheme('light'|'dark')`
- ThemeDetailModal 中的 JSON 编辑器通过 `getColorSchemeFromBackground()` 动态获取 `colorMode`

## 主题编辑功能（最新更新）
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

## ⚠️ 添加新字段时的关键检查清单

**当添加新的主题配置字段（如 `colorScheme`）时，必须在以下所有位置进行修改**，否则会导致 "Can't find variable" 错误：

### 1. 后端模型层
- [ ] 在 Go 结构体中添加字段（`internal/models/models.go`）
- [ ] 确保字段有正确的 JSON 标签

### 2. 前端类型定义层
- [ ] 在 TypeScript 模型中更新（`frontend/wailsjs/go/models.ts`）
- [ ] 在默认常量中添加字段值（`frontend/src/utils/constants.ts`）
- [ ] 在业务类型中更新（`frontend/src/types.ts`）

### 3. 状态管理层（Context）
- [ ] 在 `ThemeState` 接口中添加（`frontend/src/context/ThemeContext.tsx`）
- [ ] 在 `ThemeActions` 接口中添加 setter 方法
- [ ] 在 Provider 中初始化状态值
- [ ] 在 `applyTheme` 函数中处理新字段
- [ ] 在 Context value 对象中暴露新字段和 setter

### 4. 组件层
- [ ] 在组件 Props 类型定义中添加（`ThemeDetailModalProps`）
- [ ] ⚠️ **关键**：在组件函数参数解构中提取字段
- [ ] 在组件内部逻辑中使用字段

### 5. Hook 层
- [ ] 在 Hook 配置接口中添加字段定义
- [ ] ⚠️ **关键**：在 Hook 函数参数解构中添加字段
- [ ] 在 Hook 内部逻辑中使用字段

### 6. 调用 Hook 的地方
- [ ] ⚠️ **关键**：在 `App.tsx` 或其他调用处传递实际值

### 7. 模态框组件
- [ ] 在 `AppModalsProps` 接口中添加
- [ ] ⚠️ **关键**：在函数参数解构中添加
- [ ] 将 props 传递给子组件

### 常见错误及解决方案

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| `Can't find variable: colorSchemeDraft` | 在组件/Hook 中使用了字段，但参数解构中没有提取 | 检查函数签名和参数解构，添加缺失字段 |
| `Can't find variable: colorMode` | 使用了已删除的变量或旧变量 | 用新字段替换旧变量引用 |
| 字段显示为 `undefined` | 初始化时遗漏了新字段 | 检查所有初始化点（state、default values、Context value） |

**最易出错的地方**：参数解构！每次在新的函数/组件中使用新字段都必须从参数中显式解构。
## 🔄 前端重构进行中（2025年12月29日启动）

> 📌 **重要**：前端代码进行结构性重构，目标是精简 App.tsx（1103 行 → <500 行）、统一状态管理（3 个 Context → 1 个）、重组 Hook 体系（30+ 导入 → 5-8 导入）

### 重构目标
1. **App.tsx 精简**：从 1103 行精简到 <500 行
2. **状态管理统一**：合并 AppContext、ThemeContext、ModalContext 为单一 AppStore
3. **Hook 体系优化**：将 13 个播放器 Hook 合并为 4 个核心 Hook
4. **Props 规范化**：使用 Store 对象替代 Props Drilling
5. **组件结构清晰**：按功能分组（modals/、layouts/、cards/）

### 重构阶段计划
- **阶段 1**（1-2 天）：创建统一状态管理（AppStore + AppContext + useAppStore）
- **阶段 2**（1-2 天）：合并和重组 Hook 体系
- **阶段 3**（1 天）：精简 App.tsx
- **阶段 4**（1 天）：重新组织组件文件结构
- **阶段 5**（1 天）：Props 规范化和类型完善
- **阶段 6**（1 天）：验证、测试和优化

### 详细指南
📖 **完整重构指南**：见 [FRONTEND_REFACTOR_GUIDE.md](../FRONTEND_REFACTOR_GUIDE.md)

### 关键代码路径变化
重构前后的关键文件变化：

**创建的新文件**：
- `frontend/src/store/types.ts` - Store 类型定义
- `frontend/src/context/AppContext.tsx` - 统一的 AppContext（改造现有）
- `frontend/src/hooks/useAppStore.ts` - 单一数据入口 Hook
- `frontend/src/hooks/ui/useAppInitialize.ts` - 应用初始化 Hook
- `frontend/src/hooks/player/usePlayer.ts` - 合并的播放器 Hook
- `frontend/src/hooks/player/usePlaylist.ts` - 合并的歌单 Hook
- `frontend/src/hooks/player/useAudio.ts` - 合并的音频 Hook
- `frontend/src/types/store.ts` - Store 类型（独立管理）
- `frontend/src/types/components.ts` - 组件 Props 类型（独立管理）
- `frontend/src/components/modals/` - 模态框分组
- `frontend/src/components/layouts/` - 布局分组
- `frontend/src/components/cards/` - 卡片分组

**删除的旧文件**（被新 Hook 替代）：
- `frontend/src/hooks/player/useAudioPlayer.ts`
- `frontend/src/hooks/player/usePlaylist.ts` (重写)
- `frontend/src/hooks/player/usePlaylistActions.ts`
- `frontend/src/hooks/player/usePlaylistPersistence.ts`
- `frontend/src/hooks/player/useAudioEvents.ts`
- `frontend/src/hooks/player/useAudioInterval.ts`
- `frontend/src/hooks/player/useAudioSourceManager.ts`
- `frontend/src/hooks/player/usePlaySong.ts`
- `frontend/src/hooks/player/usePlaybackControls.ts`
- `frontend/src/hooks/player/useSkipIntervalHandler.ts`
- `frontend/src/hooks/player/usePlayModes.ts`

**改造的重点文件**：
- `frontend/src/App.tsx` - 从 1103 行精简到 <500 行
- `frontend/src/context/AppContext.tsx` - 从分散的 useContext 改造为统一的 Store 提供者
- `frontend/src/main.tsx` - 添加 AppProvider 包装
- `frontend/src/components/AppModals.tsx` - 接收 Store 对象而非 50+ props
- `frontend/src/components/AppPanels.tsx` - 同上

### 新的数据流
重构后的单向数据流（Flux 风格）：

```
┌─────────────────────────────────────┐
│        useAppStore Hook             │
│  (单一数据入口，所有组件都用它)      │
└────────────┬────────────────────────┘
             │
             ├─ store 对象
             │  ├─ player 状态
             │  ├─ theme 状态
             │  ├─ modals 状态
             │  ├─ ui 状态
             │  └─ data 状态
             │
             └─ actions 对象
                ├─ 播放器操作
                ├─ 主题操作
                ├─ 模态框操作
                ├─ UI 操作
                └─ 数据操作
```

### 重构检查清单
在本文档持续更新重构进度：

**已完成**：
- [x] 评估现有代码结构
- [x] 制定重构方案
- [x] 创建重构指南文档

**进行中**：
- [ ] 阶段 1：创建 Store + Context
- [ ] 阶段 2：合并 Hook
- [ ] 阶段 3：精简 App.tsx
- [ ] 阶段 4：重组组件
- [ ] 阶段 5：类型完善
- [ ] 阶段 6：验证优化

### 重构期间的开发提示
- 每完成一个阶段，立即提交 Git（含清晰的 commit message）
- 每次修改后运行 `pnpm build` 确保构建成功
- 每次修改后运行 `wails dev` 验证功能
- 如遇到问题，参考 [FRONTEND_REFACTOR_GUIDE.md](../FRONTEND_REFACTOR_GUIDE.md) 的常见陷阱部分
- 重构完成后**必须更新此文档**，更新内容应移至"重构后的项目架构"部分