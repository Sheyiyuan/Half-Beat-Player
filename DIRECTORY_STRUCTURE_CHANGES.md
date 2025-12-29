# 前端重构 - 目录结构对比

## 现状（1103 行 App.tsx）

```
frontend/src/
├── App.tsx                          ⚠️ 1103 行！包含所有逻辑
├── main.tsx
├── index.css
├── types.ts                         ⚠️ 196 行，类型混乱
├── api.ts
├── components/
│   ├── AddToFavoriteModal.tsx
│   ├── AppModals.tsx               ⚠️ Props: 80+ 个属性
│   ├── AppPanels.tsx               ⚠️ Props: 50+ 个属性
│   ├── BVAddModal.tsx
│   ├── ControlsPanel.tsx
│   ├── CreateFavoriteModal.tsx
│   ├── CurrentPlaylistCard.tsx
│   ├── DownloadManagerModal.tsx
│   ├── FavoriteListCard.tsx
│   ├── GlobalSearchModal.tsx
│   ├── LoginModal.tsx
│   ├── MainLayout.tsx              ⚠️ Props: 50+ 个属性
│   ├── PlayerBar.tsx
│   ├── PlaylistModal.tsx
│   ├── SettingsExitBehavior.tsx
│   ├── SettingsModal.tsx
│   ├── SongDetailCard.tsx
│   ├── ThemeDetailModal.tsx        ⚠️ Props: 20+ 个属性
│   ├── ThemeEditorModal.tsx        ⚠️ Props: 20+ 个属性
│   ├── ThemeManagerModal.tsx       ⚠️ Props: 15+ 个属性
│   ├── TopBar.tsx
│   └── WindowControls.tsx
├── context/
│   ├── AppContext.tsx              ⚠️ 149 行，功能交叉
│   ├── ModalContext.tsx            ⚠️ 独立小 Context
│   ├── ThemeContext.tsx            ⚠️ 330 行，职责混乱
│   └── index.ts
├── hooks/
│   ├── index.ts
│   ├── data/
│   │   ├── index.ts
│   │   ├── useSongs.ts
│   │   ├── useFavorites.ts
│   │   ├── useSongCache.ts
│   │   └── useSettingsPersistence.ts
│   ├── features/
│   │   ├── useTheme.ts
│   │   ├── useAuth.ts
│   │   ├── useBVResolver.ts
│   │   ├── useFavoriteActions.ts
│   │   ├── useThemeEditor.ts
│   │   ├── useSearchAndBV.ts
│   │   ├── useBVModal.ts
│   │   ├── useLyricManagement.ts
│   │   ├── useSongOperations.ts
│   │   ├── useLyricLoader.ts
│   │   ├── useGlobalSearch.ts
│   │   └── useLoginHandlers.ts
│   ├── player/
│   │   ├── index.ts
│   │   ├── useAudioPlayer.ts       ⚠️ 细分过度
│   │   ├── usePlaylist.ts          ⚠️ 细分过度
│   │   ├── usePlaylistActions.ts   ⚠️ 细分过度
│   │   ├── usePlaylistPersistence.ts ⚠️ 细分过度
│   │   ├── useAudioEvents.ts       ⚠️ 细分过度
│   │   ├── useAudioInterval.ts     ⚠️ 细分过度
│   │   ├── useAudioSourceManager.ts ⚠️ 细分过度
│   │   ├── usePlaySong.ts          ⚠️ 细分过度
│   │   ├── usePlaybackControls.ts  ⚠️ 细分过度
│   │   ├── useSkipIntervalHandler.ts ⚠️ 细分过度
│   │   ├── useDownloadManager.ts   ⚠️ 细分过度
│   │   └── usePlayModes.ts         ⚠️ 细分过度
│   └── ui/
│       ├── useHitokoto.ts
│       ├── useUiDerived.ts
│       ├── useAppLifecycle.ts
│       ├── useAppEffects.ts
│       ├── useAppHandlers.ts
│       └── useAppPanelsProps.ts
├── utils/
│   ├── constants.ts
│   ├── image.ts
│   ├── storage.ts
│   ├── time.ts
│   └── index.ts
└── wailsjs/
    ├── go/
    │   ├── models.ts
    │   └── services/
    ├── runtime/
    └── ...
```

**问题分析**：
- ❌ App.tsx 1103 行，难以维护
- ❌ 45+ 个 useState 分散在顶层
- ❌ 3 个 Context 功能交叉
- ❌ player/ 下 13 个 Hook 细分过度
- ❌ MainLayout Props 50+ 个属性
- ❌ 组件文件扁平结构，难以查找

---

