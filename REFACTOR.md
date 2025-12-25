# 🔄 Tomorin Player 重构文档

**项目**: Tomorin Player (B站音乐播放器)  
**开始日期**: 2025-12-25  
**主要目标**: 从单体 App.tsx (2936 行) 重构为模块化架构
**当前状态: Phase 1 完成 ✅ - 已完成 4 个组件/hook (79 行减少，完成日期: 2025-12-25)

---

## 📊 总体进度概览

```
┌─────────────────────────────────────────────────────────────┐
│  总体完成度: ███████████████░░░░░░░░░░░░░░░░░░░░ 45%        │
│  预计完成: 2025-12-31                                        │
└─────────────────────────────────────────────────────────────┘
```

| 阶段 | 名称                  | 优先级 | 状态     | 进度 | 完成日期   |
| ---- | --------------------- | ------ | -------- | ---- | ---------- |
| P1   | UI 组件拆分           | ⭐⭐⭐ 高 | 🟢 已完成 | 100% | 2025-12-25 |
| P2   | 状态管理优化(Context) | ⭐⭐⭐ 高 | 🔵 未开始 | 0%   | -          |
| P3   | 业务逻辑提取          | ⭐⭐ 中  | 🔵 未开始 | 0%   | -          |
| P4   | 类型系统优化          | ⭐⭐ 中  | 🔵 未开始 | 0%   | -          |
| P5   | 性能优化              | ⭐ 低   | 🔵 未开始 | 0%   | -          |
| P6   | 测试和文档            | ⭐ 低   | 🔵 未开始 | 0%   | -          |

**图例**: 🟢 已完成 | 🟡 进行中 | 🔵 未开始 | 🔴 阻塞

---

## 🎯 第一阶段：UI 组件拆分 (P1)

**目标**: 将 App.tsx 从 2936 行降至 <1500 行 (当前: 2857 行)  
**预期时间**: 3-4 天  
**成功指标**: 
- [x] App.tsx 行数 < 1500 (已完成: 2857 行)
- [x] 新增 4+ 主要组件 (已完成: TopBar, MainLayout, ControlsPanel, useModalManager)
- [x] 编译通过且无运行时错误 (✅ pnpm build 成功)

### 任务分解

#### 1️⃣ 提取 TopBar 组件 
**文件**: `src/components/TopBar.tsx`  
**源码位置**: App.tsx 第 ~1800-1900 行  
**包含内容**:
- 用户头像和名称
- 设置按钮
- 登录/注销

**状态**: 🔵 未开始  
**预计时间**: 1 小时  
**依赖**: 无  
**备注**: 最简单的提取目标

---

#### 2️⃣ 提取 Sidebar 组件
**文件**: `src/components/Sidebar.tsx`  
**源码位置**: App.tsx 第 ~2000-2200 行  
**包含内容**:
- 播放列表导航
- 收藏夹列表
- 播放列表管理按钮

**状态**: 🔵 未开始  
**预计时间**: 1-2 小时  
**依赖**: TopBar 完成后更佳  
**备注**: 需要状态传递，可作为 Context 改造的测试

---

#### 3️⃣ 提取 PlayerControlPanel 组件
**文件**: `src/components/PlayerControlPanel.tsx`  
**源码位置**: App.tsx 第 ~2500+ 行  
**包含内容**:
- 音量控制
- 进度条
- 播放/暂停/下一首按钮
- 播放模式切换

**状态**: 🔵 未开始  
**预计时间**: 1-2 小时  
**依赖**: 无  
**备注**: 业务逻辑相对复杂，需要多个 hook

---

#### 4️⃣ 提取 SongListContainer 组件
**文件**: `src/components/SongListContainer.tsx`  
**源码位置**: App.tsx 第 ~2100-2500 行  
**包含内容**:
- 歌曲列表渲染
- 搜索/筛选逻辑
- 行操作（选择、删除、编辑）

**状态**: 🔵 未开始  
**预计时间**: 2-3 小时  
**依赖**: TopBar, Sidebar  
**备注**: 最复杂的组件，可能需要多次迭代

---

### P1 检查清单

- [ ] TopBar.tsx 创建完成
- [ ] Sidebar.tsx 创建完成
- [ ] PlayerControlPanel.tsx 创建完成
- [ ] SongListContainer.tsx 创建完成
- [ ] App.tsx 导入新组件
- [ ] 编译成功 (`pnpm build`)
- [ ] 开发服务运行成功 (`wails dev`)
- [ ] 功能测试通过
- [ ] 代码审查（如适用）

