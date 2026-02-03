# Half Beat Player - Agent 开发指南

## 项目概述

Half Beat Player 是一个基于 **Wails v2**（Go 后端 + TypeScript/React 前端）的 Bilibili 音频播放器。核心功能包括二维码登录、BV 号解析、音频代理流播放、歌单管理、多 P 视频支持以及音量补偿（全局 + 单曲）。

**版本：** 1.1.0  
**主要语言：** TypeScript（19,404 行代码，分布于 110 个文件）  
**架构：** Wails v2 混合应用（Go 1.22+ 后端，React 18 前端）

---

## 技术栈

### 后端（Go）
- **语言：** Go 1.22+
- **数据库：** SQLite（使用 GORM）
- **错误处理：** 遵循 `fmt.Errorf("context: %w", err)` 约定
- **API 暴露：** `internal/services/service.go` 中定义的方法通过 Wails 绑定
- **模型：** `internal/models/`（GORM 实体）

### 前端（TypeScript/React）
- **框架：** React 18 + TypeScript 5.3+
- **UI 库：** Mantine v8
- **状态管理：** 分离式 Context 架构（PlayerContext、ThemeContext、UIContext、DataContext）
- **图标：** `lucide-react` 或 `@tabler/icons-react`
- **构建工具：** Vite（使用 SWC 插件）
- **TypeScript 配置：** 启用严格模式

---

## 构建与开发命令

### 开发
```bash
# 安装前端依赖
cd frontend && pnpm install

# 启动开发模式（从项目根目录）
cd .. && wails dev
```

### 构建
```bash
# 生产环境构建
wails build

# 修改 Go 服务方法后生成前端绑定
wails generate module
```

### 代码检查
```bash
# 前端代码检查
cd frontend && pnpm run lint
```

### 测试
当前未配置自动化测试套件。

---

## 代码风格与约定

### 导入
- **前端：** 使用从 `frontend/src/` 开始的绝对路径导入，避免使用相对路径 `../` 链接
- **后端：** 遵循标准 Go 导入约定

### 格式化
- **前端：** 配置了 ESLint + Prettier（检查 `frontend/.eslintrc` 和 `.prettierrc`）
- **后端：** 使用 Go 标准格式化工具（`go fmt`）

### TypeScript
- **严格模式：** 已启用（`tsconfig.json` 中 `strict: true`）
- **禁止忽略错误：** 不允许使用 `as any`、`@ts-ignore` 或 `@ts-expect-error`
- **优先显式类型：** 特别是函数参数和返回值

### 命名约定
- **组件：** 使用 PascalCase（如 `PlayerBar.tsx`）
- **Hooks：** 使用 camelCase 并以 `use` 开头（如 `useAudioPlayer.ts`）
- **文件：** 文件名与组件/Hook 名称完全一致
- **变量/函数：** 使用 camelCase

### 错误处理
- **后端：** 使用上下文包装错误：`return fmt.Errorf("load settings: %w", err)`
- **前端：** 异步操作使用 try-catch，错误记录到控制台，并显示用户友好的通知

---

## 架构模式

### 状态管理（分离式 Context）
```typescript
// ✅ 正确：使用细粒度选择器
const currentSong = useCurrentSong();
const themeColor = useThemeColor();

// ❌ 避免：订阅整个 store（会导致不必要的重新渲染）
const [store, actions] = useAppStore(); // 仅在需要多个值时使用
```

**Context 分离：**
- `PlayerContext`：播放状态、队列、控制
- `ThemeContext`：主题颜色、外观设置
- `UIContext`：弹窗可见性、UI 特定标志
- `DataContext`：歌曲、收藏、缓存数据

### 性能优化
- **React.memo：** 关键组件使用 `memo` 并自定义比较函数
- **useCallback：** 稳定子组件的回调引用
- **useMemo：** 缓存高开销计算
- **懒加载：** 弹窗使用 `React.lazy()` 进行代码分割
- **条件渲染：** 未打开的弹窗完全卸载

示例：
```typescript
const MyComponent = memo(({ song }: Props) => {
  // 组件逻辑
}, (prev, next) => prev.song.id === next.song.id);
```

