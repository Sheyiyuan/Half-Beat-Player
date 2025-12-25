# BV 号解析失败修复总结

## 问题诊断
用户报告"输入BV号会解析失败，未知错误"

## 根本原因
1. **错误消息不清晰**: 后端错误信息被过度简化，导致无法定位问题
2. **缺少登录检查**: 前端在调用 `ResolveBiliAudio` 前没有验证登录状态
3. **API 字段映射错误**: `backup_url` 应为数组而非字符串

## 实施的修复

### 后端改进 (`internal/services/service.go`)

#### 1. 改进 `getCidFromBVID` 函数
- 添加详细的错误信息：包括 API 错误代码和消息
- 区分不同错误场景：
  - 网络请求失败
  - JSON 解析错误
  - API 返回错误代码
  - 无数据返回
- **位置**: 行 576-611

**改进前:**
```go
if err := json.NewDecoder(resp.Body).Decode(&res); err != nil || res.Code != 0 || len(res.Data) == 0 {
    return 0, "", 0, fmt.Errorf("pagelist failed: code=%d", res.Code)
}
```

**改进后:**
```go
if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
    return 0, "", 0, fmt.Errorf("pagelist decode error: %w", err)
}
if res.Code != 0 {
    return 0, "", 0, fmt.Errorf("pagelist API error: code=%d, msg=%s", res.Code, res.Msg)
}
if len(res.Data) == 0 {
    return 0, "", 0, fmt.Errorf("pagelist: no data returned for BVID=%s", bvid)
}
```

#### 2. 改进 `getAudioURL` 函数
- 修复 `backup_url` 字段类型：改为 `[]string` 数组
- 添加完整的错误传播链
- 提供具体的故障排查消息
- **位置**: 行 614-656

**关键改动:**
```go
var res struct {
    // ...
    Audio []struct {
        BaseURL   string   `json:"baseUrl"`
        BackupURL []string `json:"backup_url"` // 修复：应为数组
    } `json:"audio"`
}

// 正确处理数组备用 URL
if audioURL == "" && len(audio.BackupURL) > 0 {
    audioURL = audio.BackupURL[0]
}
```

#### 3. 增强 `GetPlayURL` 函数的错误处理
- 验证 BVID 不为空
- 改进错误消息以提供用户友好的提示
- **位置**: 行 563-598

### 前端改进 (`frontend/src/App.tsx`)

#### 1. 添加登录状态检查
- 在调用 `ResolveBiliAudio` 前验证登录状态
- 如果未登录，提示用户并打开登录模态框
- **位置**: 行 1100-1130

**改进代码:**
```typescript
const isLoggedIn = await Services.IsLoggedIn();
if (!isLoggedIn) {
    notifications.update({
        id: toastId,
        title: '需要登录',
        message: '请先通过扫码登录',
        color: 'blue',
        loading: false,
        autoClose: 3000,
    });
    setLoginModalOpened(true);
    setGlobalSearchTerm('');
    return;
}
```

## 构建和验证

### 编译状态
✅ 成功编译 (`wails build -clean`)
- 后端: 0 错误
- 前端: 0 错误
- 开发模式已启动: `http://localhost:34115`

### 功能验证清单
- [x] 后端错误消息明晰化
- [x] API 字段类型正确
- [x] 前端登录状态检查
- [x] 项目成功编译
- [x] 开发服务器运行正常

## 使用体验流程

1. **用户操作流程:**
   ```
   打开应用 → 扫码登录 → 输入BV号 → 系统检查登录状态 → 解析视频 → 显示结果
   ```

2. **错误处理流程:**
   ```
   未登录状态:
     输入BV号 → 提示"需要登录" → 打开登录模态 → 用户扫码 → 重新尝试
   
   登录后的错误:
     输入BV号 → 具体错误消息 → 用户可根据错误信息排查问题
   ```

## 代码改变汇总

| 文件                           | 行数      | 改动                    | 说明                                 |
| ------------------------------ | --------- | ----------------------- | ------------------------------------ |
| `internal/services/service.go` | 576-611   | `getCidFromBVID`        | 详细的错误信息和状态检查             |
| `internal/services/service.go` | 614-656   | `getAudioURL`           | 修复 `backup_url` 类型，改进错误处理 |
| `internal/services/service.go` | 563-598   | `GetPlayURL`            | 增强错误消息和验证                   |
| `frontend/src/App.tsx`         | 1100-1130 | `handleResolveBVAndAdd` | 添加登录状态检查                     |

## 下一步改进建议

1. **日志记录**: 添加结构化日志，记录 API 调用和解析过程
2. **缓存机制**: 实现 BV 号解析结果缓存以提高性能
3. **重试逻辑**: 在网络失败时自动重试（带指数退避）
4. **用户教程**: 在首次使用时显示登录和 BV 号输入指南

## 测试建议

### 测试用例

1. **测试未登录状态:**
   - 清除 localStorage
   - 刷新页面
   - 尝试输入 BV 号
   - **预期**: 显示"需要登录"提示

2. **测试有效的 BV 号:**
   - 登录成功后
   - 输入有效的 BV 号（如 `BV1xx4y1C7Tg`）
   - **预期**: 视频信息被正确解析和播放

3. **测试无效的 BV 号:**
   - 输入不存在的 BV 号
   - **预期**: 显示 API 返回的具体错误信息

4. **测试网络错误:**
   - 在离线状态下尝试解析
   - **预期**: 显示网络错误信息

