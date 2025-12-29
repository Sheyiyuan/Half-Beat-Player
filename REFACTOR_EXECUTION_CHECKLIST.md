# 前端重构 - 执行清单

> 📋 重构前必读，完成每一步再进行下一步

## ✅ 重构前准备

### 环境检查
- [ ] Node.js 版本 ≥ 18
- [ ] pnpm 已安装
- [ ] Go 工具链可用
- [ ] Git 本地仓库干净（无未提交更改）
- [ ] 能正常运行 `pnpm build` 和 `wails dev`

### 文档阅读
- [ ] 已阅读 FRONTEND_REFACTOR_GUIDE.md（完整指南）
- [ ] 已阅读 REFACTOR_QUICK_REFERENCE.md（快速参考）
- [ ] 已阅读 DIRECTORY_STRUCTURE_CHANGES.md（目录对比）
- [ ] 已阅读 copilot-instructions.md 的重构部分

### 分支准备
```bash
# 创建重构分支
git checkout -b refactor/frontend-restructuring
git push -u origin refactor/frontend-restructuring
```

- [ ] 新分支创建成功
- [ ] 分支已推送到远程

---

## 🔴 阶段 1：创建统一状态管理（1-2 天）

**目标**：建立单一数据源

### 任务清单

#### Task 1.1：创建 Store 类型定义
- [ ] 创建文件 `frontend/src/store/types.ts`
- [ ] 定义 PlayerState 接口
- [ ] 定义 ThemeState 接口
- [ ] 定义 ModalState 接口
- [ ] 定义 UIState 接口
- [ ] 定义 DataState 接口
- [ ] 定义 AppStore 接口
- [ ] 定义 AppActions 接口
- [ ] 导出所有类型
- [ ] 运行 `pnpm tsc --noEmit` 验证类型无错误

**验证**：
```bash
cd frontend
pnpm tsc --noEmit
# 应该没有错误
```

#### Task 1.2：创建 AppContext
- [ ] 创建新的 `frontend/src/context/AppContext.tsx`
- [ ] 实现 AppProvider 组件
- [ ] 实现 Context 创建和初始化
- [ ] 实现 appStoreReducer 函数
- [ ] 导出 AppContext 和 AppProvider
- [ ] 旧的 AppContext 内容备份（不删除）

**检查**：
```tsx
// 验证导出
import { AppProvider, AppContext } from './context/AppContext';
```

#### Task 1.3：创建 useAppStore Hook
- [ ] 创建文件 `frontend/src/hooks/useAppStore.ts`
- [ ] 实现 useAppStore 主 Hook
- [ ] 实现选择器 Hooks（usePlayerState、useThemeState 等）
- [ ] 添加类型声明
- [ ] 处理错误情况（Context 不存在）

**测试**：
```tsx
// 在组件中测试
const [store, actions] = useAppStore();
console.log(store.player.currentSong);
actions.setSong(someSong);
```

#### Task 1.4：集成 AppProvider
- [ ] 更新 `frontend/src/main.tsx`
- [ ] 添加 AppProvider 包装
- [ ] 保持 MantineProvider
- [ ] 验证导入路径正确

**文件**：
```tsx
// main.tsx
import { AppProvider } from './context/AppContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <MantineProvider>
        <App />
      </MantineProvider>
    </AppProvider>
  </React.StrictMode>,
)
```

#### Task 1.5：验证阶段 1
- [ ] 运行 `pnpm build` 成功
- [ ] 运行 `wails dev` 应用启动
- [ ] 打开 DevTools，无错误信息
- [ ] 应用基本功能可用
- [ ] Git 提交进度：`git commit -m "chore: phase 1 - create unified store"`

**提交检查**：
```bash
git status  # 应该干净
git log -1  # 显示新提交
```

---

## 🟠 阶段 2：合并和重组 Hook 体系（1-2 天）

**目标**：从 13 个 Hook 文件精简到 4 个核心 Hook

### 任务清单

#### Task 2.1：创建 usePlayer Hook
- [ ] 创建 `frontend/src/hooks/player/usePlayer.ts`
- [ ] 合并 useAudioPlayer 逻辑
- [ ] 合并 usePlaybackControls 逻辑
- [ ] 合并 usePlaySong 逻辑
- [ ] 实现播放/暂停/下一首/上一首
- [ ] 实现音量和进度控制
- [ ] 实现音频元素 Ref 管理
- [ ] 添加完整的 JSDoc 文档