### 组件结构
```
frontend/src/
├── components/       # UI 组件（30 个文件）
│   ├── layouts/      # 布局容器（TopBar、MainLayout、ControlsPanel）
│   ├── modals/       # 弹窗对话框（懒加载）
│   ├── cards/        # 卡片组件
│   └── ui/           # 可复用的 UI 基础组件
├── hooks/            # 业务逻辑（55 个文件）
│   ├── player/       # 音频播放相关 Hooks
│   ├── data/         # 数据获取/持久化
│   ├── features/     # 特性相关逻辑
│   └── ui/           # UI 特定 Hooks
├── context/          # 全局状态提供者
├── utils/            # 工具函数
└── types.ts          # 共享 TypeScript 类型
```

---

## 核心约定

### 1. Wails 绑定
修改 `internal/services/` 中导出的 Go 方法后，**务必**重新生成绑定：
```bash
wails generate module
```
这会更新 `frontend/wailsjs/` 中的 TypeScript 绑定。

### 2. 音频播放
- **必须使用本地代理：** 所有音频流通过 `internal/proxy/` 路由（处理 B 站 Referer 限制）
- **禁止直接使用 B 站 URL：** `<audio src="https://bilibili.com/...">` 会因 CORS/防盗链失败

### 3. 图片资源
- **Windows 兼容性：** 使用 `useImageProxy` Hook 处理头像/封面（解决 B 站 Referer/CORS 问题）
- **示例：**
```typescript
const { proxyUrl } = useImageProxy(originalImageUrl);
return <img src={proxyUrl} />;
```

### 4. 长文本显示
使用 `useScrollingText` Hook 或 `ScrollingText` 组件（已优化防抖和缓存）：
```typescript
const { scrollingText } = useScrollingText(songTitle, isPlaying);
```

### 5. 窗口拖拽区域
- **可拖拽：** `style={{ '--wails-draggable': 'drag' }}`
- **交互元素：** `style={{ '--wails-draggable': 'no-drag' }}`（按钮、输入框）

### 6. 音频音量补偿
- **优先使用 WebAudio：** 使用 `GainNode` 实现音量补偿（参考 `useAudioPlayer`）
- **延迟初始化：** 首次播放时创建 `AudioContext`，避免 Wails/Linux WebKit 问题
- **公式：** `gain = 10^(dB / 20)`
- **回退：** 如果 WebAudio 不可用，使用 `audio.volume`（限制在 0-1）

### 7. Wails 运行时时序
- **异步注入：** `window.wails.Callback` 可能在启动时不可用
- **等待就绪：** 使用 `frontend/src/utils/wails.ts` 中的工具函数确保运行时就绪后再调用

---

## 音量补偿系统

### 配置字段（PlayerSetting.config）
- `volumeCompensationDb`：全局默认补偿（单位：dB）
- `songVolumeOffsets`：单曲覆盖（`Record<string, number>`，songId → dB）

**优先级：** 单曲覆盖 > 全局默认  
**应用：** 在音频播放链中通过 `GainNode` 应用

---

## 多 P 视频支持

### 数据模型
- `Song` 字段：`PageNumber`、`PageTitle`、`VideoTitle`、`TotalPages`
- 支持的结构：`PageInfo`、`CompleteVideoInfo`

### 命名规则
- **单 P：** 直接使用主标题
- **多 P：** 格式化为 `主标题P{序号} {分 P 标题}`（如 "音乐合集P1 第一首歌"）

### 核心函数
- `getCompleteVideoInfo(bvid)`：获取视频的所有分 P
- `formatSongName()`：智能格式化歌曲名称
- `SearchBVID()`：为每个分 P 创建独立的 `Song` 条目

---

## 性能最佳实践

### 组件开发
```typescript
// ✅ 使用 React.memo 优化频繁重新渲染的组件
const PlayerCard = memo(({ song }: Props) => {
  return <div>{song.title}</div>;
}, (prev, next) => prev.song.id === next.song.id);

// ✅ 使用 useCallback 稳定回调引用
const handlePlay = useCallback(() => {
  playSong(currentSong);
}, [currentSong, playSong]);

// ✅ 使用 useMemo 缓存高开销计算
const sortedSongs = useMemo(() => 
  songs.sort((a, b) => a.title.localeCompare(b.title)),
  [songs]
);
```

### 弹窗开发
```typescript
// ✅ 懒加载弹窗组件
const SettingsModal = lazy(() => import('./SettingsModal'));

// ✅ 条件渲染包装
<Suspense fallback={<Loader />}>
  {settingsOpen && <SettingsModal />}
</Suspense>
```

### 动画优化
```css
/* ✅ 启用硬件加速 */
.animated {
  transform: translate3d(0, 0, 0);
  will-change: transform;
  contain: layout style paint;
}
```

