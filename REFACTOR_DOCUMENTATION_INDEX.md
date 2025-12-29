# 前端重构 - 文档导航

> 📚 所有重构相关文档索引

## 📖 文档列表

| 文档                                                               | 用途         | 阅读时间 | 优先级 |
| ------------------------------------------------------------------ | ------------ | -------- | ------ |
| **本文档**                                                         | 导航和总结   | 5 分钟   | 🔴 必读 |
| [FRONTEND_REFACTOR_GUIDE.md](FRONTEND_REFACTOR_GUIDE.md)           | 完整详细指南 | 30 分钟  | 🔴 必读 |
| [REFACTOR_QUICK_REFERENCE.md](REFACTOR_QUICK_REFERENCE.md)         | 快速查阅卡   | 10 分钟  | 🟠 高   |
| [DIRECTORY_STRUCTURE_CHANGES.md](DIRECTORY_STRUCTURE_CHANGES.md)   | 目录对比     | 15 分钟  | 🟠 高   |
| [REFACTOR_EXECUTION_CHECKLIST.md](REFACTOR_EXECUTION_CHECKLIST.md) | 执行清单     | 15 分钟  | 🟠 高   |
| [.github/copilot-instructions.md](.github/copilot-instructions.md) | 项目指令更新 | 10 分钟  | 🟡 中   |

---

## 🎯 快速开始

### 第 1 步：了解项目现状（5 分钟）

阅读本文档的"**当前问题**"部分，理解为什么需要重构。

### 第 2 步：学习重构方案（30 分钟）

1. 阅读 [FRONTEND_REFACTOR_GUIDE.md](FRONTEND_REFACTOR_GUIDE.md) 的"**重构方案**"部分
2. 查看 [DIRECTORY_STRUCTURE_CHANGES.md](DIRECTORY_STRUCTURE_CHANGES.md) 的目录对比
3. 理解新的数据流和架构

### 第 3 步：准备环境（10 分钟）

1. 创建新的 Git 分支：`git checkout -b refactor/frontend-restructuring`
2. 打开 [REFACTOR_EXECUTION_CHECKLIST.md](REFACTOR_EXECUTION_CHECKLIST.md)
3. 完成"**重构前准备**"部分

### 第 4 步：分阶段执行（5-7 天）

按照 [REFACTOR_EXECUTION_CHECKLIST.md](REFACTOR_EXECUTION_CHECKLIST.md) 逐阶段执行。

遇到问题时：
1. 首先查阅 [REFACTOR_QUICK_REFERENCE.md](REFACTOR_QUICK_REFERENCE.md) 的常见错误表
2. 然后查阅 [FRONTEND_REFACTOR_GUIDE.md](FRONTEND_REFACTOR_GUIDE.md) 的常见陷阱部分
3. 最后查看代码示例和模板

### 第 5 步：完成验证（1 天）

按照 [REFACTOR_EXECUTION_CHECKLIST.md](REFACTOR_EXECUTION_CHECKLIST.md) 的"**阶段 6**"完成所有验收。

---

## 📋 文档说明

### FRONTEND_REFACTOR_GUIDE.md（**首先阅读**）

**内容**：完整的重构指南和详细实施步骤

**章节**：
- 🎯 重构目标 - 量化指标和质量指标
- 🔴 当前问题分析 - 深入分析 6 大问题
- 🏗️ 分阶段重构计划 - 总体规划
- 📝 详细实施步骤 - 每个阶段的详细代码和步骤
- ✅ 检查清单 - 分阶段的验收清单
- ⚠️ 常见陷阱 - 5 个常见错误及解决方案
- 🔍 验证方法 - 如何验证重构成功

**何时阅读**：
- 重构前完整阅读一遍
- 重构中作为参考手册
- 遇到问题时查阅相关部分

**打印提示**：⭐ 建议打印"详细实施步骤"部分

---

### REFACTOR_QUICK_REFERENCE.md（**随时查阅**）