## 目标（<500 行 App.tsx）

```
frontend/src/
├── App.tsx                          ✅ <500 行，专注协调
├── main.tsx                         ✅ 包含 AppProvider
├── index.css
├── types/                           ✅ 新增：类型分类
│   ├── index.ts
│   ├── models.ts                    ← 业务模型（Song、Favorite）
│   ├── store.ts                     ← Store 类型定义
│   ├── components.ts                ← 组件 Props 类型
│   └── theme.ts                     ← 主题相关类型
├── store/                           ✅ 新增：统一状态管理
│   ├── index.ts
│   └── types.ts                     ← AppStore、PlayerState、ThemeState 等
├── components/
│   ├── AppModals.tsx               ✅ Props: <5 个（store + handlers）
│   ├── AppPanels.tsx               ✅ Props: <5 个（store + handlers）
│   ├── modals/                      ✅ 新增目录：模态框分组
│   │   ├── index.ts
│   │   ├── LoginModal.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── GlobalSearchModal.tsx
│   │   ├── CreateFavoriteModal.tsx
│   │   ├── BVAddModal.tsx
│   │   ├── DownloadManagerModal.tsx
│   │   ├── PlaylistModal.tsx
│   │   ├── ThemeModals/            ✅ 新增子目录：主题模态框
│   │   │   ├── index.ts
│   │   │   ├── ThemeDetailModal.tsx
│   │   │   ├── ThemeEditorModal.tsx
│   │   │   ├── ThemeManagerModal.tsx
│   │   │   └── useThemeModals.ts   ✅ 新增：逻辑聚合 Hook
│   │   └── SettingsExitBehavior.tsx
│   ├── layouts/                     ✅ 新增目录：布局分组
│   │   ├── index.ts
│   │   ├── MainLayout.tsx          ✅ Props: <5 个
│   │   ├── TopBar.tsx
│   │   ├── ControlsPanel.tsx
│   │   └── PlayerBar.tsx
│   ├── cards/                       ✅ 新增目录：卡片分组
│   │   ├── index.ts
│   │   ├── SongDetailCard.tsx
│   │   ├── CurrentPlaylistCard.tsx
│   │   └── FavoriteListCard.tsx
│   ├── common/                      ✅ 新增目录：通用组件
│   │   ├── index.ts
│   │   └── WindowControls.tsx
│   └── ...（其他不变）
├── context/
│   ├── AppContext.tsx              ✅ 改造为统一容器
│   ├── index.ts
│   └── （ModalContext、ThemeContext 合并到 AppContext）
├── hooks/
│   ├── index.ts
│   ├── useAppStore.ts              ✅ 新增：单一数据入口
│   ├── player/
│   │   ├── index.ts
│   │   ├── usePlayer.ts            ✅ 新增：合并播放器逻辑
│   │   ├── usePlaylist.ts          ✅ 新增：合并歌单逻辑
│   │   ├── useAudio.ts             ✅ 新增：合并音频逻辑
│   │   └── usePlaybackMode.ts      ✅ 新增：播放模式逻辑
│   │   （删除 13 个细分 Hook）
│   ├── features/
│   │   ├── useTheme.ts
│   │   ├── useAuth.ts
│   │   ├── useBV.ts
│   │   ├── useSearch.ts
│   │   ├── useFavorite.ts
│   │   └── useDownload.ts
│   ├── data/
│   │   ├── useSongs.ts
│   │   ├── useFavorites.ts
│   │   ├── useSongCache.ts
│   │   └── useSettingsPersistence.ts
│   └── ui/
│       ├── useAppInitialize.ts     ✅ 新增：初始化生命周期
│       ├── useHitokoto.ts
│       └── ...（保留必要的）
├── utils/
│   ├── constants.ts
│   ├── image.ts
│   ├── storage.ts
│   ├── time.ts
│   ├── appHelpers.ts               ✅ 新增：App 相关辅助函数
│   └── index.ts
└── wailsjs/
    └── ...（保持不变）
```

**改进分析**：
- ✅ App.tsx 精简到 <500 行
- ✅ 所有 state 统一在 AppStore（1 个 useState）
- ✅ 3 个 Context 合并为 1 个 AppContext
- ✅ 13 个 player Hook 合并为 4 个核心 Hook
- ✅ Props 对象统一化（store + actions + handlers）
- ✅ 组件按功能分类，结构清晰

---

## 转换对比

### 1️⃣ 顶层状态管理