**检查清单**：
- [ ] `play()` 函数可用
- [ ] `pause()` 函数可用
- [ ] `seek()` 函数可用
- [ ] `setVolume()` 函数可用
- [ ] `playSong()` 函数可用
- [ ] `playNext()` 函数可用
- [ ] `playPrevious()` 函数可用
- [ ] 没有 ESLint 错误

#### Task 2.2：创建 usePlaylist Hook
- [ ] 创建 `frontend/src/hooks/player/usePlaylist.ts`
- [ ] 合并 usePlaylistActions 逻辑
- [ ] 合并 usePlaylistPersistence 逻辑
- [ ] 实现 addSongToQueue()
- [ ] 实现 removeSongFromQueue()
- [ ] 实现 reorderQueue()
- [ ] 实现 clearQueue()
- [ ] 实现列表持久化到 localStorage

**检查清单**：
- [ ] `addSongToQueue()` 可用
- [ ] `removeSongFromQueue()` 可用
- [ ] `reorderQueue()` 可用
- [ ] `clearQueue()` 可用
- [ ] 刷新页面后歌单恢复

#### Task 2.3：创建 useAudio Hook
- [ ] 创建 `frontend/src/hooks/player/useAudio.ts`
- [ ] 合并 useAudioEvents 逻辑
- [ ] 合并 useAudioSourceManager 逻辑
- [ ] 合并 useSkipIntervalHandler 逻辑
- [ ] 实现音频流加载
- [ ] 实现跳过区间处理
- [ ] 实现错误重试逻辑
- [ ] 实现音频事件监听

**检查清单**：
- [ ] `loadAudioStream()` 可用
- [ ] `setSkipInterval()` 可用
- [ ] 音频播放时自动跳过
- [ ] 网络错误时自动重试

#### Task 2.4：创建 useAppInitialize Hook
- [ ] 创建 `frontend/src/hooks/ui/useAppInitialize.ts`
- [ ] 实现主题加载初始化
- [ ] 实现登录状态检查
- [ ] 实现数据加载（歌曲、收藏夹等）
- [ ] 实现所有初始化逻辑的协调

**检查清单**：
- [ ] 应用启动时自动加载主题
- [ ] 应用启动时自动检查登录
- [ ] 应用启动时自动加载数据

#### Task 2.5：更新 hooks/index.ts 导出
- [ ] 导出新的 Hook：useAppStore、usePlayer、usePlaylist、useAudio
- [ ] 保留其他必要 Hook
- [ ] 移除已删除的 Hook 导出
- [ ] 验证导入路径

#### Task 2.6：删除旧 Hook 文件
按顺序删除（确保没有地方引用后）：
- [ ] `useAudioPlayer.ts`
- [ ] `usePlaylistActions.ts`
- [ ] `usePlaylistPersistence.ts`
- [ ] `useAudioEvents.ts`
- [ ] `useAudioSourceManager.ts`
- [ ] `usePlaySong.ts`
- [ ] `usePlaybackControls.ts`
- [ ] `useSkipIntervalHandler.ts`
- [ ] `usePlayModes.ts`
- [ ] `useAudioInterval.ts` (需要检查是否完全合并)

**删除前必检**：
```bash
# 搜索引用
grep -r "useAudioPlayer" frontend/src/ --exclude-dir=node_modules
grep -r "usePlaylistActions" frontend/src/ --exclude-dir=node_modules
# 应该没有结果
```

#### Task 2.7：验证阶段 2
- [ ] 运行 `pnpm build` 成功
- [ ] 运行 `wails dev` 应用启动
- [ ] 播放功能正常
- [ ] 歌单操作正常
- [ ] 没有 ESLint/TypeScript 错误
- [ ] Git 提交：`git commit -m "refactor: phase 2 - consolidate hooks"`

---

## 🟠 阶段 3：精简 App.tsx（1 天）

**目标**：从 1103 行精简到 <500 行

### 任务清单

#### Task 3.1：分析当前 App.tsx
- [ ] 统计当前行数：`wc -l frontend/src/App.tsx`
- [ ] 统计 useState 数量：`grep -c "useState" App.tsx`
- [ ] 统计 Hook 导入数：`grep -c "import.*from.*hooks" App.tsx`
- [ ] 列出所有分散的状态
- [ ] 列出所有可以迁移到 Hook 的逻辑

#### Task 3.2：创建 utils/appHelpers.ts
- [ ] 创建文件 `frontend/src/utils/appHelpers.ts`
- [ ] 迁移 computePanelStyle() 函数
- [ ] 迁移 computeTextColor() 函数
- [ ] 迁移 computeBackgroundStyle() 函数
- [ ] 迁移 computeMantineTheme() 函数
- [ ] 迁移其他计算函数
- [ ] 添加 JSDoc 文档

