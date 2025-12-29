# 前端重构 - 快速参考卡

> 打印或放到显示器旁边，方便快速查阅

## 🎯 阶段概览

```
┌─────────────────────────────────────────────────────────────┐
│ 阶段 1：创建 Store（1-2 天）                                 │
│ ├─ 创建 store/types.ts                                       │
│ ├─ 创建 context/AppContext.tsx（改造现有）                   │
│ ├─ 创建 hooks/useAppStore.ts                                │
│ └─ 更新 main.tsx 使用 AppProvider                            │
├─────────────────────────────────────────────────────────────┤
│ 阶段 2：合并 Hook（1-2 天）                                   │
│ ├─ 合并播放器 Hook（13→4）                                    │
│ ├─ 整理特性 Hook                                             │
│ ├─ 创建 useAppInitialize                                    │
│ └─ 删除旧 Hook 文件                                          │
├─────────────────────────────────────────────────────────────┤
│ 阶段 3：精简 App.tsx（1 天）                                  │
│ ├─ 使用 useAppStore 替代 45+ useState                        │
│ ├─ 迁移初始化逻辑到 Hook                                     │
│ ├─ 简化 Props 结构                                           │
│ └─ 目标：1103 行 → <500 行                                    │
├─────────────────────────────────────────────────────────────┤
│ 阶段 4：重组组件（1 天）                                      │
│ ├─ 创建 components/modals/                                  │
│ ├─ 创建 components/layouts/                                 │
│ ├─ 创建 components/cards/                                   │
│ └─ 创建 components/common/                                  │
├─────────────────────────────────────────────────────────────┤
│ 阶段 5：类型完善（1 天）                                      │
│ ├─ 创建 types/store.ts                                      │
│ ├─ 创建 types/components.ts                                 │
│ ├─ 创建 types/models.ts                                     │
│ └─ 规范 Props 接口                                           │
├─────────────────────────────────────────────────────────────┤
│ 阶段 6：验证（1 天）                                          │
│ ├─ 功能测试（18 项清单）                                      │
│ ├─ 性能检查（帧率、渲染时间）                                 │
│ ├─ 代码审查（TypeScript、ESLint）                            │
│ └─ 文档更新                                                 │
└─────────────────────────────────────────────────────────────┘
```

## 📦 文件映射

### 新增文件

| 文件                           | 用途                | 优先级 |
| ------------------------------ | ------------------- | ------ |
| `store/types.ts`               | Store 类型定义      | 🔴      |
| `context/AppContext.tsx`       | 统一 Context 提供者 | 🔴      |
| `hooks/useAppStore.ts`         | Store 访问 Hook     | 🔴      |
| `hooks/ui/useAppInitialize.ts` | 应用初始化          | 🟠      |
| `hooks/player/usePlayer.ts`    | 合并播放器 Hook     | 🟠      |
| `hooks/player/usePlaylist.ts`  | 合并歌单 Hook       | 🟠      |
| `hooks/player/useAudio.ts`     | 合并音频 Hook       | 🟠      |
| `utils/appHelpers.ts`          | App 辅助函数        | 🟡      |
| `types/store.ts`               | Store 类型（独立）  | 🟡      |
| `types/components.ts`          | 组件 Props 类型     | 🟡      |
| `components/modals/index.ts`   | 模态框分组导出      | 🟡      |
| `components/layouts/index.ts`  | 布局分组导出        | 🟡      |
| `components/cards/index.ts`    | 卡片分组导出        | 🟡      |

### 删除文件（被新 Hook 替代）

```
frontend/src/hooks/player/
  ├─ useAudioPlayer.ts          ❌ → usePlayer.ts
  ├─ usePlaylistActions.ts       ❌ → usePlaylist.ts
  ├─ usePlaylistPersistence.ts   ❌ → usePlaylist.ts
  ├─ useAudioEvents.ts           ❌ → useAudio.ts
  ├─ useAudioInterval.ts         ❌ → useAudio.ts
  ├─ useAudioSourceManager.ts    ❌ → useAudio.ts
  ├─ usePlaySong.ts             ❌ → usePlayer.ts
  ├─ usePlaybackControls.ts      ❌ → usePlayer.ts
  ├─ useSkipIntervalHandler.ts   ❌ → useAudio.ts
  └─ usePlayModes.ts            ❌ → usePlaybackMode.ts
```

### 改造文件（大幅修改）

| 文件                       | 改动              | 影响 |
| -------------------------- | ----------------- | ---- |
| `App.tsx`                  | 1103 行 → <500 行 | 🔴    |
| `main.tsx`                 | 添加 AppProvider  | 🔴    |
| `context/AppContext.tsx`   | 合并三个 Context  | 🟠    |
| `components/AppModals.tsx` | Props 对象改造    | 🟠    |
| `components/AppPanels.tsx` | Props 对象改造    | 🟠    |

## 🔧 代码模板

### 阶段 1：Store 类型定义

```typescript
// store/types.ts
export interface PlayerState {
    queue: Song[];
    currentIndex: number;
    currentSong: Song | null;
    isPlaying: boolean;
    progress: number;
    duration: number;
    volume: number;
    playMode: PlayMode;
}

export interface AppStore {
    player: PlayerState;
    theme: ThemeState;
    modals: ModalState;
    ui: UIState;
    data: DataState;
    actions: AppActions;
}
```

### 阶段 2：Hook 使用模式

```typescript
// 在组件中使用
const [store, actions] = useAppStore();
const { currentSong, isPlaying } = store.player;
const { play, pause } = actions;

// 或者使用选择器 Hook
const playerState = usePlayerState();
const themeState = useThemeState();
```

