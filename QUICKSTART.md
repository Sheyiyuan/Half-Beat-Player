# 快速开发指南

## 项目架构

### 后端（Go + Wails）
- **认证**：Bilibili 扫码登录 → SESSDATA Cookie
- **API**：官方 B 站 API（pagelist + playurl）
- **代理**：本地 HTTP 代理（127.0.0.1:9999）转发音频流

### 前端（React + TypeScript + Mantine）
- **登录UI**：`LoginModal` 组件显示二维码
- **播放**：调用 `GetPlayURL` 获取代理 URL
- **回退**：如果 API 失败自动回退到 `ResolveBiliAudio`

## 工作流程

### 1. 启动应用
```
App → 检查 IsLoggedIn() → 未登录？显示 LoginModal
```

### 2. 用户扫码登录
```
前端显示二维码 → 用户在B站APP扫描 → 授权 → 后端接收 SESSDATA → 存储在 CookieJar
```

### 3. 搜索并播放视频
```
用户输入 BV号 → 搜索结果 → 点击播放 → playSong() 调用 GetPlayURL(bvid, 0)
→ 后端解析音频 URL → 返回代理 URL → 前端音频标签加载代理 URL → 代理转发请求
```

## 主要函数

### 后端 API

**认证相关：**
```go
// 生成二维码
func (s *Service) GenerateLoginQR() (QRCodeResponse, error)

// 轮询登录状态
func (s *Service) PollLogin(qrcodeKey string) (LoginPollResponse, error)

// 检查登录状态
func (s *Service) IsLoggedIn() (bool, error)

// 退出登录
func (s *Service) Logout() error
```

**音频解析：**
```go
// 获取可播放 URL（需要登录）
func (s *Service) GetPlayURL(bvid string, p int) (PlayInfo, error)

// 兼容性方法（可能需要 yt-dlp）
func (s *Service) ResolveBiliAudio(bvid string) (BiliAudio, error)
```

### 前端 API

```typescript
// 生成二维码
IsLoggedIn(): Promise<boolean>
GenerateLoginQR(): Promise<{url, qrcodeKey, expireAt}>
PollLogin(qrcodeKey: string): Promise<{loggedIn, message}>
Logout(): Promise<void>

// 获取音频 URL
GetPlayURL(bvid: string, p: number): Promise<{rawUrl, proxyUrl, expiresAt, title, duration}>

// 搜索
SearchBiliVideos(query: string, page: number, pageSize: number): Promise<Song[]>

// 兼容性（备用）
ResolveBiliAudio(bvid: string): Promise<BiliAudio>
```

## 常见任务

### 1. 修改登录过期时间
文件：`/internal/services/service.go`，`GenerateLoginQR()` 函数
```go
// 当前默认是 B 站返回的有效期，通常 3 分钟
```

### 2. 修改代理端口
文件：`/main.go`
```go
audioProxy = proxy.NewAudioProxy(9999, backend.GetHTTPClient())  // 改这里
```

### 3. 修改轮询间隔
文件：`/frontend/src/components/LoginModal.tsx`
```typescript
}, 2000); // 改这个值（毫秒）
```

### 4. 修改音频清晰度
文件：`/internal/services/service.go`，`getAudioURL()` 函数
```go
// fnval=4048 是 DASH 格式最高质量
// 其他值对应不同的编码格式
```

### 5. 添加 Cookie 加密
文件：`/internal/services/service.go`，`NewService()` 函数
```go
// 建议保存到本地文件并加密
```

## 调试技巧

### 1. 查看代理日志
在 `handleAudio` 中添加日志：
```go
log.Printf("代理请求: %s", encodedURL)
log.Printf("解码后 URL: %s", u)
```

### 2. 测试登录状态
```bash
curl http://localhost:3000/api/IsLoggedIn
```

### 3. 测试音频解析
```bash
curl "http://localhost:3000/api/GetPlayURL?bvid=BV1xx&p=0"
```

### 4. 测试代理
```bash
curl "http://127.0.0.1:9999/audio?u=<encoded_url>" -v
```

### 5. 监控 Cookie Jar
在 `NewService` 后添加：
```go
jar.Cookies(url)  // 查看已保存的 cookie
```

## 错误排查

| 错误                | 原因                | 解决方案                                                |
| ------------------- | ------------------- | ------------------------------------------------------- |
| 扫码后仍显示未登录  | Cookie 未正确保存   | 检查 CookieJar 初始化，确保 jar.Cookies() 返回 SESSDATA |
| GetPlayURL 返回 403 | 未登录或登录过期    | 重新登录，检查 SESSDATA 有效期                          |
| 代理返回 502        | 音频 URL 过期或无效 | 检查 B 站 API 是否有变化，测试直接调用 API              |
| 音频无法播放        | Referer 头不对      | 在 handleAudio 中打印请求头确认                         |
| 快进没有反应        | Range 请求处理错误  | 检查 handleAudio 中的 Range 解析逻辑                    |

## 部署检查清单

- [ ] 后端编译成功
- [ ] 前端构建成功
- [ ] 登录流程测试通过
- [ ] 搜索和播放功能测试通过
- [ ] 快进、音量、播放模式测试通过
- [ ] 多个视频连续播放测试通过
- [ ] 长时间挂机测试（检查内存泄漏）
- [ ] 断网重连测试

## 性能优化建议

1. **缓存 CID** - 避免重复调用 pagelist API
2. **缓存音频 URL** - 缓存 1 小时内的 playurl 结果
3. **代理连接池** - 使用 http.Client 的连接复用
4. **Cookie 持久化** - 保存到文件避免重复登录
5. **错误恢复** - 实现自动重试机制

## 安全建议

1. **HTTPS** - 部署时启用 HTTPS
2. **Cookie 加密** - 对本地保存的 SESSDATA 加密
3. **速率限制** - 代理层面添加速率限制
4. **日志脱敏** - 避免记录完整 URL 和 Cookie
5. **错误隐藏** - 生产环境不暴露详细错误信息