#### Task 3.3：重写 App.tsx
- [ ] 删除所有分散的 useState
- [ ] 删除所有冗长的 Hook 导入
- [ ] 添加 `const [store, actions] = useAppStore();`
- [ ] 添加 `useAppInitialize();`
- [ ] 删除所有初始化 useEffect（移到 useAppInitialize）
- [ ] 简化 Props 组装
- [ ] 简化渲染逻辑
- [ ] 保留核心业务逻辑

**新 App.tsx 结构示例**：
```tsx
const App: React.FC = () => {
    // 1. Store
    const [store, actions] = useAppStore();
    
    // 2. 初始化
    useAppInitialize();
    
    // 3. Hooks
    const player = usePlayer();
    const playlist = usePlaylist();
    const audio = useAudio();
    
    // 4. 派生值
    const backgroundStyle = useMemo(() => ({ /* ... */ }), [store]);
    
    // 5. Props
    const appModalsProps = { store, actions, handlers };
    
    // 6. 渲染
    return (
        <MantineProvider>
            <AppModals {...appModalsProps} />
            <AppPanels {...appPanelsProps} />
        </MantineProvider>
    );
};
```

#### Task 3.4：验证行数和质量
- [ ] 运行 `wc -l frontend/src/App.tsx` → 应该 < 500
- [ ] 运行 `grep -c "useState" App.tsx` → 应该 = 0 或 1
- [ ] 运行 `pnpm tsc --noEmit` → 无错误
- [ ] 运行 `pnpm eslint src/App.tsx` → 无错误

#### Task 3.5：全量测试
- [ ] 应用能启动
- [ ] 所有功能正常
- [ ] DevTools 无错误
- [ ] 性能无明显下降

#### Task 3.6：Git 提交
- [ ] `git commit -m "refactor: phase 3 - simplify App.tsx"`
- [ ] 验证提交成功

---

## 🟡 阶段 4：重组组件文件结构（1 天）

**目标**：清晰的组件分类

### 任务清单

#### Task 4.1：创建新目录
```bash
mkdir -p frontend/src/components/modals
mkdir -p frontend/src/components/modals/ThemeModals
mkdir -p frontend/src/components/layouts
mkdir -p frontend/src/components/cards
mkdir -p frontend/src/components/common
```

- [ ] 所有目录创建成功

#### Task 4.2：迁移模态框
**迁移文件**：
- [ ] `LoginModal.tsx` → `components/modals/`
- [ ] `SettingsModal.tsx` → `components/modals/`
- [ ] `GlobalSearchModal.tsx` → `components/modals/`
- [ ] `CreateFavoriteModal.tsx` → `components/modals/`
- [ ] `BVAddModal.tsx` → `components/modals/`
- [ ] `DownloadManagerModal.tsx` → `components/modals/`
- [ ] `PlaylistModal.tsx` → `components/modals/`
- [ ] `ThemeDetailModal.tsx` → `components/modals/ThemeModals/`
- [ ] `ThemeEditorModal.tsx` → `components/modals/ThemeModals/`
- [ ] `ThemeManagerModal.tsx` → `components/modals/ThemeModals/`
- [ ] `SettingsExitBehavior.tsx` → `components/modals/`
- [ ] `AddToFavoriteModal.tsx` → `components/modals/`

**创建索引文件**：
- [ ] 创建 `components/modals/index.ts`
- [ ] 创建 `components/modals/ThemeModals/index.ts`
- [ ] 导出所有模态框组件

#### Task 4.3：迁移布局组件
**迁移文件**：
- [ ] `MainLayout.tsx` → `components/layouts/`
- [ ] `TopBar.tsx` → `components/layouts/`
- [ ] `ControlsPanel.tsx` → `components/layouts/`
- [ ] `PlayerBar.tsx` → `components/layouts/`

**创建索引文件**：
- [ ] 创建 `components/layouts/index.ts`
- [ ] 导出所有布局组件

#### Task 4.4：迁移卡片组件
**迁移文件**：
- [ ] `SongDetailCard.tsx` → `components/cards/`
- [ ] `CurrentPlaylistCard.tsx` → `components/cards/`
- [ ] `FavoriteListCard.tsx` → `components/cards/`

**创建索引文件**：
- [ ] 创建 `components/cards/index.ts`
- [ ] 导出所有卡片组件

#### Task 4.5：迁移通用组件
**迁移文件**：
- [ ] `WindowControls.tsx` → `components/common/`

**创建索引文件**：
- [ ] 创建 `components/common/index.ts`