**现状**：
```typescript
// App.tsx - 45+ 个 useState
const [setting, setSetting] = useState<PlayerSetting | null>(null);
const [lyric, setLyric] = useState<LyricMapping | null>(null);
const [status, setStatus] = useState<string>("加载中...");
const [searchQuery, setSearchQuery] = useState("");
const [globalSearchTerm, setGlobalSearchTerm] = useState("");
const [selectedFavId, setSelectedFavId] = useState<string | null>(null);
const [remoteResults, setRemoteResults] = useState<Song[]>([]);
const [remoteLoading, setRemoteLoading] = useState(false);
// ... 37 个更多的 state
```

**目标**：
```typescript
// App.tsx - 1 个 useAppStore
const [store, actions] = useAppStore();
// 访问状态
const { setting, lyric, status, searchQuery, globalSearchTerm, selectedFavId, remoteResults, remoteLoading } = store;
```

### 2️⃣ Hook 导入

**现状**：
```typescript
import { 
  useAudioPlayer, usePlaylist, useAudioInterval, 
  usePlaylistActions, useSkipIntervalHandler, 
  useDownloadManager, useAudioEvents, usePlaybackControls, 
  usePlaylistPersistence, useAudioSourceManager, usePlaySong, 
  usePlayModes 
} from "./hooks/player";
import { useSongs, useFavorites, useSongCache, useSettingsPersistence } from "./hooks/data";
import { useAuth, useBVResolver, useFavoriteActions, useThemeEditor, ... } from "./hooks/features";
import { useHitokoto, useUiDerived, useAppLifecycle, useAppEffects, useAppHandlers } from "./hooks/ui";
```

**目标**：
```typescript
import { useAppStore } from "./hooks/useAppStore";
import { useAppInitialize } from "./hooks/ui/useAppInitialize";
import { usePlayer } from "./hooks/player/usePlayer";
import { usePlaylist } from "./hooks/player/usePlaylist";
import { useAudio } from "./hooks/player/useAudio";
import { useTheme } from "./hooks/features/useTheme";
import { useAuth } from "./hooks/features/useAuth";
```

### 3️⃣ Props 传递

**现状**：
```typescript
const appModalsProps: AppModalsProps = {
    loginModalOpened,
    setLoginModalOpened,
    checkLoginStatus,
    getUserInfo,
    // ... 50 多个属性
    onClearLoginCache,
    onClearThemeCache,
    onOpenDownloadsFolder,
    // ...
};
```

**目标**：
```typescript
const appModalsProps = {
    store,
    actions,
    handlers: {
        onLoginSuccess: () => auth.refreshUserInfo(),
        onThemeApply: (themeId) => actions.applyTheme(themeId),
        // ... 少数几个关键处理函数
    },
};
```

### 4️⃣ 组件 Props 接口

**现状**：
```typescript
interface MainLayoutProps {
    currentSong: Song | null;
    panelBackground: string;
    panelStyles: React.CSSProperties;
    themeColor: string;
    computedColorScheme: "light" | "dark";
    placeholderCover: string;
    maxSkipLimit: number;
    // ... 40 个更多属性
    onIntervalChange: (start: number, end: number) => void;
    onSkipStartChange: (value: number) => void;
    // ... 30 个 callback
}
```

**目标**：
```typescript
interface MainLayoutProps {
    store: AppStore;
    actions: AppActions;
    player: PlayerHook;
    handlers: {
        onPlaySong: (song: Song) => void;
        onAddToQueue: (song: Song) => void;
        // ... 5-8 个核心处理函数
    };
}
```

### 5️⃣ 组件目录结构

**现状**：所有组件混在一个目录，难以分类
```
components/
├── AddToFavoriteModal.tsx      ← 模态框
├── AppModals.tsx               ← 容器
├── AppPanels.tsx               ← 容器
├── BVAddModal.tsx              ← 模态框
├── ControlsPanel.tsx           ← 布局
├── CreateFavoriteModal.tsx     ← 模态框
├── MainLayout.tsx              ← 布局
├── PlayerBar.tsx               ← 布局
└── ... (22 个混在一起的文件)
```

**目标**：按功能分类，结构清晰
```
components/
├── modals/
│   ├── LoginModal.tsx          ← 登录相关
│   ├── SettingsModal.tsx       ← 设置相关
│   ├── ThemeModals/            ← 主题相关
│   │   ├── ThemeDetailModal.tsx
│   │   ├── ThemeEditorModal.tsx
│   │   ├── ThemeManagerModal.tsx
│   │   └── useThemeModals.ts
│   └── ... (其他模态框)
├── layouts/
│   ├── MainLayout.tsx          ← 主要布局
│   ├── TopBar.tsx              ← 顶部栏
│   ├── ControlsPanel.tsx       ← 控制面板
│   └── PlayerBar.tsx           ← 播放条
├── cards/
│   ├── SongDetailCard.tsx      ← 歌曲卡片
│   ├── CurrentPlaylistCard.tsx ← 当前歌单卡片
│   └── FavoriteListCard.tsx    ← 收藏夹卡片
└── common/
    └── WindowControls.tsx      ← 通用控件
```

