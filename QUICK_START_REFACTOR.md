# 前端重构 - 5 分钟快速开始

> ⚡ 没时间？从这里开始！

## 🎯 重构是什么？

**现状**：App.tsx 有 1103 行，45 个 useState，30 个 Hook 导入  
**目标**：精简到 <500 行，1 个 useAppStore，5-8 个 Hook 导入  
**周期**：5-7 个工作日

## 📚 我应该读哪个文档？

### 🟢 5-10 分钟快速了解
- **读这个**：[REFACTOR_QUICK_REFERENCE.md](REFACTOR_QUICK_REFERENCE.md)
- **看这个**：本文档的"核心改动"部分

### 🟡 30 分钟深入理解
- **必读**：[FRONTEND_REFACTOR_GUIDE.md](FRONTEND_REFACTOR_GUIDE.md)
- **参考**：[DIRECTORY_STRUCTURE_CHANGES.md](DIRECTORY_STRUCTURE_CHANGES.md)

### 🔴 要开始重构了
- **打开**：[REFACTOR_EXECUTION_CHECKLIST.md](REFACTOR_EXECUTION_CHECKLIST.md)
- **保存**：[REFACTOR_QUICK_REFERENCE.md](REFACTOR_QUICK_REFERENCE.md)

## 🔑 核心改动（一页纸版）

### 1️⃣ 状态管理（最关键）

**现在**：
```tsx
const [setting, setSetting] = useState(...);
const [searchQuery, setSearchQuery] = useState("");
// ... 40+ 更多 state
```

**之后**：
```tsx
const [store, actions] = useAppStore();
// 所有状态都在 store 中，通过 actions 修改
```

### 2️⃣ Hook 简化

**现在**：从 30 个文件导入 30 个 Hook  
**之后**：从 5-8 个文件导入 5-8 个 Hook

### 3️⃣ Props 精简

**现在**：MainLayout 接收 50+ 个 Props  
**之后**：接收 1-2 个 Props（store 和 actions）

### 4️⃣ 组件分类

**现在**：22 个组件混在 `/components/` 目录下  
**之后**：
```
components/
├── modals/        (模态框)
├── layouts/       (布局)
├── cards/         (卡片)
└── common/        (通用)
```

## 📋 6 个阶段概览

| 阶段 | 任务 | 天数 | 优先级 |
|------|------|------|--------|
| 1 | 创建 Store + Context + useAppStore | 1-2 | 🔴 |
| 2 | 合并 13 个 Hook 为 4 个 | 1-2 | 🟠 |
| 3 | 精简 App.tsx (1103 → <500 行) | 1 | 🟠 |
| 4 | 重组组件目录结构 | 1 | 🟡 |
| 5 | 规范 Props 和类型 | 1 | 🟡 |
| 6 | 验证和测试 | 1 | 🟡 |

## 🚀 如何开始？

### 第 1 步：准备（10 分钟）

```bash
# 创建新分支
git checkout -b refactor/frontend-restructuring

# 确保可以构建
pnpm build
wails dev
```

### 第 2 步：阅读指南（30 分钟）

1. 阅读 [FRONTEND_REFACTOR_GUIDE.md](FRONTEND_REFACTOR_GUIDE.md) 的：
   - "重构目标"
   - "当前问题分析"
   - "分阶段重构计划"

2. 查看 [DIRECTORY_STRUCTURE_CHANGES.md](DIRECTORY_STRUCTURE_CHANGES.md) 的目录对比

### 第 3 步：打印清单（2 分钟）

打印 [REFACTOR_QUICK_REFERENCE.md](REFACTOR_QUICK_REFERENCE.md)  
放在显示器旁边

### 第 4 步：分阶段执行（5-7 天）

按照 [REFACTOR_EXECUTION_CHECKLIST.md](REFACTOR_EXECUTION_CHECKLIST.md) 逐阶段执行

每个阶段大约 1 天，每天工作 8 小时

### 第 5 步：完成验证（1 天）

按照检查清单验证所有功能

## ⚠️ 最常见的 3 个错误

### ❌ 错误 1：忘记在 main.tsx 添加 AppProvider

```tsx
// 错误
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App /> // ❌ 没有 AppProvider
)

// 正确
ReactDOM.createRoot(document.getElementById('root')!).render(
  <AppProvider>
    <App />
  </AppProvider>
)
```

### ❌ 错误 2：在组件中不解构 store

```tsx
// 错误
const MyComponent = (props) => {
  const store = props.store; // ❌ 无法访问 store.player
}

// 正确
const MyComponent = ({ store, actions }) => {
  const { currentSong } = store.player; // ✅
}
```

### ❌ 错误 3：还在使用旧的 Hook

```tsx
// 错误
import { useAudioPlayer, usePlaylist } from './hooks/player'; // ❌ 已删除

// 正确
import { usePlayer, usePlaylist } from './hooks/player'; // ✅
```