#### Task 4.6：更新导入路径
需要搜索并更新所有导入：
- [ ] `grep -r "from.*LoginModal" frontend/src/ | grep -v node_modules`
- [ ] `grep -r "from.*components/.*Modal" frontend/src/`
- [ ] `grep -r "from.*components/.*Card" frontend/src/`
- [ ] 更新所有导入路径

**示例**：
```tsx
// 旧
import LoginModal from './components/LoginModal';

// 新
import { LoginModal } from './components/modals';
```

#### Task 4.7：验证
- [ ] `pnpm build` 成功
- [ ] `wails dev` 应用启动
- [ ] 所有功能正常
- [ ] DevTools 无错误

#### Task 4.8：Git 提交
- [ ] `git commit -m "refactor: phase 4 - reorganize components"`

---

## 🟡 阶段 5：Props 规范化和类型完善（1 天）

**目标**：统一的类型系统和 Props 接口

### 任务清单

#### Task 5.1：创建类型文件
- [ ] 创建 `frontend/src/types/index.ts`
- [ ] 创建 `frontend/src/types/store.ts`
- [ ] 创建 `frontend/src/types/components.ts`
- [ ] 创建 `frontend/src/types/models.ts`
- [ ] 创建 `frontend/src/types/theme.ts`

#### Task 5.2：迁移和规范类型
- [ ] 在 `types/store.ts` 中定义 AppStore 相关类型
- [ ] 在 `types/components.ts` 中定义所有组件 Props 接口
- [ ] 在 `types/models.ts` 中定义业务模型
- [ ] 在 `types/theme.ts` 中定义主题相关类型
- [ ] 统一导出到 `types/index.ts`

#### Task 5.3：规范模态框 Props
**统一模态框 Props 模式**：
```typescript
// types/components.ts
export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    store: AppStore;
    actions: AppActions;
}
```

- [ ] 应用到所有模态框
- [ ] 移除冗余的 Props

#### Task 5.4：规范主要容器 Props
- [ ] 定义 `AppModalsProps`
- [ ] 定义 `AppPanelsProps`
- [ ] 定义 `MainLayoutProps`
- [ ] 每个接口只保留 < 5 个属性

#### Task 5.5：更新所有 Props 类型
- [ ] 检查 `AppModals.tsx` Props 类型
- [ ] 检查 `AppPanels.tsx` Props 类型
- [ ] 检查 `MainLayout.tsx` Props 类型
- [ ] 检查各模态框 Props 类型
- [ ] 更新为新的规范类型

#### Task 5.6：验证 TypeScript
- [ ] 运行 `pnpm tsc --noEmit`
- [ ] 应该没有类型错误
- [ ] 运行 `pnpm eslint src/types/`
- [ ] 应该没有 lint 错误

#### Task 5.7：Git 提交
- [ ] `git commit -m "refactor: phase 5 - standardize types"`

---

## 🟡 阶段 6：验证、测试和优化（1 天）

**目标**：确保重构成功完成

### 功能测试清单

#### 播放功能
- [ ] 点击播放按钮，音乐开始播放
- [ ] 点击暂停按钮，音乐暂停
- [ ] 点击下一首，播放下一首歌曲
- [ ] 点击上一首，播放上一首歌曲
- [ ] 拖动进度条，音乐跳转到指定位置
- [ ] 调节音量滑块，音量改变
- [ ] 修改播放模式，播放模式改变

#### 歌单功能
- [ ] 创建新歌单
- [ ] 添加歌曲到歌单
- [ ] 删除歌单中的歌曲
- [ ] 修改歌单名称
- [ ] 拖拖重排歌曲顺序

#### 主题功能
- [ ] 选择内置主题，应用成功
- [ ] 编辑自定义主题，修改生效
- [ ] 创建新主题，保存成功
- [ ] 删除自定义主题
- [ ] 切换 colorScheme（亮色/暗色）

#### 模态框功能
- [ ] 打开登录模态框
- [ ] 打开设置模态框
- [ ] 打开搜索模态框
- [ ] 打开 BV 添加模态框
- [ ] 打开下载管理模态框

#### 其他功能
- [ ] 首次启动应用正常初始化
- [ ] 修改数据后保存到本地
- [ ] 关闭应用后重启，数据恢复
- [ ] 在 DevTools 中没有错误信息

### 性能检查

- [ ] 打开 Chrome DevTools → Performance 标签
- [ ] 录制应用加载过程
- [ ] 检查帧率 > 30 FPS
- [ ] 检查首屏加载 < 2s
- [ ] 检查单次 React 渲染 < 50ms