### 阶段 3：简化后的 App.tsx 骨架

```typescript
const App: React.FC = () => {
    // 1. 获取统一 Store
    const [store, actions] = useAppStore();
    
    // 2. 初始化
    useAppInitialize();
    
    // 3. 应用级 Hooks
    const player = usePlayer();
    const playlist = usePlaylist();
    
    // 4. 计算派生值
    const styles = useMemo(() => ({ /* ... */ }), [store]);
    
    // 5. Props 组装
    const appModalsProps = { store, actions, handlers };
    const appPanelsProps = { store, actions, player, handlers };
    
    // 6. 渲染
    return (
        <MantineProvider>
            <AppModals {...appModalsProps} />
            <AppPanels {...appPanelsProps} />
        </MantineProvider>
    );
};
```

## ⚠️ 常见错误

| 错误             | 原因                    | 修复                                  |
| ---------------- | ----------------------- | ------------------------------------- |
| 组件无法获取状态 | 没有在 useAppStore 解构 | 添加 `const [store] = useAppStore()`  |
| 状态更新不生效   | 没有调用 actions        | 使用 `actions.setSong(song)`          |
| Props 类型错误   | Props 接口不匹配        | 检查 Props 接口定义                   |
| 过度渲染         | 订阅了整个 store        | 使用选择器 Hook 如 `usePlayerState()` |
| 闭包陷阱         | useEffect 依赖项缺失    | 添加所有外部变量到依赖项              |

## ✅ 每日检查清单

### 工作开始前
- [ ] 从 Git 拉取最新代码
- [ ] 查看 FRONTEND_REFACTOR_GUIDE.md 今天的任务
- [ ] 在本文档记录进度

### 工作进行中
- [ ] 每小时提交一次进度（git commit）
- [ ] 定期运行 `pnpm build` 检查构建
- [ ] 定期运行 `wails dev` 验证功能

### 工作结束前
- [ ] 运行完整测试：`pnpm build`
- [ ] 运行 lint：`pnpm eslint src/`
- [ ] Git 提交当日工作成果
- [ ] 更新进度文档

## 🔍 验证命令

```bash
# 构建检查
pnpm build

# 类型检查
pnpm tsc --noEmit

# Lint 检查
pnpm eslint src/

# 代码格式化
pnpm prettier --write src/

# 运行开发服务器
wails dev

# 检查文件行数
wc -l frontend/src/App.tsx
find frontend/src/hooks/player -name "*.ts" | wc -l
find frontend/src/components -name "*.tsx" | wc -l
```

## 📊 进度追踪

### 检查项

```
□ 阶段 1：Store 创建
  □ store/types.ts 完成
  □ context/AppContext.tsx 完成
  □ hooks/useAppStore.ts 完成
  □ main.tsx 集成 AppProvider
  □ 功能测试通过

□ 阶段 2：Hook 合并
  □ usePlayer.ts 完成
  □ usePlaylist.ts 完成
  □ useAudio.ts 完成
  □ useAppInitialize.ts 完成
  □ 旧 Hook 文件删除
  □ hooks/index.ts 更新
  □ 功能测试通过

□ 阶段 3：App.tsx 精简
  □ App.tsx 重写（<500 行）
  □ 所有 useState 移除
  □ 所有逻辑迁移到 Hook
  □ 功能测试通过

□ 阶段 4：组件重组
  □ modals/ 目录创建
  □ layouts/ 目录创建
  □ cards/ 目录创建
  □ index.ts 创建
  □ 导入路径更新

□ 阶段 5：类型完善
  □ types/store.ts 创建
  □ types/components.ts 创建
  □ Props 接口规范化
  □ TypeScript 无错误

□ 阶段 6：验证优化
  □ 功能测试全部通过
  □ 性能检查通过
  □ 代码审查通过
  □ 文档更新
```

## 📞 快速求助

### 遇到问题？

1. **查阅指南**：[FRONTEND_REFACTOR_GUIDE.md](FRONTEND_REFACTOR_GUIDE.md)
2. **检查常见陷阱**：见上面的"常见错误"表
3. **查看代码模板**：见上面的"代码模板"章节
4. **搜索相关代码**：`grep -r "useAppStore" src/`

### 最常见的问题

**Q: App.tsx 改动后报错 "Cannot read property 'xxx' of undefined"**  
A: 检查 store 对象的初始值是否完整，所有字段都应该在 `initialStore` 中定义

**Q: 组件收不到最新的状态**  
A: 检查是否正确调用了 actions，`actions.setSong(song)` 而不是 `setSong(song)`

**Q: 导入路径一直出错**  
A: 删除旧 Hook 后要更新所有导入语句，搜索 `from './hooks/player/` 逐一修改

## 📝 记录模板

在每天工作结束时填写：

```markdown
## 2025-12-XX 进度记录

### 完成的工作
- [ ] 任务 1
- [ ] 任务 2

### 遇到的问题
- 问题描述
- 解决方案

### 明天计划
- [ ] 任务 1
- [ ] 任务 2

### 代码提交
- Commit: xxxxx - 描述
- Commit: xxxxx - 描述

### 验证状态
- [x] pnpm build 成功
- [x] wails dev 启动成功
- [x] 功能测试通过
```

---

**当前时间**：2025 年 12 月 29 日  
**预计完成**：2025 年 1 月 4 日  
**总工作量**：5-7 个工作日

祝重构顺利！🚀
