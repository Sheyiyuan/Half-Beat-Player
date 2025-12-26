# 📌 重构快速查看

> 重构文档导航和快速参考

---

## 📂 文档位置

| 文档           | 用途                  | 位置                       |
| -------------- | --------------------- | -------------------------- |
| 📋 **重构计划** | 详细的 6 阶段重构方案 | `REFACTOR.md`              |
| 🗓️ **任务看板** | 实时任务追踪和进度    | `TASK_BOARD.md`            |
| 📌 **本文件**   | 快速导航和概览        | `REFACTOR_INDEX.md` (本文) |

---

## 🎯 当前阶段

### Phase 1: UI 组件拆分 (进行中 🔵)

**目标**: App.tsx 2935 行 → <1500 行

#### 4 个主要任务

```
┌─────────────────────────────────────────┐
│ Task 1: TopBar 提取 (1h)                │
│ 状态: 🔵 未开始                          │
├─────────────────────────────────────────┤
│ Task 2: Sidebar 提取 (1-2h)             │
│ 状态: 🔵 未开始 (等待 Task 1)            │
├─────────────────────────────────────────┤
│ Task 3: PlayerControlPanel 提取 (1-2h) │
│ 状态: 🔵 未开始 (可并行 Task 2)          │
├─────────────────────────────────────────┤
│ Task 4: SongListContainer 提取 (2-3h)  │
│ 状态: 🔵 未开始 (等待 1,2 完成)          │
└─────────────────────────────────────────┘
```

**预计完成**: 2025-12-29  
**总耗时**: ~6-9 小时

---

## 🚀 快速开始

### 立即开始 P1-Task 1 (TopBar 提取)

```bash
# 1. 查看详细任务说明
cat TASK_BOARD.md | grep -A 20 "Task P1-1"

# 2. 创建新组件文件
touch frontend/src/components/TopBar.tsx

# 3. 查看 App.tsx 中的相关代码
code frontend/src/App.tsx  # 搜索 "TopBar" 或 "Settings"

# 4. 提取后测试
cd frontend
pnpm build

# 5. 在开发模式测试
wails dev
```

---

## 📊 项目规模

**当前**:
```
App.tsx:            2935 行 ❌ 过大
组件总数:           9 个
Hooks:             15 个
Utils:             3 个
总代码行数:        ~8KB
```

**P1 完成后**:
```
App.tsx:           <1500 行 ✅
组件总数:          13 个
Hooks:            15 个（暂无变化）
Utils:            3 个
总代码行数:       ~9KB
```

**完全重构后**:
```
App.tsx:           <1000 行 ✅✅
组件总数:          15+ 个
Hooks:            20+ 个
Context:          3 个
Utils:            3 个
Types:            4 个
总代码行数:       ~10KB
```

---

## 🔄 重构路线图

```
开始 (2025-12-25)
    ↓
[P1] UI 组件拆分 (3-4 天) ←─── 👈 当前
    ├── TopBar
    ├── Sidebar
    ├── PlayerControlPanel
    └── SongListContainer
    ↓
[P2] 状态管理优化 (2-3 天)
    ├── AppContext
    ├── ThemeContext
    └── ModalContext
    ↓
[P3] 业务逻辑提取 (2 天)
    ├── usePlaybackControl
    ├── useSearchAndFilter
    ├── useKeyboardShortcuts
    └── useFileOperations
    ↓
[P4] 类型系统优化 (1 天)
    ├── types/models.ts
    ├── types/ui.ts
    ├── types/api.ts
    └── types/hooks.ts
    ↓
[P5] 性能优化 (1-2 天)
    ├── React.memo 应用
    ├── useCallback/useMemo 优化
    └── 代码分割
    ↓
[P6] 测试和文档 (1-2 天)
    ├── 单元测试
    ├── 集成测试
    └── 文档完善
    ↓
完成 (2025-12-31) ✅
```

---

## ✅ 检查清单

### 在开始 P1 之前

- [ ] 备份当前代码 (`git commit` + 新分支)
- [ ] 环境准备就绪 (`pnpm install` 完成)
- [ ] 开发服务能正常启动 (`wails dev` 成功)
- [ ] 理解现有 App.tsx 结构
- [ ] 熟悉 5+ 个关键 hooks 的用途

### 每个任务完成后

- [ ] 编译成功 (`pnpm build`)
- [ ] 开发环境运行正常 (`wails dev`)
- [ ] 功能完整（原有功能都保留）
- [ ] 类型检查通过 (`pnpm tsc --noEmit`)
- [ ] 代码审查（如适用）
- [ ] 更新 TASK_BOARD.md

### P1 阶段完成后