**性能基准线**：
```
首屏加载时间: < 2 秒
帧率: > 30 FPS
React 渲染时间: < 50 ms
```

### 代码质量检查

```bash
# 类型检查
pnpm tsc --noEmit

# Lint 检查
pnpm eslint src/

# 代码格式化
pnpm prettier --check src/

# 构建检查
pnpm build
```

- [ ] TypeScript 无错误
- [ ] ESLint 无错误
- [ ] Prettier 格式一致
- [ ] 构建成功

### 代码行数验证

```bash
# 检查 App.tsx 行数
wc -l frontend/src/App.tsx  # 应该 < 500

# 检查 Hook 数量
find frontend/src/hooks/player -name "*.ts" | wc -l  # 应该 ≤ 5

# 检查组件组织
find frontend/src/components -type d | wc -l  # 应该有新目录
```

- [ ] App.tsx 行数 < 500
- [ ] player/ 下 Hook 文件 ≤ 5
- [ ] 组件分类清晰

### 文档更新

- [ ] 更新 `.github/copilot-instructions.md`
- [ ] 更新重构进度状态
- [ ] 记录完成时间
- [ ] 添加完成清单

### 最终验收

- [ ] 所有功能测试通过
- [ ] 性能检查通过
- [ ] 代码质量检查通过
- [ ] 文档更新完成

### Git 最终提交

```bash
# 确保分支干净
git status

# 最终提交
git commit -m "refactor: phase 6 - verification and finalization"

# 推送到远程
git push

# 创建 Pull Request（可选）
# 在 GitHub 上创建 PR 用于代码审查
```

- [ ] 阶段 6 提交成功
- [ ] 推送到远程成功
- [ ] 所有工作已完成

---

## 📊 完成状态

| 阶段     | 名称         | 预计天数 | 状态 | 完成日期 |
| -------- | ------------ | -------- | ---- | -------- |
| 1        | 创建 Store   | 1-2      | ⬜    |          |
| 2        | 合并 Hook    | 1-2      | ⬜    |          |
| 3        | 精简 App.tsx | 1        | ⬜    |          |
| 4        | 重组组件     | 1        | ⬜    |          |
| 5        | 类型完善     | 1        | ⬜    |          |
| 6        | 验证优化     | 1        | ⬜    |          |
| **总计** |              | **5-7**  |      |          |

---

## 🆘 遇到问题？

### 常见问题快速查找

| 问题           | 查阅                                   | 解决方案              |
| -------------- | -------------------------------------- | --------------------- |
| 应用无法启动   | FRONTEND_REFACTOR_GUIDE.md - 陷阱 1    | 检查 AppProvider 集成 |
| 组件找不到状态 | REFACTOR_QUICK_REFERENCE.md - 常见错误 | 添加 `useAppStore()`  |
| 导入路径错误   | DIRECTORY_STRUCTURE_CHANGES.md         | 更新所有导入语句      |
| 类型错误       | FRONTEND_REFACTOR_GUIDE.md - 陷阱 5    | 检查类型定义和初始值  |
| 性能问题       | FRONTEND_REFACTOR_GUIDE.md - 陷阱 3    | 使用选择器 Hook       |

### 获取帮助

1. **查阅完整指南**：[FRONTEND_REFACTOR_GUIDE.md](FRONTEND_REFACTOR_GUIDE.md)
2. **查阅快速参考**：[REFACTOR_QUICK_REFERENCE.md](REFACTOR_QUICK_REFERENCE.md)
3. **查阅目录对比**：[DIRECTORY_STRUCTURE_CHANGES.md](DIRECTORY_STRUCTURE_CHANGES.md)
4. **查阅 Copilot 指令**：[.github/copilot-instructions.md](.github/copilot-instructions.md)

---

## 📝 完成确认

✅ **确认清单**（重构完成后）：

- [ ] 所有 6 个阶段完成
- [ ] 所有功能测试通过
- [ ] 所有性能检查通过
- [ ] 代码质量检查通过
- [ ] 文档更新完成
- [ ] 代码已提交并推送
- [ ] Git 分支已合并到主分支（可选）

**重构完成标志**：
- ✅ App.tsx < 500 行
- ✅ 顶层 state 由 45+ 个减少到 1 个
- ✅ Hook 导入由 30+ 个减少到 5-8 个
- ✅ Props 对象由 80+ 个属性减少到 <5 个
- ✅ 组件按功能分类清晰
- ✅ 应用功能完全正常

---

**祝重构顺利！** 🚀

创建时间：2025-12-29  
预计完成：2025-01-04  
联系方式：GitHub Copilot