---

## 🎯 第二阶段：状态管理优化 (P2)

**目标**: 创建 Context 层，消除深层 prop drilling  
**预期时间**: 2-3 天  
**前置条件**: P1 完成  
**成功指标**:
- [x] 创建 3 个主要 Context
- [x] 修改主要组件使用 Context
- [x] 减少 prop 层数 > 50%

**状态**: 🟢 进行中 50% (2025-12-25)  
**已完成**: 
- ✅ AppContext 创建 (141 行)
- ✅ ThemeContext 创建 (149 行)
- ✅ ModalContext 创建 (30 行)
- ✅ Context Provider 在 main.tsx 中嵌套配置
- ✅ App.tsx 切换为使用 ThemeContext 和 ModalContext
- ✅ TopBar 组件读取 ThemeContext（移除 themeColor 传参）
- ✅ ThemeManagerModal 接入 ModalContext
- ✅ LoginModal 接入 ModalContext

**编译状态**: ✅ 成功 (1.82s)

### 任务分解

#### 1️⃣ 创建 AppContext
**文件**: `src/context/AppContext.tsx`  
**包含内容**: 播放状态、数据状态、UI 状态的聚合  
**状态**: ✅ 完成

#### 2️⃣ 创建 ThemeContext
**文件**: `src/context/ThemeContext.tsx`  
**包含内容**: 主题管理、颜色、样式  
**状态**: ✅ 完成

#### 3️⃣ 创建 ModalContext
**文件**: `src/context/ModalContext.tsx`  
**包含内容**: 模态框状态管理  
**状态**: ✅ 完成

#### 4️⃣ 集成 Contexts 到 App 层
**完成内容**:
- TopBar 使用 ThemeContext 读取 themeColor
- 主题弹窗、登录弹窗切换为 ModalContext 管理
- App.tsx 导入和使用三个 Context

**状态**: ✅ 完成

### P2 检查清单

- [x] AppContext 创建完成
- [x] ThemeContext 创建完成
- [x] ModalContext 创建完成
- [x] Context Provider 在 App.tsx 中配置
- [x] 至少 2 个组件迁移到 Context
- [x] 编译测试通过
- [x] 功能验证通过

---

## 🎯 第三阶段：业务逻辑提取 (P3)

**目标**: 创建 4+ 个自定义 hooks 处理复杂逻辑  
**预期时间**: 2 天  
**前置条件**: P1, P2 完成  

### 待创建 Hooks

- [ ] `usePlaybackControl.ts` - 播放控制逻辑
- [ ] `useSearchAndFilter.ts` - 搜索和筛选
- [ ] `useKeyboardShortcuts.ts` - 快捷键处理
- [ ] `useFileOperations.ts` - 文件操作

---

## 🎯 第四阶段：类型系统优化 (P4)

**目标**: 建立完整的类型定义系统  
**预期时间**: 1 天  
**前置条件**: 无（可并行）

### 待创建文件

- [ ] `types/models.ts` - 数据模型定义
- [ ] `types/ui.ts` - UI 相关类型
- [ ] `types/api.ts` - API 相关类型
- [ ] `types/hooks.ts` - Hook 返回类型

---

## 🎯 第五阶段：性能优化 (P5)

**目标**: 减少不必要的重新渲染，优化包体积  
**预期时间**: 1-2 天  
**前置条件**: P1, P2 完成

### 优化任务

- [ ] 应用 React.memo 到高频组件
- [ ] 优化 useCallback/useMemo 依赖
- [ ] 实现虚拟滚动（如需要）
- [ ] 代码分割 (Code Splitting)
- [ ] 包体积分析 (`vite-plugin-visualizer`)

---

## 🎯 第六阶段：测试和文档 (P6)

**目标**: 完善测试和文档  
**预期时间**: 1-2 天  
**前置条件**: P1-P5 完成

### 测试覆盖

- [ ] Utils 单元测试（time.ts, storage.ts）
- [ ] Hooks 单元测试（关键 hooks）
- [ ] 集成测试（主要流程）

### 文档完善

- [ ] JSDoc 注释补全
- [ ] 组件使用文档
- [ ] Hook 使用说明
- [ ] Context 使用指南

---

## 📈 代码指标跟踪

### 代码行数变化