---

## 数据流对比

### 现状数据流（混乱）

```
App.tsx (顶层 state)
  ├─ [45+ useState]
  ├─ [30+ useXxxHook]
  └─ [3 个 Context]
       │
       ├─→ AppModals (接收 80+ props)
       │    ├─→ LoginModal (接收 20+ props)
       │    ├─→ ThemeDetailModal (接收 15+ props)
       │    └─→ ...
       │
       └─→ AppPanels (接收 50+ props)
            ├─→ MainLayout (接收 50+ props)
            │    ├─→ SongDetailCard
            │    ├─→ CurrentPlaylistCard
            │    └─→ FavoriteListCard
            ├─→ TopBar
            └─→ ControlsPanel

问题：
- Props 逐层传递，修改困难
- 状态分散，难以同步
- 组件耦合度高
```

### 目标数据流（清晰）

```
AppProvider
  └─→ AppContext (统一数据源)
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
          └─ ...

App.tsx
  └─→ useAppStore Hook (从 Context 读取)
       ├─→ AppModals
       │    ├─ 使用 useAppStore 读取 store
       │    ├─ 使用 actions 修改状态
       │    └─→ LoginModal / ThemeDetailModal / ...
       │
       └─→ AppPanels
            └─→ MainLayout / TopBar / ControlsPanel
                 └─ 都直接使用 useAppStore

优点：
- 单一数据源
- 状态同步一致
- Props 精简化
- 组件独立性强
```

---

## 文件变化统计

| 类别           | 数量  | 备注                                      |
| -------------- | ----- | ----------------------------------------- |
| **新增文件**   | 12    | store/types.ts、hooks/useAppStore.ts 等   |
| **删除文件**   | 11    | 旧的细分 Hook                             |
| **改造文件**   | 5     | App.tsx、AppContext.tsx、AppModals.tsx 等 |
| **保持不变**   | 150+  | 大多数组件和工具函数                      |
| **总行数变化** | -600+ | App.tsx 1103→<500，context 合并           |

---

## 迁移路径

```
┌─────────────────────────────────────────────────────────────┐
│ 第 1 天（阶段 1：Store 创建）                                 │
│ ├─ 创建 store/types.ts                                       │
│ ├─ 创建 context/AppContext.tsx（改造现有）                   │
│ ├─ 创建 hooks/useAppStore.ts                                │
│ ├─ 更新 main.tsx 添加 AppProvider                            │
│ └─ ✅ 应用能启动                                             │
├─────────────────────────────────────────────────────────────┤
│ 第 2-3 天（阶段 2：Hook 合并）                                │
│ ├─ 创建 hooks/player/usePlayer.ts                           │
│ ├─ 创建 hooks/player/usePlaylist.ts                         │
│ ├─ 创建 hooks/player/useAudio.ts                            │
│ ├─ 删除 13 个旧 Hook                                         │
│ └─ ✅ 应用功能正常                                           │
├─────────────────────────────────────────────────────────────┤
│ 第 4 天（阶段 3：App.tsx 精简）                               │
│ ├─ 重写 App.tsx（使用 useAppStore）                          │
│ ├─ 迁移工具函数到 utils/appHelpers.ts                       │
│ └─ ✅ App.tsx < 500 行                                       │
├─────────────────────────────────────────────────────────────┤
│ 第 5 天（阶段 4：组件重组）                                    │
│ ├─ 创建 components/modals 目录                              │
│ ├─ 创建 components/layouts 目录                             │
│ ├─ 创建 components/cards 目录                               │
│ └─ ✅ 目录结构清晰                                           │
├─────────────────────────────────────────────────────────────┤
│ 第 6 天（阶段 5：类型完善）                                    │
│ ├─ 创建 types/store.ts 等文件                               │
│ ├─ 规范化所有 Props 接口                                     │
│ └─ ✅ TypeScript 无错误                                      │
├─────────────────────────────────────────────────────────────┤
│ 第 7 天（阶段 6：验证优化）                                    │
│ ├─ 功能测试（18 项清单）                                     │
│ ├─ 性能检查                                                 │
│ ├─ 代码质量检查                                              │
│ └─ ✅ 全部通过                                               │
└─────────────────────────────────────────────────────────────┘
```

---

**总结**：从「大而杂」的代码库转变为「小而精」的模块化架构！
