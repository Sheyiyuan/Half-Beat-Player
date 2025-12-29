# 前端重构指导文档

> 📅 创建于：2025年12月29日  
> 🎯 目标：精简 App.tsx、统一状态管理、提升代码可维护性  
> ⏱️ 预计周期：5-7 个工作日

## 📋 目录

1. [重构目标](#重构目标)
2. [当前问题分析](#当前问题分析)
3. [分阶段重构计划](#分阶段重构计划)
4. [详细实施步骤](#详细实施步骤)
5. [检查清单](#检查清单)
6. [常见陷阱](#常见陷阱)
7. [验证方法](#验证方法)

---

## 重构目标

### 量化指标

| 指标                 | 现状 | 目标     | 优先级 |
| -------------------- | ---- | -------- | ------ |
| **App.tsx 行数**     | 1103 | <500     | 🔴 最高 |
| **顶层 useState**    | 45+  | <5       | 🔴 最高 |
| **Hook 导入数**      | 30+  | 5-8      | 🟠 高   |
| **MainLayout Props** | 50+  | <5       | 🟠 高   |
| **Context 数量**     | 3 个 | 1 个     | 🟠 高   |
| **组件文件结构**     | 散乱 | 分组清晰 | 🟡 中   |

### 质量指标

- ✅ 单一职责原则：每个文件/Hook 只做一件事
- ✅ 代码复用性：相似逻辑统一管理
- ✅ 可测试性：业务逻辑与 UI 分离
- ✅ 新人友好：文件结构清晰，易于查找和理解

---

## 当前问题分析

### 问题 1：App.tsx 过度臃肿

**表现**：
- 1103 行单文件包含所有逻辑
- 45+ 个 useState 分散管理
- 30+ 个 Hook 导入，依赖链条复杂

**根本原因**：
- 缺乏状态管理统一入口
- Hook 职责划分不清
- 没有应用生命周期的集中管理

**影响**：
- 代码阅读困难
- Bug 定位复杂（状态分散）
- 新增功能需要修改 App.tsx

### 问题 2：Props Drilling 深度

**表现**：
```
App.tsx (45+ props) 
  → AppModals (80+ props)
  → ThemeDetailModal (20+ props)
```

**根本原因**：
- 没有使用 Context/Store 跨层级共享状态
- 每层组件都需要中转 props

**影响**：
- 修改一个 props 需要跨多层修改
- 组件耦合度高
- 难以复用

### 问题 3：状态管理混乱

**表现**：
- 3 个 Context（AppContext、ThemeContext、ModalContext）功能交叉
- 状态在多个 Hook 中重复定义
- 同一数据有多个数据源

**根本原因**：
- 没有统一的数据模型设计
- Context 按业务域分割，而非按问题分割

**影响**：
- 数据一致性难以保证
- 状态更新时序复杂
- 缺乏单一数据源原则

### 问题 4：Hook 组织混乱

**表现**：
```
hooks/player/          # 13 个文件
  ├── usePlaylist.ts
  ├── usePlaylistActions.ts
  ├── usePlaylistPersistence.ts
  ├── useAudioPlayer.ts
  ├── useAudioEvents.ts
  ├── useAudioInterval.ts
  ├── useAudioSourceManager.ts
  ├── usePlaySong.ts
  ├── usePlaybackControls.ts
  ├── useSkipIntervalHandler.ts
  ├── useDownloadManager.ts
  ├── usePlayModes.ts
  └── useAudioInterval.ts

# 导致 App.tsx 需要导入大量 Hook
import { 
  useAudioPlayer, usePlaylist, useAudioInterval,
  usePlaylistActions, useSkipIntervalHandler, ...
}
```

**根本原因**：
- 过度细分，没有整合层
- 缺乏统一的导出和组合策略

**影响**：
- 导入困难，容易遗漏或重复
- Hook 之间依赖关系复杂
- 新增功能时不知道用哪个 Hook

---

## 分阶段重构计划

### 阶段总览

```
┌─────────────────────────────────────────────────────────┐
│                     阶段 1（1-2 天）                      │
│          创建统一状态管理（Store + Context）             │
│  - 创建 AppStore 统一数据模型                            │
│  - 创建 AppContext 提供者                               │
│  - 创建 useAppStore Hook 作为单一入口                   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                     阶段 2（1-2 天）                      │
│          合并和重组 Hook 体系                            │
│  - 合并播放器相关 Hook（13 个 → 4 个）                  │
│  - 整理特性 Hook（features/）                          │
│  - 创建 useAppInitialize Hook                           │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                     阶段 3（1 天）                        │
│          精简 App.tsx 主文件                             │
│  - 迁移初始化逻辑到 useAppInitialize                    │
│  - 移除分散的 state，使用 useAppStore                   │
│  - 简化 Props 对象结构                                  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                     阶段 4（1 天）                        │
│          重新组织组件文件结构                            │
│  - 创建 modals/ 目录分组模态框                          │
│  - 创建 layouts/ 目录分组布局                           │
│  - 创建 cards/ 目录分组卡片组件                         │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                     阶段 5（1 天）                        │
│          Props 规范化和类型完善                          │
│  - 统一 Props 接口定义模式                              │
│  - 创建 types/ 目录管理类型                             │
│  - 补充类型文档                                        │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                     阶段 6（1 天）                        │
│          验证、测试和优化                                │
│  - 功能测试                                            │
│  - 性能检查                                            │
│  - 文档更新                                            │
└─────────────────────────────────────────────────────────┘
```

---

## 详细实施步骤

### 🔴 阶段 1：创建统一状态管理

#### 1.1 创建 Store 类型定义

**文件**：`frontend/src/store/types.ts`

```typescript
// 播放器状态
export interface PlayerState {
    queue: Song[];
    currentIndex: number;
    currentSong: Song | null;
    isPlaying: boolean;
    progress: number;
    duration: number;
    volume: number;
    playMode: PlayMode;
    // ... 其他播放器状态
}

// 主题状态
export interface ThemeState {
    themes: Theme[];
    currentThemeId: string | null;
    themeColor: string;
    backgroundColor: string;
    // ... 其他主题状态（从 ThemeContext 迁移）
}

// 模态框状态
export interface ModalState {
    [key: string]: {
        isOpen: boolean;
        data?: any;
    };
    // 示例：
    loginModal: { isOpen: boolean };
    settingsModal: { isOpen: boolean };
    // ...
}

// UI 状态
export interface UIState {
    status: string;
    searchQuery: string;
    selectedFavId: string | null;
    // ...
}

// 数据状态
export interface DataState {
    songs: Song[];
    favorites: Favorite[];
    userInfo: UserInfo | null;
    setting: PlayerSetting | null;
    // ...
}

// 统一的应用状态
export interface AppStore {
    player: PlayerState;
    theme: ThemeState;
    modals: ModalState;
    ui: UIState;
    data: DataState;
    
    // Action creators（函数）
    actions: AppActions;
}

// 所有可能的操作
export interface AppActions {
    // Player 操作
    setPlayMode: (mode: PlayMode) => void;
    setSong: (song: Song) => void;
    setIsPlaying: (playing: boolean) => void;
    
    // Modal 操作
    openModal: (modalName: string, data?: any) => void;
    closeModal: (modalName: string) => void;
    
    // Theme 操作
    applyTheme: (themeId: string) => void;
    updateThemeField: (field: string, value: any) => void;
    
    // ... 其他操作
}
```

#### 1.2 创建 AppContext

**文件**：`frontend/src/context/AppContext.tsx`

```typescript
import React, { createContext, useCallback, useState, ReactNode } from 'react';
import { AppStore, AppActions } from '../store/types';
import { DEFAULT_STORE_STATE } from '../utils/constants';

// 创建 Context
export const AppContext = createContext<{
    store: AppStore;
    dispatch: (action: AppAction) => void;
} | null>(null);

// Store 初始化
function initializeStore(): AppStore {
    return {
        player: { /* ... */ },
        theme: { /* ... */ },
        modals: { /* ... */ },
        ui: { /* ... */ },
        data: { /* ... */ },
        actions: {}, // 由 Hook 填充
    };
}

// Store 状态管理函数
function appStoreReducer(state: AppStore, action: AppAction): AppStore {
    switch (action.type) {
        case 'SET_PLAY_MODE':
            return {
                ...state,
                player: { ...state.player, playMode: action.payload },
            };
        case 'OPEN_MODAL':
            return {
                ...state,
                modals: {
                    ...state.modals,
                    [action.payload.name]: { isOpen: true, data: action.payload.data },
                },
            };
        // ... 其他 case
        default:
            return state;
    }
}

// Provider 组件
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [store, setStore] = useState<AppStore>(() => initializeStore());

    const dispatch = useCallback((action: AppAction) => {
        setStore((prevStore) => appStoreReducer(prevStore, action));
    }, []);

    const value = { store, dispatch };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
```

#### 1.3 创建 useAppStore Hook

**文件**：`frontend/src/hooks/useAppStore.ts`

```typescript
import { useContext, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { AppStore, AppActions } from '../store/types';

export const useAppStore = (): [AppStore, AppActions] => {
    const context = useContext(AppContext);
    
    if (!context) {
        throw new Error('useAppStore must be used within AppProvider');
    }

    const { store, dispatch } = context;

    // 创建 actions 对象
    const actions: AppActions = {
        // Player 操作
        setPlayMode: useCallback((mode) => {
            dispatch({ type: 'SET_PLAY_MODE', payload: mode });
        }, [dispatch]),

        setSong: useCallback((song) => {
            dispatch({ type: 'SET_SONG', payload: song });
        }, [dispatch]),

        setIsPlaying: useCallback((playing) => {
            dispatch({ type: 'SET_IS_PLAYING', payload: playing });
        }, [dispatch]),

        // Modal 操作
        openModal: useCallback((modalName, data) => {
            dispatch({ 
                type: 'OPEN_MODAL', 
                payload: { name: modalName, data } 
            });
        }, [dispatch]),

        closeModal: useCallback((modalName) => {
            dispatch({ 
                type: 'CLOSE_MODAL', 
                payload: { name: modalName } 
            });
        }, [dispatch]),

        // ... 其他操作
    };

    return [store, actions];
};

// 便捷 Hook：只获取特定部分状态
export const usePlayerState = () => {
    const [store] = useAppStore();
    return store.player;
};

export const useThemeState = () => {
    const [store] = useAppStore();
    return store.theme;
};

export const useModalState = () => {
    const [store] = useAppStore();
    return store.modals;
};
```

#### 1.4 更新 main.tsx 使用 AppProvider

**文件**：`frontend/src/main.tsx`

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { MantineProvider } from '@mantine/core'
import { AppProvider } from './context/AppContext'
import './index.css'

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

**检查清单**：
- [ ] 创建 `store/types.ts`
- [ ] 创建 `context/AppContext.tsx`
- [ ] 创建 `hooks/useAppStore.ts`
- [ ] 更新 `main.tsx`
- [ ] 验证应用启动不出错

---

### 🟠 阶段 2：合并和重组 Hook 体系

#### 2.1 合并播放器相关 Hook

**问题**：13 个 Hook 文件，功能交叉，难以协调

**方案**：创建 4 个核心 Hook

**文件**：`frontend/src/hooks/player/usePlayer.ts`

```typescript
/**
 * 统一的播放器 Hook
 * 合并：useAudioPlayer + usePlaylist + 播放相关操作
 */
import { useRef, useCallback, useEffect, useState } from 'react';
import { useAppStore } from '../useAppStore';
import { Song } from '../../types';

export const usePlayer = () => {
    const [store, actions] = useAppStore();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // ===== 播放器状态（从 store 读取）=====
    const {
        queue,
        currentIndex,
        currentSong,
        isPlaying,
        progress,
        duration,
        volume,
        playMode,
    } = store.player;

    // ===== 音频元素操作 =====
    const play = useCallback(async () => {
        if (audioRef.current) {
            await audioRef.current.play();
            actions.setIsPlaying(true);
        }
    }, [actions]);

    const pause = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            actions.setIsPlaying(false);
        }
    }, [actions]);

    const seek = useCallback((time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
    }, []);

    const setVolume = useCallback((vol: number) => {
        if (audioRef.current) {
            audioRef.current.volume = vol;
            actions.setVolume(vol);
        }
    }, [actions]);

    // ===== 列表操作 =====
    const playSong = useCallback((song: Song, index?: number) => {
        actions.setSong(song);
        actions.setIsPlaying(true);
    }, [actions]);

    const playNext = useCallback(() => {
        if (currentIndex < queue.length - 1) {
            const nextSong = queue[currentIndex + 1];
            playSong(nextSong, currentIndex + 1);
        }
    }, [queue, currentIndex, playSong]);

    const playPrevious = useCallback(() => {
        if (currentIndex > 0) {
            const prevSong = queue[currentIndex - 1];
            playSong(prevSong, currentIndex - 1);
        }
    }, [queue, currentIndex, playSong]);

    // ===== 事件监听 =====
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            actions.setProgress(audio.currentTime);
        };

        const handleLoadedMetadata = () => {
            actions.setDuration(audio.duration);
        };

        const handleEnded = () => {
            playNext();
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [actions, playNext]);

    return {
        // 状态
        currentSong,
        isPlaying,
        progress,
        duration,
        volume,
        playMode,
        queue,

        // 控制
        play,
        pause,
        seek,
        setVolume,
        playSong,
        playNext,
        playPrevious,

        // Ref
        audioRef,
    };
};
```

**文件**：`frontend/src/hooks/player/usePlaylist.ts`

```typescript
/**
 * 歌单管理 Hook
 * 合并：usePlaylistActions + usePlaylistPersistence
 */
import { useCallback, useEffect } from 'react';
import { useAppStore } from '../useAppStore';
import { Song, Favorite } from '../../types';

export const usePlaylist = () => {
    const [store, actions] = useAppStore();

    // ===== 歌单操作 =====
    const addSongToQueue = useCallback((song: Song) => {
        const newQueue = [...store.player.queue, song];
        actions.setQueue(newQueue);
    }, [store.player.queue, actions]);

    const removeSongFromQueue = useCallback((index: number) => {
        const newQueue = store.player.queue.filter((_, i) => i !== index);
        actions.setQueue(newQueue);
    }, [store.player.queue, actions]);

    const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
        const newQueue = [...store.player.queue];
        const [item] = newQueue.splice(fromIndex, 1);
        newQueue.splice(toIndex, 0, item);
        actions.setQueue(newQueue);
    }, [store.player.queue, actions]);

    const clearQueue = useCallback(() => {
        actions.setQueue([]);
    }, [actions]);

    // ===== 持久化 =====
    useEffect(() => {
        // 保存歌单到本地存储
        localStorage.setItem('playlist_queue', JSON.stringify(store.player.queue));
    }, [store.player.queue]);

    useEffect(() => {
        // 加载歌单从本地存储
        const saved = localStorage.getItem('playlist_queue');
        if (saved) {
            try {
                const queue = JSON.parse(saved);
                actions.setQueue(queue);
            } catch (e) {
                console.error('Failed to load playlist:', e);
            }
        }
    }, []);

    return {
        queue: store.player.queue,
        currentIndex: store.player.currentIndex,
        currentSong: store.player.currentSong,
        
        addSongToQueue,
        removeSongFromQueue,
        reorderQueue,
        clearQueue,
    };
};
```

**文件**：`frontend/src/hooks/player/useAudio.ts`

```typescript
/**
 * 音频处理相关 Hook
 * 合并：useAudioEvents + useAudioSourceManager + useSkipInterval
 */
import { useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '../useAppStore';

export const useAudio = () => {
    const [store, actions] = useAppStore();
    const retryRef = useRef<Map<string, number>>(new Map());

    const { currentSong, queue, currentIndex } = store.player;

    // ===== 流处理 =====
    const loadAudioStream = useCallback(async (song: Song) => {
        try {
            // 获取流 URL（通过 proxy）
            const streamUrl = await Services.GetAudioUrl(song.id);
            // 更新 song 的流地址
            actions.updateSongField(song.id, { streamUrl });
        } catch (error) {
            console.error('Failed to load audio stream:', error);
            // 重试逻辑
            const retryCount = retryRef.current.get(song.id) || 0;
            if (retryCount < 3) {
                retryRef.current.set(song.id, retryCount + 1);
                setTimeout(() => loadAudioStream(song), 2000);
            }
        }
    }, [actions]);

    // ===== 跳过区间 =====
    const setSkipInterval = useCallback((start: number, end: number) => {
        if (currentSong) {
            actions.updateSongField(currentSong.id, {
                skipStartTime: start,
                skipEndTime: end,
            });
        }
    }, [currentSong, actions]);

    // ===== 自动跳过处理 =====
    useEffect(() => {
        if (!currentSong) return;

        const audio = document.querySelector('audio');
        if (!audio) return;

        const checkSkipInterval = () => {
            const { skipStartTime, skipEndTime } = currentSong;
            if (skipStartTime > 0 && audio.currentTime >= skipStartTime && audio.currentTime < skipEndTime) {
                audio.currentTime = skipEndTime;
            }
        };

        const timer = setInterval(checkSkipInterval, 100);
        return () => clearInterval(timer);
    }, [currentSong]);

    return {
        loadAudioStream,
        setSkipInterval,
    };
};
```

**文件**：`frontend/src/hooks/player/index.ts`

```typescript
// 统一导出
export { usePlayer } from './usePlayer';
export { usePlaylist } from './usePlaylist';
export { useAudio } from './useAudio';
export { usePlaybackMode } from './usePlaybackMode';

// 类型
export type { PlayerHookState, PlaylistHookState } from './types';
```

**删除的文件**（会被新 Hook 替代）：
- [ ] `useAudioPlayer.ts`
- [ ] `usePlaylist.ts` (重写)
- [ ] `usePlaylistActions.ts`
- [ ] `usePlaylistPersistence.ts`
- [ ] `useAudioEvents.ts`
- [ ] `useAudioInterval.ts`
- [ ] `useAudioSourceManager.ts`
- [ ] `usePlaySong.ts`
- [ ] `usePlaybackControls.ts`
- [ ] `useSkipIntervalHandler.ts`
- [ ] `useDownloadManager.ts` (保留或独立)
- [ ] `usePlayModes.ts` (合并到 usePlaybackMode)

#### 2.2 整理特性 Hook

**文件**：`frontend/src/hooks/features/index.ts`

```typescript
/**
 * 特性 Hook 统一导出
 */
export { useTheme } from './useTheme';
export { useAuth } from './useAuth';
export { useBV } from './useBV';
export { useSearch } from './useSearch';
export { useFavorite } from './useFavorite';
export { useDownload } from './useDownload';
```

#### 2.3 创建应用初始化 Hook

**文件**：`frontend/src/hooks/ui/useAppInitialize.ts`

```typescript
/**
 * 应用初始化生命周期 Hook
 * 负责应用启动时的所有初始化逻辑
 */
import { useEffect } from 'react';
import { useAppStore } from '../useAppStore';
import * as Services from '../../wailsjs/go/services/Service';

export const useAppInitialize = () => {
    const [store, actions] = useAppStore();

    // ===== 初始化：加载主题 =====
    useEffect(() => {
        const loadThemes = async () => {
            try {
                const themes = await Services.GetThemes();
                actions.setThemes(themes);

                // 应用上次选中的主题
                const lastThemeId = localStorage.getItem('currentThemeId');
                if (lastThemeId) {
                    actions.applyTheme(lastThemeId);
                }
            } catch (error) {
                console.error('Failed to load themes:', error);
            }
        };

        loadThemes();
    }, [actions]);

    // ===== 初始化：检查登录状态 =====
    useEffect(() => {
        const checkLogin = async () => {
            try {
                const isLoggedIn = await Services.CheckLogin();
                if (isLoggedIn) {
                    const userInfo = await Services.GetUserInfo();
                    actions.setUserInfo(userInfo);
                }
            } catch (error) {
                console.error('Failed to check login:', error);
            }
        };

        checkLogin();
    }, [actions]);

    // ===== 初始化：加载数据 =====
    useEffect(() => {
        const loadData = async () => {
            try {
                const songs = await Services.GetSongs();
                const favorites = await Services.GetFavorites();
                const setting = await Services.GetSetting();

                actions.setSongs(songs);
                actions.setFavorites(favorites);
                actions.setSetting(setting);
            } catch (error) {
                console.error('Failed to load data:', error);
            }
        };

        loadData();
    }, [actions]);
};
```

**检查清单**：
- [ ] 创建新的 `usePlayer.ts`
- [ ] 创建新的 `usePlaylist.ts`
- [ ] 创建新的 `useAudio.ts`
- [ ] 创建 `useAppInitialize.ts`
- [ ] 删除旧的 Hook 文件
- [ ] 更新 `hooks/index.ts` 导出
- [ ] 验证所有 Hook 导入正确

---

### 🟠 阶段 3：精简 App.tsx

#### 3.1 新 App.tsx 结构（目标：<500 行）

**文件**：`frontend/src/App.tsx`

```typescript
import React, { useMemo, useRef } from "react";
import { Box, useMantineColorScheme, MantineProvider, createTheme } from "@mantine/core";
import { useAppStore } from "./hooks/useAppStore";
import { useAppInitialize } from "./hooks/ui/useAppInitialize";
import { usePlayer } from "./hooks/player/usePlayer";
import { usePlaylist } from "./hooks/player/usePlaylist";
import { useAudio } from "./hooks/player/useAudio";
import { useTheme } from "./hooks/features/useTheme";
import { useAuth } from "./hooks/features/useAuth";
import AppModals from "./components/AppModals";
import AppPanels from "./components/AppPanels";

const App: React.FC = () => {
    // ===== 获取统一 Store 和 Actions =====
    const [store, actions] = useAppStore();

    // ===== 初始化应用 =====
    useAppInitialize();

    // ===== 应用级 Hooks =====
    const player = usePlayer();
    const playlist = usePlaylist();
    const audio = useAudio();
    const theme = useTheme();
    const auth = useAuth();

    // ===== 计算派生值 =====
    const backgroundStyle = useMemo(() => ({
        backgroundImage: store.theme.backgroundImageUrl 
            ? `url(${store.theme.backgroundImageUrl})`
            : undefined,
        backgroundColor: store.theme.backgroundColor,
        opacity: store.theme.backgroundOpacity,
        filter: store.theme.backgroundBlur > 0 
            ? `blur(${store.theme.backgroundBlur}px)`
            : undefined,
    }), [store.theme]);

    const mantineTheme = useMemo(() => 
        createTheme({
            colors: {
                primary: [store.theme.themeColor],
            },
        }), 
        [store.theme.themeColor]
    );

    // ===== Props 组装：统一通过 Store 传递 =====
    const appModalsProps = {
        store,
        actions,
        handlers: {
            onLoginSuccess: () => auth.refreshUserInfo(),
            onThemeApply: (themeId: string) => actions.applyTheme(themeId),
            // ... 其他处理函数
        },
    };

    const appPanelsProps = {
        store,
        actions,
        player,
        playlist,
        handlers: {
            onPlaySong: (song) => player.playSong(song),
            onAddToQueue: (song) => playlist.addSongToQueue(song),
            // ... 其他处理函数
        },
    };

    return (
        <MantineProvider theme={mantineTheme}>
            <Box h="100vh" w="100vw" style={{ position: "relative", overflow: "hidden" }}>
                {/* 背景层 */}
                <Box
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: -1,
                        ...backgroundStyle,
                    }}
                />

                {/* 应用内容 */}
                <AppModals {...appModalsProps} />
                <AppPanels {...appPanelsProps} />
            </Box>
        </MantineProvider>
    );
};

export default App;
```

#### 3.2 迁移必要的工具函数

**文件**：`frontend/src/utils/appHelpers.ts`

```typescript
/**
 * 从 App.tsx 迁移的辅助函数
 */
import { AppStore } from '../store/types';

// 计算面板样式
export const computePanelStyle = (store: AppStore): React.CSSProperties => ({
    backgroundColor: store.theme.panelColor,
    opacity: store.theme.panelOpacity,
    backdropFilter: store.theme.panelBlur > 0 ? `blur(${store.theme.panelBlur}px)` : undefined,
    borderRadius: `${store.theme.panelRadius}px`,
});

// 计算文字颜色
export const computeTextColor = (store: AppStore, level: 'primary' | 'secondary'): string => {
    return level === 'primary' 
        ? store.theme.textColorPrimary 
        : store.theme.textColorSecondary;
};

// ... 其他计算函数
```

**检查清单**：
- [ ] 重写 `App.tsx` 使用新的 Hook
- [ ] 删除 App.tsx 中所有分散的 useState
- [ ] 迁移工具函数到 `utils/appHelpers.ts`
- [ ] 验证应用功能正常
- [ ] 检查 App.tsx 行数 < 500

---

### 🟡 阶段 4：重组组件文件结构

#### 4.1 创建新的目录结构

```bash
mkdir -p frontend/src/components/modals
mkdir -p frontend/src/components/modals/ThemeModals
mkdir -p frontend/src/components/layouts
mkdir -p frontend/src/components/cards
mkdir -p frontend/src/components/common
```

#### 4.2 重新组织模态框

**文件**：`frontend/src/components/modals/ThemeModals/index.ts`

```typescript
export { ThemeDetailModal } from './ThemeDetailModal';
export { ThemeEditorModal } from './ThemeEditorModal';
export { ThemeManagerModal } from './ThemeManagerModal';
export { useThemeModals } from './useThemeModals';
```

**文件**：`frontend/src/components/modals/ThemeModals/useThemeModals.ts`

```typescript
/**
 * 主题模态框逻辑聚合
 * 将三个主题模态框的交互逻辑整合到一个 Hook
 */
import { useState, useCallback } from 'react';
import { useAppStore } from '../../../hooks/useAppStore';

export const useThemeModals = () => {
    const [store, actions] = useAppStore();
    const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
    const [viewingThemeId, setViewingThemeId] = useState<string | null>(null);

    const handleSelectTheme = useCallback((themeId: string) => {
        actions.applyTheme(themeId);
    }, [actions]);

    const handleViewTheme = useCallback((themeId: string) => {
        setViewingThemeId(themeId);
    }, []);

    const handleEditTheme = useCallback((themeId: string) => {
        setEditingThemeId(themeId);
    }, []);

    const handleDeleteTheme = useCallback(async (themeId: string) => {
        await actions.deleteTheme(themeId);
    }, [actions]);

    const handleSaveTheme = useCallback(async (themeData) => {
        if (editingThemeId) {
            await actions.updateTheme(editingThemeId, themeData);
        } else {
            await actions.createTheme(themeData);
        }
        setEditingThemeId(null);
    }, [editingThemeId, actions]);

    return {
        editingThemeId,
        viewingThemeId,
        themes: store.theme.themes,
        
        setEditingThemeId,
        setViewingThemeId,
        handleSelectTheme,
        handleViewTheme,
        handleEditTheme,
        handleDeleteTheme,
        handleSaveTheme,
    };
};
```

#### 4.3 重新组织布局组件

**文件**：`frontend/src/components/layouts/index.ts`

```typescript
export { MainLayout } from './MainLayout';
export { TopBar } from './TopBar';
export { ControlsPanel } from './ControlsPanel';
export { PlayerBar } from './PlayerBar';
```

#### 4.4 重新组织卡片组件

**文件**：`frontend/src/components/cards/index.ts`

```typescript
export { SongDetailCard } from './SongDetailCard';
export { CurrentPlaylistCard } from './CurrentPlaylistCard';
export { FavoriteListCard } from './FavoriteListCard';
```

**检查清单**：
- [ ] 创建新的目录结构
- [ ] 移动模态框组件
- [ ] 移动布局组件
- [ ] 移动卡片组件
- [ ] 创建 `index.ts` 统一导出
- [ ] 更新所有导入路径
- [ ] 验证应用运行

---

### 🟡 阶段 5：Props 规范化和类型完善

#### 5.1 创建类型文件

**文件**：`frontend/src/types/store.ts`

```typescript
/**
 * Store 相关类型（从 store/types.ts 提炼）
 */
export interface AppStoreSnapshot {
    player: PlayerState;
    theme: ThemeState;
    modals: ModalState;
    ui: UIState;
    data: DataState;
}

export interface AppActions {
    // Player actions
    setPlayMode: (mode: PlayMode) => void;
    // ... 其他 actions
}
```

**文件**：`frontend/src/types/components.ts`

```typescript
/**
 * 组件 Props 类型
 */
import { AppStore, AppActions } from './store';

// 统一的模态框 Props
export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    store: AppStore;
    actions: AppActions;
}

// AppPanels Props
export interface AppPanelsProps {
    store: AppStore;
    actions: AppActions;
    player: PlayerHook;
    handlers: {
        onPlaySong: (song: Song) => void;
        // ... 其他处理函数
    };
}

// AppModals Props
export interface AppModalsProps {
    store: AppStore;
    actions: AppActions;
    handlers: {
        onLoginSuccess: () => void;
        // ... 其他处理函数
    };
}
```

**检查清单**：
- [ ] 创建 `types/store.ts`
- [ ] 创建 `types/components.ts`
- [ ] 创建 `types/models.ts`
- [ ] 更新所有组件的 Props 类型
- [ ] 移除重复的类型定义

---

### 🟡 阶段 6：验证、测试和优化

#### 6.1 功能测试清单

```
[ ] 播放功能
  [ ] 点击播放/暂停
  [ ] 下一首/上一首
  [ ] 拖动进度条
  [ ] 调节音量
  [ ] 修改播放模式

[ ] 歌单功能
  [ ] 创建歌单
  [ ] 添加歌曲
  [ ] 删除歌曲
  [ ] 修改歌单名称
  [ ] 拖拖排序

[ ] 主题功能
  [ ] 应用主题
  [ ] 编辑主题
  [ ] 创建自定义主题
  [ ] 删除主题
  [ ] colorScheme 切换

[ ] 模态框
  [ ] 登录
  [ ] 设置
  [ ] 搜索
  [ ] BV 添加
  [ ] 下载管理

[ ] 其他
  [ ] 首次启动初始化
  [ ] 数据持久化
  [ ] 应用关闭
```

#### 6.2 性能检查

```typescript
// 在 main.tsx 添加性能监控
import { performanceMonitor } from './utils/debug';

if (process.env.NODE_ENV === 'development') {
    performanceMonitor.start();
}

// 检查项：
// - React DevTools Profiler
// - Chrome DevTools Performance
// - Bundle 大小变化
// - 首屏渲染时间
```

#### 6.3 代码质量检查

```bash
# 运行 ESLint
pnpm eslint src/

# 运行 TypeScript 检查
pnpm tsc --noEmit

# 运行 Prettier 格式化
pnpm prettier --write src/
```

**检查清单**：
- [ ] 功能测试全部通过
- [ ] 没有控制台错误和警告
- [ ] 性能指标正常
- [ ] 代码风格一致

---

## 检查清单

### 总体检查清单

**阶段 1**
- [ ] AppStore types 定义完成
- [ ] AppContext 创建完成
- [ ] useAppStore Hook 创建完成
- [ ] AppProvider 集成到 main.tsx
- [ ] 应用启动无错误

**阶段 2**
- [ ] 合并播放器 Hook（4 个新文件）
- [ ] 删除旧的 Hook 文件
- [ ] 更新 hooks/index.ts 导出
- [ ] 所有导入路径更新正确
- [ ] 功能测试通过

**阶段 3**
- [ ] App.tsx 重写完成（< 500 行）
- [ ] 所有 useState 移除
- [ ] 分散逻辑迁移到 Hook
- [ ] 工具函数提取到 utils/
- [ ] 功能测试通过

**阶段 4**
- [ ] 新的目录结构创建完成
- [ ] 组件文件移动完成
- [ ] index.ts 统一导出创建
- [ ] 所有导入路径更新正确
- [ ] 功能测试通过

**阶段 5**
- [ ] 类型文件创建完成
- [ ] 所有 Props 接口规范化
- [ ] 类型文档补充完整
- [ ] 没有 TypeScript 错误

**阶段 6**
- [ ] 全量功能测试通过
- [ ] 性能指标检查
- [ ] 代码质量检查通过
- [ ] 文档更新完成

### 每日检查清单

**每天工作结束**
- [ ] 代码提交到 Git（附带清晰的 commit message）
- [ ] 运行 `pnpm build` 确保构建成功
- [ ] 运行 `wails dev` 验证应用启动
- [ ] 更新本文档中的进度状态

---

## 常见陷阱

### 陷阱 1：Props 向下传递时遗漏字段

**问题**：
```tsx
// ❌ 错误
const appModalsProps = {
    store,
    actions,
};

// 在组件中尝试访问 handlers，但没传递
<LoginModal {...appModalsProps} onLoginSuccess={...} />
```

**解决**：
```tsx
// ✅ 正确
const appModalsProps = {
    store,
    actions,
    handlers: {
        onLoginSuccess: () => { /* ... */ },
        onLoginFail: () => { /* ... */ },
    },
};
```

**检查方法**：
- 使用 TypeScript Props 接口，编译时会报错
- 在 Props 接口中明确标出所有必需字段

### 陷阱 2：Hook 中的闭包陷阱

**问题**：
```tsx
// ❌ 错误 - currentSong 被闭包捕获，不会更新
useEffect(() => {
    const checkSkip = () => {
        if (currentSong) {
            // currentSong 永远是初始值
        }
    };
    const timer = setInterval(checkSkip, 100);
    return () => clearInterval(timer);
}, []); // 依赖项缺失
```

**解决**：
```tsx
// ✅ 正确
useEffect(() => {
    const checkSkip = () => {
        if (currentSong) {
            // 现在 currentSong 是最新的
        }
    };
    const timer = setInterval(checkSkip, 100);
    return () => clearInterval(timer);
}, [currentSong]); // 添加依赖项
```

**检查方法**：
- 启用 ESLint 规则 `exhaustive-deps`
- 代码审查时特别关注 useEffect 依赖项

### 陷阱 3：Store 更新导致过度渲染

**问题**：
```tsx
// ❌ 错误 - 每次 store 变化，整个组件树都重新渲染
const [store, actions] = useAppStore();
// store 包含 player、theme、modals、ui、data 所有内容
// 修改任何一个字段都会导致重新渲染
```

**解决**：
```tsx
// ✅ 正确 - 使用选择器 Hook 只订阅需要的部分
const playerState = usePlayerState(); // 只订阅 player
const themeState = useThemeState();   // 只订阅 theme

// 或者在 Context 中实现选择器
export const useAppStore = (selector?: (store: AppStore) => any) => {
    const context = useContext(AppContext);
    if (selector) {
        return useMemo(() => selector(context.store), [context.store, selector]);
    }
    return context.store;
};
```

**检查方法**：
- 使用 React DevTools Profiler 检查渲染频率
- 添加 console.log 追踪渲染次数

### 陷阱 4：异步操作中的竞态条件

**问题**：
```tsx
// ❌ 错误 - 快速切换歌曲时可能加载错误的流
const playSong = async (song) => {
    const stream = await Services.GetAudioUrl(song.id); // 异步操作
    actions.setSong({ ...song, streamUrl: stream });
    // 如果此时用户切换了歌曲，stream 可能是旧的
};
```

**解决**：
```tsx
// ✅ 正确 - 使用 AbortController 或 ref 追踪最新值
const currentSongIdRef = useRef<string | null>(null);

const playSong = async (song) => {
    currentSongIdRef.current = song.id;
    const stream = await Services.GetAudioUrl(song.id);
    
    // 检查是否是最新的歌曲
    if (currentSongIdRef.current === song.id) {
        actions.setSong({ ...song, streamUrl: stream });
    }
};
```

**检查方法**：
- 快速点击切换歌曲，查看是否正常
- 检查网络请求日志

### 陷阱 5：TypeScript 类型不一致

**问题**：
```tsx
// ❌ 错误 - AppStore 类型和实际数据不匹配
interface AppStore {
    player: {
        queue: Song[];
        // ...
    };
}

// 但在某处存储的是 string[] 或 undefined
store.player.queue.map(...); // 可能崩溃
```

**解决**：
```tsx
// ✅ 正确 - 严格的类型检查和默认值
interface AppStore {
    player: {
        queue: Song[];
        currentSong: Song | null;
    };
}

// 初始化时确保所有字段存在
const initialStore: AppStore = {
    player: {
        queue: [],
        currentSong: null,
    },
};
```

**检查方法**：
- 启用 TypeScript `strictNullChecks`
- 使用 `const x = y!` 时要谨慎（非空断言）
- 代码审查时查看类型定义

---

## 验证方法

### 验证清单：代码质量

```bash
# 1. 运行 TypeScript 编译检查
pnpm tsc --noEmit

# 2. 运行 ESLint
pnpm eslint src/

# 3. 运行 Prettier 检查
pnpm prettier --check src/

# 4. 运行构建
pnpm build
```

### 验证清单：功能测试

**手动测试**：
1. 启动应用：`wails dev`
2. 按照上面"功能测试清单"逐一测试
3. 打开 DevTools 检查是否有错误

**自动化测试**（可选）：
```bash
# 如果项目配置了测试框架
pnpm test
```

### 验证清单：性能

```bash
# 使用 Chrome DevTools 检查
# 1. 打开 DevTools → Performance 标签
# 2. 点击录制
# 3. 进行一些操作（播放、切换、编辑主题等）
# 4. 停止录制
# 5. 查看帧率和渲染时间

# 预期结果：
# - 帧率 > 30 FPS
# - 单次渲染 < 50ms
# - 首屏加载 < 2s
```

### 验证清单：代码行数

```bash
# 检查 App.tsx 行数
wc -l frontend/src/App.tsx
# 预期：< 500 行

# 检查各目录文件数
find frontend/src/hooks -name "*.ts" | wc -l
# 预期：< 15 个文件

find frontend/src/components -type f -name "*.tsx" | wc -l
# 预期：组织更清晰
```

---

## 参考资源

### React Hooks 最佳实践
- [React Hooks API Reference](https://react.dev/reference/react)
- [Rules of Hooks](https://react.dev/warnings/invalid-hook-call-warning)
- [Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)

### TypeScript in React
- [TypeScript React](https://www.typescriptlang.org/docs/handbook/react.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

### 状态管理模式
- [Context API 文档](https://react.dev/learn/passing-data-deeply-with-context)
- [Zustand](https://github.com/pmndrs/zustand)（可选，如果需要更复杂的状态管理）

### 项目文档
- 相关更新：参考 [.github/copilot-instructions.md](.github/copilot-instructions.md)

---

## 进度追踪

### 当前进度

- [ ] **阶段 1**：状态管理 - 0%
- [ ] **阶段 2**：Hook 重组 - 0%
- [ ] **阶段 3**：App.tsx 精简 - 0%
- [ ] **阶段 4**：组件重组 - 0%
- [ ] **阶段 5**：类型完善 - 0%
- [ ] **阶段 6**：验证优化 - 0%

**总体进度**：0% ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜

### 更新日志

| 日期       | 阶段 | 进度     | 备注         |
| ---------- | ---- | -------- | ------------ |
| 2025-12-29 | -    | 文档创建 | 初始重构指南 |
|            |      |          |              |

---

## FAQ（常见问题）

**Q: 重构期间应用会无法使用吗？**
A: 不会。可以按阶段增量重构，每个阶段完成后都能正常运行。

**Q: 重构后会改变用户功能吗？**
A: 不会。重构是内部结构优化，用户看不到任何变化。

**Q: 我应该一次性重构所有文件，还是分步进行？**
A: 强烈建议分步进行。按照阶段顺序执行，每个阶段完成后进行测试和提交。

**Q: 如果重构中遇到问题，如何回滚？**
A: Git 提交每个阶段的成果，需要时可以 `git revert` 单个提交。

**Q: 是否需要修改后端代码？**
A: 不需要。重构仅涉及前端代码结构优化。

---

**祝重构顺利！** 🚀