## 🔍 遇到问题怎么办？

### 问题 1：应用无法启动
→ 检查 AppProvider 是否正确集成到 main.tsx

### 问题 2：某个 Hook 找不到
→ 检查是否已从 hooks/index.ts 导出

### 问题 3：组件收不到状态
→ 检查是否在组件中调用了 useAppStore

### 问题 4：编译错误
→ 运行 `pnpm tsc --noEmit` 查看详细错误

### 更多帮助
→ 查阅 [REFACTOR_QUICK_REFERENCE.md](REFACTOR_QUICK_REFERENCE.md) 的"常见错误"表

## 📊 进度跟踪

### 保存这个链接

```
每天工作完成后，更新：
□ 阶段 1 - Store ________%
□ 阶段 2 - Hook ________%
□ 阶段 3 - App ________%
□ 阶段 4 - 组件 ________%
□ 阶段 5 - 类型 ________%
□ 阶段 6 - 验证 ________%
```

## 💻 每日检查清单

**工作开始**
- [ ] 查看 [REFACTOR_EXECUTION_CHECKLIST.md](REFACTOR_EXECUTION_CHECKLIST.md) 今天的任务
- [ ] 运行 `pnpm build` 确保构建成功
- [ ] 打开今天的代码任务

**工作进行中**
- [ ] 每小时运行 `pnpm build` 检查
- [ ] 每小时 `git commit -m "progress: ..."` 保存进度

**工作结束**
- [ ] 运行 `pnpm build` 最终检查
- [ ] 运行 `pnpm tsc --noEmit` 检查类型
- [ ] `git commit` 提交当日工作
- [ ] 更新进度表

## 🎯 最终检验

完成重构后，确保：

```
✅ App.tsx < 500 行（从 1103 行）
✅ 没有分散的 useState（合并到 useAppStore）
✅ Hook 导入 < 10 个（从 30+ 个）
✅ MainLayout Props < 5 个（从 50+ 个）
✅ 所有功能正常
✅ 没有 TypeScript 错误
✅ 没有 ESLint 错误
```

## 📖 完整文档

| 文档 | 用途 |
|------|------|
| [FRONTEND_REFACTOR_GUIDE.md](FRONTEND_REFACTOR_GUIDE.md) | 完整详细指南 |
| [REFACTOR_QUICK_REFERENCE.md](REFACTOR_QUICK_REFERENCE.md) | ⭐ 快速查阅（建议打印） |
| [REFACTOR_EXECUTION_CHECKLIST.md](REFACTOR_EXECUTION_CHECKLIST.md) | ⭐ 分阶段执行清单（建议打印） |
| [DIRECTORY_STRUCTURE_CHANGES.md](DIRECTORY_STRUCTURE_CHANGES.md) | 目录对比 |
| [REFACTOR_DOCUMENTATION_INDEX.md](REFACTOR_DOCUMENTATION_INDEX.md) | 文档导航 |

---

## 🎓 推荐阅读顺序

```
现在就读
├─ 本文档（5 分钟）
└─ REFACTOR_QUICK_REFERENCE.md（10 分钟）
        ↓
准备开始
├─ FRONTEND_REFACTOR_GUIDE.md 的"重构目标"部分（10 分钟）
├─ DIRECTORY_STRUCTURE_CHANGES.md（15 分钟）
└─ FRONTEND_REFACTOR_GUIDE.md 完整版（30 分钟）
        ↓
开始重构
├─ 打印 REFACTOR_QUICK_REFERENCE.md
├─ 打印 REFACTOR_EXECUTION_CHECKLIST.md
└─ 按照 checklist 逐阶段执行（5-7 天）
```

---

## 🚀 立即行动

### 现在（5 分钟）

1. 阅读本文档
2. 查看 [REFACTOR_QUICK_REFERENCE.md](REFACTOR_QUICK_REFERENCE.md)

### 今天（1 小时）

1. 创建分支：`git checkout -b refactor/frontend-restructuring`
2. 完整阅读 [FRONTEND_REFACTOR_GUIDE.md](FRONTEND_REFACTOR_GUIDE.md)
3. 查看 [DIRECTORY_STRUCTURE_CHANGES.md](DIRECTORY_STRUCTURE_CHANGES.md)
4. 准备 git 环境

### 明天开始（8 小时 × 5-7 天）

1. 按照 [REFACTOR_EXECUTION_CHECKLIST.md](REFACTOR_EXECUTION_CHECKLIST.md) 执行
2. 每阶段完成后提交代码
3. 每天检查进度和质量

---

**祝你重构顺利！** 🎉

有问题？查阅相应的详细指南。  
想快速查找？打开快速参考卡。  
需要执行指导？打开执行清单。