**内容**：快速参考卡，适合放在显示器旁

**章节**：
- 🎯 阶段概览 - 6 个阶段的可视化流程图
- 📦 文件映射 - 新增、删除、改造文件列表
- 🔧 代码模板 - 常用代码模板
- ⚠️ 常见错误 - 简明的错误表
- ✅ 每日检查清单
- 🔍 验证命令 - 快速命令查询
- 📊 进度追踪

**何时查阅**：
- 工作中快速查找文件映射
- 快速查看代码模板
- 遇到常见错误时查表
- 工作结束时用检查清单

**打印提示**：⭐ 建议打印全部内容

---

### DIRECTORY_STRUCTURE_CHANGES.md（**理解结构**）

**内容**：现状 vs 目标的详细对比

**章节**：
- 📂 现状目录 - 当前混乱的结构
- 🎯 目标目录 - 重构后清晰的结构
- 🔄 转换对比 - 5 个维度的对比
- 📊 文件变化统计
- 🛣️ 迁移路径 - 7 天的执行路线图

**何时阅读**：
- 理解新的目录结构
- 了解文件如何迁移
- 查阅文件对应关系

**打印提示**：现状和目标目录树建议打印

---

### REFACTOR_EXECUTION_CHECKLIST.md（**分阶段执行**）

**内容**：逐步、详细的执行清单

**章节**：
- ✅ 重构前准备 - 环境和分支准备
- 🔴 阶段 1 - 创建 Store（4 个任务）
- 🟠 阶段 2 - 合并 Hook（7 个任务）
- 🟠 阶段 3 - 精简 App.tsx（6 个任务）
- 🟡 阶段 4 - 重组组件（8 个任务）
- 🟡 阶段 5 - 类型完善（7 个任务）
- 🟡 阶段 6 - 验证优化（多项检查）

**何时使用**：
- 每个阶段开始时打开对应章节
- 按清单逐项完成
- 每完成一项勾选一个 checkbox
- 工作结束时验证当日完成情况

**打印提示**：⭐ 强烈建议打印，用笔勾选

---

### .github/copilot-instructions.md（**项目指令**）

**内容**：项目总体指令的一部分

**更新部分**：
- 新增"🔄 前端重构进行中（2025年12月29日启动）"章节
- 包含重构目标、阶段计划、关键文件变化
- 包含完整重构指南链接

**何时阅读**：
- 新成员加入时阅读
- 了解项目整体状况
- 查看重构进度

---

## 🗺️ 文档使用地图

### 场景 1：我是新加入项目的人

```
1. 阅读本文档
2. 阅读 FRONTEND_REFACTOR_GUIDE.md 的"重构目标"部分
3. 查看 DIRECTORY_STRUCTURE_CHANGES.md 的目录对比
4. 了解项目现状和目标
```

### 场景 2：我要开始重构

```
1. 完整阅读 FRONTEND_REFACTOR_GUIDE.md
2. 打印 REFACTOR_EXECUTION_CHECKLIST.md
3. 打印 REFACTOR_QUICK_REFERENCE.md
4. 完成"重构前准备"
5. 按阶段执行
```

### 场景 3：我在重构中遇到问题

```
1. 首先查阅 REFACTOR_QUICK_REFERENCE.md 的"常见错误"表
2. 如果没找到，查阅 FRONTEND_REFACTOR_GUIDE.md 的"常见陷阱"
3. 查看相应的代码模板和示例
4. 如果还是无法解决，查阅 REFACTOR_EXECUTION_CHECKLIST.md 的任务说明
```

### 场景 4：我要快速查找某个信息

```
- 找文件映射：REFACTOR_QUICK_REFERENCE.md 的"文件映射"
- 找代码模板：REFACTOR_QUICK_REFERENCE.md 的"代码模板"
- 找验证命令：REFACTOR_QUICK_REFERENCE.md 的"验证命令"
- 找详细步骤：FRONTEND_REFACTOR_GUIDE.md 的"详细实施步骤"
- 找某个阶段的任务：REFACTOR_EXECUTION_CHECKLIST.md
```

