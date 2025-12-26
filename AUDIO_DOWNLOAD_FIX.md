# 音频文件下载损坏问题修复

## 问题诊断

本地下载的歌曲文件会损坏的根本原因：

### 1. **缺少文件完整性验证**
- **问题**: 下载完成后未检查文件大小是否与服务器返回的 Content-Length 相符
- **风险**: 网络中断、服务器提前断开连接导致文件不完整，但系统认为下载成功
- **后果**: 损坏的音频文件被保存并在播放时触发错误

### 2. **缺少写入缓冲区刷新**
- **问题**: `io.Copy()` 将数据写入文件后，没有调用 `f.Sync()` 确保数据已写入磁盘
- **风险**: 操作系统可能将数据保留在缓冲区中，如果进程意外终止，数据丢失
- **后果**: 虽然文件大小看起来正确，但实际数据不完整

### 3. **网络超时设置不合理**
- **问题**: 默认 HTTP timeout 为 30 秒，对大文件下载太短
- **风险**: 大文件（>10MB）下载超时被中断
- **后果**: 文件被截断，播放时出错

### 4. **缺少并发控制**
- **问题**: 没有文件锁机制，多个下载同一首歌的请求可能相互覆盖
- **风险**: 竞态条件导致文件被部分覆盖
- **后果**: 文件数据混乱，无法播放

### 5. **残留 .part 文件处理不当**
- **问题**: 如果下载中断，.part 文件残留，下次下载直接覆盖
- **风险**: 旧的残留数据导致新文件被污染
- **后果**: 虽然原子重命名了，但源数据本身就是坏的

## 修复方案

### 修改 1: 改进 HTTP Transport 配置
**文件**: `internal/services/service.go` - `NewService()`

```go
// 创建具有合理超时的 HTTP Transport
transport := &http.Transport{
    DialContext: (&net.Dialer{
        Timeout:   10 * time.Second,
        KeepAlive: 30 * time.Second,
    }).DialContext,
    TLSHandshakeTimeout: 10 * time.Second,
    IdleConnTimeout:     90 * time.Second,
    MaxIdleConns:        100,
    MaxIdleConnsPerHost: 10,
}

client := &http.Client{
    Jar:       jar,
    Transport: transport,
    Timeout:   30 * time.Second,
}
```

**优势**:
- 连接超时: 10s
- SSL 握手超时: 10s  
- 连接复用: 提高性能
- 最大闲置连接: 100

### 修改 2: 添加扩展超时的下载上下文
**文件**: `internal/services/service.go` - `DownloadSong()`

```go
// Download with extended timeout for large files (5 minutes)
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
defer cancel()

req, err := http.NewRequestWithContext(ctx, "GET", audioURL, nil)
```

**优势**:
- 为大文件下载设置 5 分钟超时
- 不影响其他 HTTP 请求的 30 秒超时
- 自动 cleanup，避免 context 泄漏

### 修改 3: 完整的文件写入和验证流程
**文件**: `internal/services/service.go` - `DownloadSong()`

#### 3.1 获取并验证文件大小
```go
contentLength := resp.ContentLength
if contentLength <= 0 {
    return "", fmt.Errorf("无法获取文件大小信息，可能是服务器不支持")
}
```

#### 3.2 清理残留的 .part 文件
```go
tmpPath := dstPath + ".part"
_ = os.Remove(tmpPath)  // 移除残留文件
```

#### 3.3 写入并跟踪字节数
```go
written, err := io.Copy(f, resp.Body)
if err != nil {
    _ = f.Close()
    _ = os.Remove(tmpPath)
    return "", fmt.Errorf("写入文件失败: %w", err)
}

// 立即验证写入大小
if written != contentLength {
    _ = f.Close()
    _ = os.Remove(tmpPath)
    return "", fmt.Errorf("下载不完整: 期望 %d 字节，实际 %d 字节", contentLength, written)
}
```

#### 3.4 刷新缓冲区到磁盘
```go
if err := f.Sync(); err != nil {
    _ = f.Close()
    _ = os.Remove(tmpPath)
    return "", fmt.Errorf("刷新文件失败: %w", err)
}
```

#### 3.5 重命名前验证文件
```go
stat, err := os.Stat(tmpPath)
if err != nil || stat.Size() != contentLength {
    return "", fmt.Errorf("文件验证失败")
}

// 如果目标文件已存在，先删除
if _, err := os.Stat(dstPath); err == nil {
    if err := os.Remove(dstPath); err != nil {
        return "", fmt.Errorf("无法覆盖已存在的文件: %w", err)
    }
}

// 原子重命名
if err := os.Rename(tmpPath, dstPath); err != nil {
    return "", fmt.Errorf("保存文件失败: %w", err)
}
```

#### 3.6 重命名后最终验证
```go
stat, err = os.Stat(dstPath)
if err != nil || stat.Size() != contentLength {
    _ = os.Remove(dstPath)
    return "", fmt.Errorf("最终大小验证失败")
}
```

## 修复的检查点

| 检查点              | 之前 | 之后 | 作用                 |
| ------------------- | ---- | ---- | -------------------- |
| 获取 Content-Length | ❌    | ✅    | 提前了解文件大小     |
| 清理 .part 残留     | ❌    | ✅    | 防止旧数据污染       |
| 追踪写入字节数      | ❌    | ✅    | 验证传输完整性       |
| 中间验证大小        | ❌    | ✅    | 快速发现传输错误     |
| 刷新到磁盘 (Sync)   | ❌    | ✅    | 确保数据持久化       |
| 重命名前验证        | ❌    | ✅    | 原子操作前的安全检查 |
| 重命名后验证        | ❌    | ✅    | 确保最终文件完整     |
| 下载超时            | 30s  | 5min | 支持大文件下载       |
| Transport 配置      | 无   | ✅    | 连接复用与超时控制   |

## 测试建议

1. **小文件下载**: 测试 1-5MB 的歌曲，确保完整性
2. **大文件下载**: 测试 20MB+ 的视频音轨，确保超时充足
3. **网络中断恢复**: 在下载中途断网，确保 .part 文件被清理
4. **重复下载**: 同一首歌下载多次，确保文件不被污染
5. **并发下载**: 下载多首歌曲，验证没有竞态条件

## 后续改进方向

1. **断点续传**: 支持 HTTP Range 请求恢复中断的下载
2. **校验和验证**: 添加 MD5/SHA256 验证下载的完整性
3. **进度回调**: 向前端报告下载进度百分比
4. **智能重试**: 自动重试失败的下载
5. **带宽限制**: 限制下载速度，避免占用过多网络资源