---

## 添加新配置字段

在 `PlayerSetting.config` 或主题设置中添加字段时，需更新 **所有** 以下位置：

### 1. 后端模型
- [ ] 在 Go 结构体中添加字段（`internal/models/models.go`）
- [ ] 添加 JSON 标签：`json:"fieldName"`
- [ ] 如果字段属于 `PlayerSetting.config`，在默认配置中补充（`internal/services/settings.go`）

### 2. 前端类型
- [ ] `frontend/wailsjs/go/models.ts`（通过 `wails generate module` 重新生成）
- [ ] `frontend/src/utils/constants.ts`
- [ ] `frontend/src/types.ts`

### 3. 状态管理
- [ ] 如果字段参与 UI 状态：更新 Context 提供者中的 store/apply 逻辑

### 4. 组件
- [ ] 更新 Props 接口
- [ ] **关键：** 在函数参数中显式解构新字段
```typescript
// ❌ 错误：字段存在但未解构 → "Can't find variable"
function MyComponent({ song }: Props) { 
  return <div>{newField}</div>; // ❌ newField 未定义
}

// ✅ 正确：显式解构
function MyComponent({ song, newField }: Props) {
  return <div>{newField}</div>;
}
```

### 5. Hooks
- [ ] 更新 Hook 参数/返回类型
- [ ] **关键：** 在 Hook 函数签名中解构新字段

**常见错误：**
| 错误                       | 原因              | 解决方案                      |
| -------------------------- | ----------------- | ----------------------------- |
| `Can't find variable: xxx` | 使用字段但未解构  | 在参数解构中添加              |
| `undefined`                | 初始化/默认值遗漏 | 在配置/apply 逻辑中补充默认值 |

---

## 关键警告

### 主题系统
- **正确：** 选择/编辑主题后调用 `store.actions.applyTheme(theme)`（同步 UI 并保存到 `localStorage`）
- **错误：** 仅更新 UI setter 或 `currentThemeId` → 主题无法在重启后持久化

### 资源管理
- **应用关闭：** 正确停止代理并关闭数据库连接
- **并发：** 谨慎使用 goroutine；确保 context 可取消；避免阻塞播放

### Windows 兼容性
- **图片：** 头像/封面因 Referer/CORS 限制加载失败 → **必须**使用 `useImageProxy`
- **音频：** 直接使用 B 站 URL 失败 → **必须**通过 `internal/proxy/` 代理

---

## 最近更新（2026-01-10）

- **性能优化：** 三阶段系统优化（重新渲染减少 60-80%，主 bundle 减少 60%）
- **多 P 视频支持：** 完整支持 B 站多 P 视频，智能命名
- **图标系统：** Windows PNG 优化，macOS ICNS 支持
- **滚动文本：** 增强播放控件的滚动效果
- **图片代理：** 修复 Windows B 站图片加载问题

---

## 项目结构参考

```
.
├── internal/              # Go 后端
│   ├── db/                # 数据库初始化
│   ├── models/            # GORM 模型
│   ├── proxy/             # 音频代理服务器
│   └── services/          # 业务逻辑（登录、播放、歌单等）
├── frontend/              # React 前端
│   ├── src/
│   │   ├── components/    # UI 组件（30 个文件）
│   │   ├── hooks/         # 自定义 Hooks（55 个文件）
│   │   ├── context/       # 状态提供者
│   │   ├── utils/         # 工具函数
│   │   └── types.ts       # TypeScript 类型
│   └── wailsjs/           # 自动生成的 Wails 绑定
├── scripts/               # 构建/打包脚本
├── build/                 # 平台特定配置
└── main.go                # 应用入口
```

---

## 其他资源

- **Wails 文档：** https://wails.io/docs
- **Mantine v8 文档：** https://mantine.dev
- **React 文档：** https://react.dev
- **GORM 文档：** https://gorm.io

---

## 开发工作流

1. **前端修改：** 修改 `frontend/src/` 中的文件，通过 `wails dev` 热重载
2. **后端修改：** 修改 Go 文件，重启 `wails dev`，如果服务方法有变更，运行 `wails generate module`
3. **生产构建：** `wails build`（输出到 `build/bin/`）
4. **分发打包：** 使用 `scripts/` 目录中的平台特定脚本

---

**此指南适用于在此代码库中操作的 AI 编码代理。严格遵循这些约定以保持代码质量和一致性。**