---

## ⏱️ 时间规划

### 总体时间表

| 活动            | 预计时间   | 最佳安排    |
| --------------- | ---------- | ----------- |
| 文档阅读        | 1.5-2 小时 | 第 1 天早上 |
| 环境准备        | 0.5 小时   | 第 1 天中午 |
| 阶段 1（Store） | 1-2 天     | 第 1-2 天   |
| 阶段 2（Hook）  | 1-2 天     | 第 2-3 天   |
| 阶段 3（App）   | 1 天       | 第 4 天     |
| 阶段 4（组件）  | 1 天       | 第 5 天     |
| 阶段 5（类型）  | 1 天       | 第 6 天     |
| 阶段 6（验证）  | 1 天       | 第 7 天     |
| **总计**        | **5-7 天** |             |

### 日程建议

```
第 1 天（8 小时）
├─ 08:00 - 09:00  文档阅读和理解（30 分钟完整指南 + 30 分钟快速参考）
├─ 09:00 - 09:30  环境准备和分支创建
├─ 09:30 - 17:30  阶段 1（Store 创建）
└─ 17:30 - 18:00  提交代码，记录进度

第 2-3 天（16 小时）
├─ 阶段 2（Hook 合并）全天
└─ 每天工作结束提交进度

第 4 天（8 小时）
├─ 上午：阶段 3（App.tsx 精简）
└─ 下午：测试和提交

第 5 天（8 小时）
├─ 上午：阶段 4（重组组件）
└─ 下午：测试和提交

第 6 天（8 小时）
├─ 上午：阶段 5（类型完善）
└─ 下午：代码审查和提交

第 7 天（8 小时）
├─ 上午：阶段 6（验证）
├─ 中午：性能测试
├─ 下午：文档更新
└─ 下班：最终提交和总结
```

---

## 🔍 快速索引

### 按问题查找

**Q: App.tsx 太大怎么精简？**  
→ FRONTEND_REFACTOR_GUIDE.md - 阶段 3  
→ REFACTOR_EXECUTION_CHECKLIST.md - 任务 3.3

**Q: 如何处理 45+ 个 useState？**  
→ FRONTEND_REFACTOR_GUIDE.md - 阶段 1  
→ REFACTOR_QUICK_REFERENCE.md - 代码模板

**Q: Hook 太多怎么合并？**  
→ FRONTEND_REFACTOR_GUIDE.md - 阶段 2  
→ REFACTOR_QUICK_REFERENCE.md - 文件映射

**Q: Props 怎么规范化？**  
→ FRONTEND_REFACTOR_GUIDE.md - 阶段 5  
→ DIRECTORY_STRUCTURE_CHANGES.md - Props 转换对比

**Q: 遇到错误怎么办？**  
→ REFACTOR_QUICK_REFERENCE.md - 常见错误表  
→ FRONTEND_REFACTOR_GUIDE.md - 常见陷阱

### 按文件查找

**需要创建 store/types.ts？**  
→ FRONTEND_REFACTOR_GUIDE.md - 任务 1.1  
→ REFACTOR_QUICK_REFERENCE.md - 代码模板

**需要创建 useAppStore Hook？**  
→ FRONTEND_REFACTOR_GUIDE.md - 任务 1.3  
→ REFACTOR_QUICK_REFERENCE.md - 代码模板

**需要重写 App.tsx？**  
→ FRONTEND_REFACTOR_GUIDE.md - 任务 3.3  
→ REFACTOR_QUICK_REFERENCE.md - App.tsx 骨架

**需要迁移组件目录？**  
→ REFACTOR_EXECUTION_CHECKLIST.md - 任务 4.2-4.5  
→ DIRECTORY_STRUCTURE_CHANGES.md - 目录对比

---

## 📞 需要帮助？

