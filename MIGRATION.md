# 项目改动总结：完全去除 yt-dlp，迁移至 B 站官方 API + 扫码登录

## 改动概述

本次改动完全实现了从外部依赖 yt-dlp 的方案迁移至 B 站官方 API 的完整系统。通过引入扫码登录机制、本地代理转发、和 API 集成，提高了项目的可维护性和稳定性。

---

## 后端改动（Go）

### 1. `/internal/services/service.go`
**主要改动：**
- 添加了 HTTP 客户端和 Cookie 管理
  ```go
  type Service struct {
      db         *gorm.DB
      cookieJar  http.CookieJar
      httpClient *http.Client
  }
  ```
- 实现了 Bilibili 扫码登录系统：
  - `GenerateLoginQR()` - 生成二维码
  - `PollLogin(qrcodeKey)` - 轮询登录状态
  - `IsLoggedIn()` - 检查登录状态
  - `Logout()` - 退出登录

- 实现了 API 音频解析：
  - `GetPlayURL(bvid, p)` - 获取代理 URL（通过 /x/player/pagelist + /x/player/playurl API）
  - 返回 `ProxyURL` 指向本地代理 127.0.0.1:9999

- `ResolveBiliAudio()` 现在委托给 `GetPlayURL()` 用作兼容性包装

### 2. `/internal/proxy/proxy.go`（新增文件）
**功能：**
- 创建了本地 HTTP 代理服务器
  ```go
  type AudioProxy struct {
      port       int
      listener   net.Listener
      server     *http.Server
      httpClient *http.Client
      mu         sync.RWMutex
  }
  ```

- 核心功能：
  - `Start()` - 在 127.0.0.1:9999 启动代理
  - `Stop()` - 优雅关闭
  - `handleAudio()` - 处理 `/audio?u=<encodedURL>` 请求
    - 自动添加 Referer 头（防盗链）
    - 支持 Range 请求（断点续传）
    - 转发音频流

### 3. `/main.go`
**改动：**
- 集成代理生命周期
  ```go
  audioProxy := proxy.NewAudioProxy(9999, backend.GetHTTPClient())
  ```
- `OnStartup` 时启动代理
- `OnShutdown` 时停止代理

---

## 前端改动（React + TypeScript）

### 1. `/frontend/src/types.ts`
**改动：**
- 导出了类构造函数用于运行时：
  ```typescript
  export const SongClass = models.Song;
  export const FavoriteClass = models.Favorite;
  ```

### 2. `/frontend/src/components/LoginModal.tsx`（新增组件）
**功能：**
- 扫码登录模态框
  - 显示 B 站二维码
  - 自动轮询登录状态（每 2 秒）
  - 显示登录状态信息
  - 自动过期处理

### 3. `/frontend/src/App.tsx`
**主要改动：**
- 添加登录模态框状态和 UI
  ```typescript
  const [loginModalOpened, setLoginModalOpened] = useState(false);
  ```

- 启动时检查登录状态
  ```typescript
  const loggedIn = await Services.IsLoggedIn();
  if (!loggedIn) setLoginModalOpened(true);
  ```

- 集成 GetPlayURL 到播放流程
  ```typescript
  const playInfo = await Services.GetPlayURL(song.bvid, 0);
  // 使用 proxyUrl 而不是直链
  toPlay.streamUrl = playInfo.proxyUrl;
  ```

- 降级方案：如果 GetPlayURL 失败，自动回退到 ResolveBiliAudio

- 修复了所有 Song/Favorite 类型问题

### 4. `/frontend/wailsjs/go/services/Service.d.ts`
**更新：**
- 添加了新的 API 声明
  ```typescript
  export function GenerateLoginQR():Promise<{url:string,qrcodeKey:string,expireAt:any}>;
  export function IsLoggedIn():Promise<boolean>;
  export function PollLogin(arg1:string):Promise<{loggedIn:boolean,message:string}>;
  export function GetPlayURL(arg1:string,arg2:number):Promise<{rawUrl:string,proxyUrl:string,expiresAt:any,title:string,duration:number}>;
  export function Logout():Promise<void>;
  ```

### 5. `/frontend/src/components/`
**修复：**
- 所有 Favorite.name 更改为 Favorite.title
- 移除了 Mantine v8 不支持的 NumberInput formatter/parser 属性

