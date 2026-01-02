## 修复验证指南

### 问题描述
应用启动时出现错误：
```
TypeError: undefined is not an object (evaluating 'window.wails.Callback')
Callback 'services.Service.GetUserInfo-3348679758' not registered!!!
```

### 根本原因
前端代码在 Wails 运行时完全初始化前就试图调用后端方法，导致 `window.wails.Callback` 未定义。

### 已应用的修复

#### 1. 创建 Wails 运行时工具库
**文件**: `frontend/src/utils/wails.ts`

提供以下功能：
- `waitForWailsRuntime(maxRetries, retryDelay)` - 等待运行时初始化
- `isWailsReady()` - 检查运行时是否准备好
- `onWailsReady(callback, timeout)` - 在准备好时执行回调
- `withWailsReady(fn, timeout)` - 包装器模式

重试机制：
- 最多重试 50 次（默认）
- 每次间隔 100ms
- 总等待时间 5 秒

#### 2. 修复应用初始化流程
**文件**: `frontend/src/hooks/ui/useAppLifecycle.ts`

变更：
- 第一个 `useEffect`（主题和设置加载）
  - 调用后端前先 `await waitForWailsRuntime()`
  - 包装所有后端调用在异步函数中
  
- 第二个 `useEffect`（数据加载）
  - 同样添加 `await waitForWailsRuntime()`
  - 确保 Seed、ListSongs、ListFavorites 等调用安全

### 验证方式

#### 1. 构建验证
```bash
cd /home/syy/Code/Half-Beat-Player/frontend
pnpm build
# 应该输出: ✓ built in Xs
```

#### 2. 启动应用测试
```bash
cd /home/syy/Code/Half-Beat-Player
/home/syy/go/bin/wails dev
```

#### 3. 检查控制台日志
启动应用后查看浏览器开发者工具 (F12)，应该看到：
```
✓ [Wails] 运行时已初始化
✓ 正在加载...
✓ 播放列表已恢复
```

**不应该看到**：
```
✗ TypeError: undefined is not an object (evaluating 'window.wails.Callback')
✗ Callback 'services.Service.GetUserInfo' not registered
```

#### 4. 功能测试
- [ ] 应用成功启动
- [ ] 登录状态正确显示
- [ ] 歌曲列表加载
- [ ] 播放列表恢复
- [ ] 无任何 Callback 错误

### 如果仍有问题

#### 检查项
1. **清理浏览器缓存**
   ```bash
   # 清理所有缓存文件
   rm -rf ~/.cache/half-beat*
   rm -rf ~/Library/Caches/half-beat*  # macOS
   ```

2. **检查 Wails 版本**
   ```bash
   /home/syy/go/bin/wails version
   ```

3. **查看完整日志**
   - 打开浏览器 DevTools Console
   - 搜索 `[Wails]` 查看所有运行时日志
   - 查找 `[useAppLifecycle]` 查看应用初始化日志

4. **重新构建应用**
   ```bash
   cd /home/syy/Code/Half-Beat-Player
   go build -o build/bin/half-beat main.go
   cd frontend && pnpm build
   wails build
   ```

### 超时处理

如果 Wails 运行时超过 5 秒未初始化：
- 应用会记录警告：`[Wails] 初始化超时`
- 应用会尝试继续执行（降级方案）
- 用户会看到加载错误但不会完全崩溃

### 性能影响

- **启动时间**: +100-500ms（等待 Wails 初始化）
- **内存占用**: 无变化（只增加了工具函数）
- **运行时性能**: 无影响（只在初始化时等待）

### 技术细节

#### 等待逻辑
```typescript
// 检查运行时是否准备好的条件
1. window.wails?.Callback 存在
2. 或 window.go?.services?.Service?.GetPlayerSetting 存在

// 两个条件之一满足即认为运行时准备好
```

#### 异步处理
```typescript
useEffect(() => {
    const runInit = async () => {
        await waitForWailsRuntime();  // 等待准备
        // 然后调用后端
        await Services.GetPlayerSetting();
    };
    
    runInit();
}, []);
```

### 后续优化计划

- [ ] 添加进度条显示等待状态
- [ ] 实现超时时的更好降级
- [ ] 添加用户友好的错误提示
- [ ] 性能监控和日志上报

---

**修复日期**: 2026-01-02  
**状态**: 已应用并验证构建通过  
**下一步**: 运行 Wails dev 进行实际测试
