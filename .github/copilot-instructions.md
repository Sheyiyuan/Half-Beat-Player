# Half Beat Player - GitHub Copilot 指令

## 项目概述

Half Beat Player 是基于 Bilibili API 的桌面音乐播放器（Wails v2），支持跳过片头片尾。

- 架构：Wails v2（Go 后端 + TS/React 前端）
- 数据：SQLite（GORM）
- 关键能力：扫码登录、BV 解析、音频代理播放、歌单管理、多P视频支持

## 技术栈

### 后端（Go）
- Go 1.22+，错误处理用 `fmt.Errorf("context: %w", err)`
- API：`internal/services/service.go` 定义方法并通过 Wails 绑定
- 模型：`internal/models/`

### 前端（TS/React）
- React 18 + TypeScript 5.3+
- UI：Mantine v8
- 状态：分离式Context架构（PlayerContext、ThemeContext、UIContext、DataContext）
- 图标：`lucide-react` 或 `@tabler/icons-react`

## 性能优化架构

### 状态管理（已优化）
- **分离式Context**：将单一巨型Context拆分为4个独立Context
- **状态隔离**：播放器、主题、UI、数据状态互不影响
- **选择器模式**：组件只订阅需要的状态片段
```typescript
// 推荐：使用细粒度选择器
const currentSong = useCurrentSong();
const themeColor = useThemeColor();

// 兼容：原有API仍可用
const [store, actions] = useAppStore();
```

### 组件优化（已优化）
- **React.memo**：关键组件使用memo和自定义比较函数
- **懒加载**：弹窗组件使用React.lazy()按需加载
- **条件渲染**：未打开的弹窗完全不渲染
- **硬件加速**：动画使用transform3d和will-change

### 弹窗系统（已优化）
- **代码分割**：每个弹窗独立chunk，主bundle减少60%
- **按需加载**：只在打开时加载弹窗代码
- **智能渲染**：无弹窗时跳过重新渲染

## 核心约定

1. 修改后端 Service 导出方法后，运行 `wails generate module` 更新前端绑定
2. 音频播放必须走本地代理（`internal/proxy/`）
3. 图片资源使用 `useImageProxy` Hook 处理（Windows 兼容性）
4. 长文本使用 `useScrollingText` Hook 或 `ScrollingText` 组件（已优化防抖和缓存）
5. 顶栏拖拽：使用 `--wails-draggable: drag`，交互元素用 `--wails-draggable: no-drag`

## 多P视频系统

### 数据模型
- Song 结构包含：`PageNumber`、`PageTitle`、`VideoTitle`、`TotalPages`
- 支持结构：`PageInfo`、`CompleteVideoInfo`

### 命名规则
- 单P视频：直接使用主标题
- 多P视频：`主标题P序号 分P标题`（如："音乐合集P1 第一首歌"）

### 核心函数
- `getCompleteVideoInfo(bvid)`: 获取视频完整信息包括所有分P
- `formatSongName()`: 智能格式化歌曲名称
- `SearchBVID()`: 为每个分P创建独立的Song条目

## 性能最佳实践

### 组件开发
```typescript
// ✅ 推荐：使用React.memo优化
const MyComponent = memo(Component, (prev, next) => {
    return prev.key === next.key; // 自定义比较
});

// ✅ 推荐：使用useCallback稳定引用
const handleClick = useCallback(() => {
    // 处理逻辑
}, [dependencies]);

// ✅ 推荐：使用useMemo缓存计算
const expensiveValue = useMemo(() => {
    return computeExpensiveValue(props);
}, [props]);
```

### 弹窗开发
```typescript
// ✅ 推荐：使用懒加载
const MyModal = lazy(() => import("./MyModal"));

// ✅ 推荐：条件渲染包装
<LazyModalWrapper opened={isOpen}>
    <MyModal />
</LazyModalWrapper>
```

### 动画优化
```css
/* ✅ 推荐：启用硬件加速 */
.animated-element {
    transform: translate3d(0, 0, 0);
    will-change: transform;
    contain: layout style paint;
}
```

## 最近更新（2026-01-10）

- **性能优化**：三阶段系统性优化，重新渲染减少60-80%，主bundle减少60%
- **多P视频支持**：完整支持B站多P视频，智能命名格式
- **图标系统**：Windows PNG优化，macOS ICNS支持
- **滚动文本**：播放控件增强滚动效果，防抖和缓存优化
- **图片代理**：解决Windows B站图片加载问题

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

| 错误                         | 常见原因                         | 解决方案                |
| ---------------------------- | -------------------------------- | ----------------------- |
| `Can't find variable: xxx` | 使用了字段但忘了在参数解构中取出 | 检查函数签名/解构并补齐 |
| `undefined`                | 初始化/默认值遗漏                | 补齐默认值与 apply 逻辑 |

最易出错的地方：**参数解构**。

## 重要注意事项

### 主题系统踩坑
- 正确：主题选择/编辑后调用 `store.actions.applyTheme(theme)`，它会同步 UI 并写入 `localStorage`（`half-beat.currentThemeId`）
- 错误：只更新 UI setters / 只更新 `currentThemeId`，可能导致下次启动回退

### 资源管理
- 应用关闭时正确停止代理与关闭 DB
- 并发：谨慎使用 goroutine；确保 context 可取消；后台任务尽量 best-effort，不阻塞播放

### Windows 兼容性
- 图片资源（头像、封面）因 Referer/CORS 限制无法直接加载，必须使用 `useImageProxy` Hook
- 音频播放不要直接把 B 站直链塞给 `<audio>`，必须走本地代理