---

## 架构对比

### 之前（yt-dlp）
```
前端 → 后端 → exec.Command("yt-dlp") → 外部进程 → 获取 URL → 返回 URL
```

### 现在（官方 API + 代理）
```
前端 → 登录模态框（扫码）
           ↓
       后端检查 SESSDATA cookie
           ↓
       前端播放时调用 GetPlayURL
           ↓
       后端调用 /x/player/pagelist（获取 CID）
           ↓
       后端调用 /x/player/playurl（获取 DASH 音频链接）
           ↓
       生成代理 URL: 127.0.0.1:9999/audio?u=...
           ↓
       前端音频元素加载代理 URL
           ↓
       代理添加 Referer + Range 头
           ↓
       代理向 CDN 转发请求
           ↓
       音频流返回给播放器
```

---

## 关键特性

1. **扫码登录** - 用户通过 B 站 APP 二维码登录，无需手动输入账号密码
2. **官方 API** - 使用 B 站官方 API，稳定可靠
3. **本地代理** - 解决防盗链问题，支持断点续传
4. **会话持久化** - Cookie 在 http.CookieJar 中保存
5. **降级方案** - GetPlayURL 失败时自动回退到 ResolveBiliAudio
6. **自动过期检查** - 检测 streamUrl 过期，自动重新解析

---

## 技术细节

### 二维码生成流程
1. 调用 `/x/passport-login/web/qrcode/generate` 获取二维码 URL 和 qrcodeKey
2. 前端显示二维码
3. 用户用 B 站 APP 扫码并授权
4. 前端每 2 秒调用 `/x/passport-login/web/qrcode/poll?qrcode_key=...` 检查状态
5. 检测到 `loggedIn: true` 时，SESSDATA 自动存储在 CookieJar 中

### 音频解析流程
1. 获取 BV 号（如 BV1xx...）
2. 调用 `/x/player/pagelist?bvid=...` 获取视频分p列表和 CID
3. 调用 `/x/player/playurl?cid=...&fnval=4048` 获取 DASH 音频清单
4. 解析清单获取最高质量的音频直链
5. 生成代理 URL 返回给前端
6. 代理处理 Referer 和 Range，转发请求给 CDN

### 代理工作流程
```
客户端请求: GET /audio?u=<base64(url)>
    ↓
代理解码 URL
    ↓
添加请求头:
  - Referer: https://www.bilibili.com
  - Range: (如果客户端提供)
    ↓
转发请求给原始 CDN
    ↓
获得响应
    ↓
转发响应给客户端（包括 Content-Range 等）
```

---

## 注意事项

1. **登录有效期** - B 站 SESSDATA 有过期时间，需要定期重新登录
2. **API 限制** - 可能有速率限制，建议添加重试机制
3. **Cookie 加密** - 生产环境建议对 Cookie 进行加密存储
4. **跨域问题** - 代理解决了音频直链的跨域问题
5. **范围请求** - 代理支持 HTTP Range 请求，允许视频播放器快进

---

## 测试建议

1. 运行应用，初始化时检查登录提示
2. 扫描二维码完成登录
3. 搜索并播放 BV 视频
4. 验证播放过程中会调用 GetPlayURL
5. 检查代理日志确认请求转发正常
6. 测试播放进度条拖拽（Range 请求）

---

## 文件清单

**新增：**
- `/internal/proxy/proxy.go` - 音频代理
- `/frontend/src/components/LoginModal.tsx` - 登录模态框

**修改：**
- `/internal/services/service.go` - 登录系统、API 解析
- `/main.go` - 代理生命周期
- `/frontend/src/App.tsx` - 登录检查、GetPlayURL 集成
- `/frontend/src/components/*.tsx` - Favorite.title 修复
- `/frontend/wailsjs/go/services/Service.d.ts` - 新函数声明
- `/frontend/src/types.ts` - 导出类构造函数

**删除：**
- yt-dlp 所有相关的 exec.Command 调用

---

## 下一步优化建议

1. **Cookie 加密** - 使用加密算法保存 SESSDATA
2. **错误处理** - 更好的登录失败、API 超时提示
3. **重试机制** - API 调用失败自动重试
4. **性能优化** - 缓存 CID 和音频 URL
5. **用户体验** - 登录过期自动刷新提示
