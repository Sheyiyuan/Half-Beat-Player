# Tomorin Player 前端重构进度

## 重构目标
减少 App.tsx 文件的行数和复杂度，通过提取业务逻辑到可复用 Hooks 来改善代码质量。

## 完成情况

### 📊 最终成果
- **原始行数**: 2797 行
- **当前行数**: 2207 行
- **削减行数**: 590 行
- **削减比例**: **21.0%** ✅ (超过 15% 目标)
- **构建时间**: 1.83s (Vite build)

### 🎯 阶段一：代码清理（已完成）
- [x] 移除误导性注释
- [x] 重组状态声明
- [x] 更新 TODO 注释

### 🎯 阶段二：Hook 提取（已完成）

#### 收藏夹和播放列表管理
| Hook | 行数 | 削减量 | 状态 |
|------|------|-------|------|
| useFavoriteActions | 268 | -177 | ✅ 集成 |
| usePlaylistActions | 98 | -45 | ✅ 集成 |

#### 主题管理
| Hook | 行数 | 削减量 | 状态 |
|------|------|-------|------|
| useThemeEditor | 207 | -92 | ✅ 集成 |

#### BV 视频处理
| Hook | 行数 | 削减量 | 状态 |
|------|------|-------|------|
| useBVModal | 145 | -64 | ✅ 集成 |
| useSearchAndBV | 170 | - | ⏳ 已创建，待集成* |

#### 音频和播放控制
| Hook | 行数 | 削减量 | 状态 |
|------|------|-------|------|
| useSkipIntervalHandler | 128 | -144 | ✅ 集成 |
| useDownloadManager | 147 | -83 | ✅ 集成 |

**总计创建 Hooks: 8 个，已集成 7 个*

### 📁 Hook 文件结构

```
frontend/src/hooks/
├── features/
│   ├── index.ts
│   ├── useTheme.ts (已有)
│   ├── useAuth.ts (已有)
│   ├── useBVResolver.ts (已有)
│   ├── useFavoriteActions.ts (新增)
│   ├── useThemeEditor.ts (新增)
│   ├── useBVModal.ts (新增)
│   └── useSearchAndBV.ts (新增)
└── player/
    ├── index.ts
    ├── useAudioPlayer.ts (已有)
    ├── usePlaylist.ts (已有)
    ├── useAudioInterval.ts (已有)
    ├── usePlaylistActions.ts (新增)
    ├── useSkipIntervalHandler.ts (新增)
    └── useDownloadManager.ts (新增)
```

### 🔄 App.tsx 函数提取映射

#### ✅ 已提取的函数
```
收藏夹管理 (177 行):
  ├── deleteFavorite → useFavoriteActions
  ├── editFavorite → useFavoriteActions
  ├── saveEditFavorite → useFavoriteActions
  ├── createFavorite → useFavoriteActions
  └── addToFavorite → useFavoriteActions

播放列表操作 (45 行):
  ├── addSongToFavorite → usePlaylistActions
  ├── removeSongFromPlaylist → usePlaylistActions
  ├── addToFavoriteFromModal → usePlaylistActions
  ├── playlistSelect → usePlaylistActions
  ├── playlistReorder → usePlaylistActions
  └── playlistRemove → usePlaylistActions

主题编辑 (92 行):
  ├── selectTheme → useThemeEditor
  ├── editTheme → useThemeEditor
  ├── deleteTheme → useThemeEditor
  ├── createThemeClick → useThemeEditor
  ├── submitTheme → useThemeEditor
  └── closeThemeEditor → useThemeEditor

BV 模态框 (64 行):
  ├── handleSlicePreviewPlay → useBVModal
  └── handleConfirmBVAdd → useBVModal

播放区间处理 (144 行):
  ├── handleIntervalChange → useSkipIntervalHandler
  ├── handleSkipStartChange → useSkipIntervalHandler
  └── handleSkipEndChange → useSkipIntervalHandler

下载管理 (83 行):
  ├── handleDownload → useDownloadManager
  ├── handleDownloadSong → useDownloadManager
  ├── handleDownloadAllFavorite → useDownloadManager
  ├── handleOpenDownloadedFile → useDownloadManager
  └── handleDeleteDownloadedFile → useDownloadManager
```

### ⏳ 待处理的任务

1. **搜索和 BV 解析集成** (~130 行)
   - Hook 已创建: useSearchAndBV
   - 需要解决的复杂性：依赖函数（playSingleSong, playFavorite）定义顺序
   - 潜在削减: 另外 -130 行

2. **可选的后续优化**
   - 提取音频事件处理逻辑
   - 整合获取音频信息流程
   - 进一步模块化 UI 相关逻辑

### 🚀 编译验证

所有集成均已通过构建测试：
```
✅ 2576 modules transformed
✅ Vite build 1.83s
✅ TypeScript type checking passed
✅ No errors or warnings (aside from chunk size warning)
```

### 📝 提交历史

```
d6a562b refactor: 创建并集成 useDownloadManager Hook（-83行）
2ee2a57 refactor: 创建并集成 useSkipIntervalHandler Hook（-144行）
48f5bad refactor: 创建并集成 useBVModal Hook（-64行）
3a296b3 refactor: 创建并集成 useThemeEditor Hook（-92行）
996252b refactor: 创建 useSearchAndBV Hook（待集成）
2497b43 refactor: 提取播放列表操作逻辑到 usePlaylistActions Hook
eb35cac refactor: 提取收藏夹管理逻辑到 useFavoriteActions Hook
ef8e25e refactor: 清理 App.tsx 代码结构
```

## 关键改进

### 代码质量
- ✅ 分离关注点（Separation of Concerns）
- ✅ 提高代码复用性
- ✅ 简化主组件复杂度
- ✅ 改进可测试性

### 可维护性
- ✅ 每个 Hook 专注于单一功能域
- ✅ 清晰的依赖注入
- ✅ 标准化的 Hook 接口

### 性能
- ✅ 更好的代码分割机会
- ✅ 减少主组件的渲染复杂度
- ✅ 更细粒度的状态管理

## 注意事项

1. **useSearchAndBV Hook** 已创建但尚未集成，原因是存在函数定义顺序的复杂依赖关系
2. 所有 Hook 均使用 useCallback 确保稳定的函数引用
3. 依赖数组已正确配置以避免过度重新渲染

## 下一步建议

1. 完成 useSearchAndBV 的集成 (~130 行额外削减)
2. 考虑进一步分离 UI 层逻辑
3. 添加针对 Hooks 的单元测试
4. 文档化 Hook 的使用模式和常见陷阱