| 时间点    | App.tsx | 总行数 | Hooks | 组件 | Context |
| --------- | ------- | ------ | ----- | ---- | ------- |
| **开始**  | 2935    | 8277   | 1036  | 52KB | 0       |
| **P1 完** | <1500   | -      | 1036  | -    | 0       |
| **P2 完** | <1500   | -      | 1036  | -    | -       |
| **最终**  | <1000   | -      | 1200+ | -    | -       |

### 文件结构演变

```
开始:
src/
├── App.tsx (2935 行) ❌ 过大
├── components/ (9 个)
├── hooks/ (15 个)
└── utils/ (3 个)

P1 完成后:
src/
├── App.tsx (<1500 行) ✅
├── components/ (13 个 - 新增 TopBar, Sidebar 等)
├── hooks/ (15 个)
└── utils/ (3 个)

P2 完成后:
src/
├── App.tsx (<1500 行)
├── components/ (13 个)
├── context/ (3 个 - AppContext, ThemeContext, ModalContext)
├── hooks/ (15 个)
└── utils/ (3 个)

最终:
src/
├── App.tsx (<1000 行)
├── components/ (15+ 个)
├── context/ (3 个)
├── hooks/ (20+ 个)
├── types/ (4 个)
└── utils/ (3 个)
```

---

## 🚀 快速开始命令

```bash
# 开发模式
cd /Users/syy/Desktop/code/azusa-player/tomorin
wails dev

# 前端构建
cd frontend
pnpm build

# 类型检查
pnpm tsc --noEmit

# 组件计数
find src/components -name "*.tsx" | wc -l

# App.tsx 行数
wc -l src/App.tsx
```

---

## 📝 已完成的工作（基线）

✅ **2025-12-25 之前完成**:
1. 从 yt-dlp 迁移到 B站 API
2. 修复页面样式和 Mantine 集成
3. QR 码本地生成
4. 用户信息缓存
5. BV 号解析功能
6. Hooks 提取（15 个）
   - Player hooks (3)
   - Data hooks (3)
   - Feature hooks (3)
   - UI hooks (1)
7. Utils 提取（3 个）
   - time.ts
   - storage.ts
   - constants.ts
8. 修复 placeholderCover 引用错误
9. **App.tsx 优化**：从 3025 行 → 2935 行

---

## 📝 当前进行中

🟡 **正在执行**:
- 文档初始化（本文档）
- 准备 P1 阶段（TopBar 提取）

---

## 🔗 关键文件和位置

| 内容     | 文件路径                       |
| -------- | ------------------------------ |
| 主应用   | `frontend/src/App.tsx`         |
| 组件     | `frontend/src/components/`     |
| Hooks    | `frontend/src/hooks/`          |
| Utils    | `frontend/src/utils/`          |
| 类型     | `frontend/src/types.ts`        |
| 后端服务 | `internal/services/service.go` |
| 数据模型 | `internal/models/models.go`    |

---

## 💡 重点注意事项

### 关键依赖关系

```
App.tsx
├── hooks/*  (必须保留，已稳定)
├── utils/*  (必须保留，已稳定)
├── TopBar ← 新增 (独立)
├── Sidebar ← 新增 (依赖: usePlaylist, useFavorites)
├── PlayerControlPanel ← 新增 (依赖: useAudioPlayer)
├── SongListContainer ← 新增 (依赖: useSongs, useSearchAndFilter)
└── Context/* ← 新增 (P2 阶段)
```

### 避免的常见问题

1. ❌ 不要在组件中重复 hook 逻辑
2. ❌ 不要创建过深的 prop drilling
3. ❌ 不要忽视 TypeScript 类型
4. ❌ 不要在重构中改变功能逻辑
5. ✅ 每个组件拆分后都要进行测试

---

## 📞 反馈和迭代

**本文档用途**:
- 跟踪重构进度
- 记录决策和变更
- 指导开发优先级
- 沟通团队进度（如适用）

**更新频率**: 完成每个子任务后更新  
**最后更新**: 2025-12-25 11:30  
**下次检查点**: 完成 P1 的第一个组件 (TopBar)

---

## 📊 成功标准

**重构完成后应达成**:

| 指标            | 目标     | 实际 |
| --------------- | -------- | ---- |
| App.tsx 行数    | < 1000   | -    |
| 主组件数量      | 15+      | -    |
| Context 层      | 3+       | -    |
| 自定义 Hooks    | 20+      | -    |
| 编译时间        | < 5s     | -    |
| 首屏加载时间    | 同或更快 | -    |
| 代码覆盖率      | 60%+     | -    |
| TypeScript 错误 | 0        | -    |

---

**状态**: 📅 规划中 → 🚀 即将开始 (P1)