### 遇到的问题

1. **分不清楚应该做什么？**  
   → 查看 REFACTOR_EXECUTION_CHECKLIST.md 的当前阶段
   
2. **不知道代码怎么写？**  
   → 查看 REFACTOR_QUICK_REFERENCE.md 的代码模板
   
3. **出现错误信息？**  
   → 查看 REFACTOR_QUICK_REFERENCE.md 的常见错误表
   
4. **找不到文件在哪里？**  
   → 查看 REFACTOR_QUICK_REFERENCE.md 的文件映射
   
5. **想了解整个流程？**  
   → 阅读 FRONTEND_REFACTOR_GUIDE.md 的详细实施步骤

### 推荐的学习顺序

```
第一次接触重构？
└─→ 1. 本文档（5 分钟）
    2. DIRECTORY_STRUCTURE_CHANGES.md（15 分钟）
    3. FRONTEND_REFACTOR_GUIDE.md 的"重构目标"部分（10 分钟）

准备开始重构？
└─→ 1. FRONTEND_REFACTOR_GUIDE.md 完整版（30 分钟）
    2. REFACTOR_QUICK_REFERENCE.md（10 分钟）
    3. REFACTOR_EXECUTION_CHECKLIST.md 的"重构前准备"（5 分钟）

已经开始重构？
└─→ 1. REFACTOR_EXECUTION_CHECKLIST.md 当前阶段（5 分钟）
    2. REFACTOR_QUICK_REFERENCE.md 查询（随时）
    3. FRONTEND_REFACTOR_GUIDE.md 深入（需要时）

遇到问题？
└─→ 1. REFACTOR_QUICK_REFERENCE.md 常见错误表（2 分钟）
    2. FRONTEND_REFACTOR_GUIDE.md 常见陷阱（5 分钟）
    3. 查看代码示例和模板（10 分钟）
```

---

## ✅ 验收标准

重构完成后应满足：

- ✅ App.tsx < 500 行（从 1103 行精简 55%）
- ✅ 顶层 state 由 45+ 个减少到 1 个
- ✅ Hook 导入由 30+ 个减少到 5-8 个
- ✅ Props 对象由 80+ 个属性减少到 <5 个
- ✅ 3 个 Context 合并为 1 个
- ✅ 13 个 Hook 合并为 4 个
- ✅ 组件按功能分类清晰
- ✅ 所有功能正常运行
- ✅ 性能无明显下降
- ✅ 代码质量检查通过

---

## 📊 进度示例

### 每日记录模板

```markdown
## 2025-12-XX 进度记录

### 完成的工作
- [x] 阶段 1 - 创建 Store 类型定义
- [x] 阶段 1 - 创建 AppContext
- [ ] 阶段 1 - 集成 AppProvider

### 当前问题
- 问题描述：...
- 解决状态：...

### 明天计划
- [ ] 完成阶段 1 集成
- [ ] 开始阶段 2 - 合并 Hook

### 代码提交
- Commit: xxxxx - chore: phase 1 - create store types

### 验证状态
- [x] pnpm build 成功
- [x] wails dev 启动成功
- [ ] 完整功能测试
```

---

## 🎓 学习资源

### React 官方文档
- [React Hooks](https://react.dev/reference/react/hooks)
- [Context API](https://react.dev/learn/passing-data-deeply-with-context)
- [Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)

### 其他参考
- [Rules of Hooks](https://react.dev/warnings/invalid-hook-call-warning)
- [Mantine 文档](https://mantine.dev)
- [TypeScript 最佳实践](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

---

## 📝 文档维护

这份文档和相关指南将持续更新：

- 每完成一个阶段，更新进度状态
- 遇到新的问题，添加到常见问题
- 最后完成时，移动到"**重构完成**"部分

**最后更新**：2025-12-29  
**维护者**：GitHub Copilot  
**状态**：🔄 重构进行中

---

**祝重构顺利！** 🚀