- [ ] App.tsx 行数 < 1500
- [ ] 所有新组件正确导入
- [ ] 编译和运行测试通过
- [ ] 功能验证完成
- [ ] 更新 REFACTOR.md 进度

---

## 📖 关键概念回顾

### App.tsx 现状

- **行数**: 2935 (过大)
- **职责**: 包含所有 UI、状态、事件处理
- **问题**: 难以维护、难以测试、难以复用

### 目标状态

- **行数**: <1000 (理想)
- **职责**: 仅做顶层布局和 Context 提供
- **优势**: 易维护、易测试、组件可复用

### 关键分离

```
原来:                      分离后:
App.tsx (2935 行)         App.tsx (1000 行)
├── UI 逻辑  ────────→    ├── TopBar.tsx
├── 状态管理 ────────→    ├── Sidebar.tsx
├── 业务逻辑 ────────→    ├── PlayerControlPanel.tsx
└── 事件处理 ────────→    ├── SongListContainer.tsx
                          ├── Context/*
                          ├── hooks/*
                          └── utils/*
```

---

## 🐛 常见问题

### Q1: 如何安全地提取组件？

**A**: 
1. 识别清晰的功能边界
2. 准备所需的 props 和 state
3. 逐块移动代码
4. 每步都测试编译
5. 保留原有 JSX 作为对比

### Q2: 如何处理共享状态？

**A**: 
- P1 阶段：通过 props 传递（虽然深）
- P2 阶段：迁移到 Context
- P3 阶段：进一步优化到 custom hooks

### Q3: 如何确保功能不回归？

**A**:
1. 提取前记录功能点
2. 提取后逐一测试
3. 对比 UI 和交互
4. 监听控制台错误

### Q4: 万一出错怎么办？

**A**:
1. Git 恢复: `git checkout -- .`
2. 回到上一个 commit: `git reset --hard HEAD~1`
3. 新建分支重试

---

## 💡 最佳实践

### ✅ 要做

- ✅ 小步快走，每个组件一次提取
- ✅ 编译后立即测试
- ✅ 保持 TypeScript 类型完整
- ✅ 使用 git 保存进度
- ✅ 记录每个决策

### ❌ 不要做

- ❌ 同时提取多个组件
- ❌ 在提取时改变功能逻辑
- ❌ 忽略编译警告
- ❌ 过度优化 props 结构
- ❌ 跳过测试环节

---

## 📞 获取帮助

### 我需要...

| 需求           | 查看                            | 命令                                  |
| -------------- | ------------------------------- | ------------------------------------- |
| 详细的重构计划 | REFACTOR.md                     | `cat REFACTOR.md`                     |
| 当前任务进度   | TASK_BOARD.md                   | `cat TASK_BOARD.md`                   |
| 快速导航       | 本文件                          | `cat REFACTOR_INDEX.md`               |
| 项目背景       | .github/copilot-instructions.md | `cat .github/copilot-instructions.md` |
| Hook 说明      | frontend/src/hooks/*/README.md  | 待补充                                |

---

## 🎓 学习资源

### 推荐阅读

1. **React 最佳实践**: 
   - 组件拆分原则
   - Hooks 使用指南
   - Context API 进阶

2. **TypeScript 最佳实践**:
   - 泛型编程
   - 类型推导
   - 函数式编程

3. **本项目特定**:
   - Wails 框架 (Go <-> TypeScript 通信)
   - Mantine UI 组件库
   - Vite 构建系统

---

## 📅 里程碑

| 里程碑       | 日期       | 状态     | 备注           |
| ------------ | ---------- | -------- | -------------- |
| 文档初始化   | 2025-12-25 | ✅ 完成   | 本文档         |
| P1 开始      | 2025-12-25 | 🔵 待启动 | TopBar 提取    |
| P1 完成      | 2025-12-29 | 🔵 预计   | App.tsx < 1500 |
| P2 完成      | 2026-01-01 | 🔵 预计   | Context 集成   |
| 完全重构完成 | 2026-01-05 | 🔵 预计   | P6 完成        |

---

## 🎯 下一步

### 立即行动

```
1. 阅读 TASK_BOARD.md 了解第一个任务
2. 创建 frontend/src/components/TopBar.tsx
3. 从 App.tsx 中提取 TopBar 相关代码
4. 测试编译和功能
5. 更新 TASK_BOARD.md 进度
```

### 问题反馈

如有疑问或遇到阻塞：
1. 检查 TASK_BOARD.md 的"风险和阻塞"部分
2. 查看相关的 Git commit 历史
3. 运行 `pnpm build` 查看具体错误
4. 检查类型是否正确

---

**状态**: ✅ 文档完成，🚀 准备开始执行  
**最后更新**: 2025-12-25 12:35  
**下次更新**: 完成 Task P1-1 后

