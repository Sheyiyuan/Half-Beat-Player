
# Tomorin Player (Wails + React + Go)

使用 React + TypeScript 前端（Vite）和 Go + SQLite 后端，通过 Wails v2 构建的桌面应用。目标是重新实现 Azusa 播放器的桌面版本：包含播放列表、收藏夹、歌词偏移和基本播放控制功能。

## 前提条件

- Go 1.21 或更高版本
- Node 18 或更高版本
- `wails` CLI 工具 (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)

## 安装

```bash
# 安装后端依赖
cd .
go mod tidy

# 安装前端依赖
cd frontend
npm install
```

## 开发模式运行

需要两个终端窗口：

```bash
# 终端 1：运行前端开发服务器
cd frontend
npm run dev

# 终端 2：运行 Wails 开发环境（提供 Go 后端服务并加载前端开发服务器）
cd ..
wails dev
```

## 构建桌面应用

```bash
wails build
```

## 项目结构

- `main.go` – Wails 启动程序、数据库初始化、后端服务绑定
- `internal/` – 数据库辅助工具、数据模型、服务（播放列表、收藏夹、歌词、设置）
- `frontend/` – React + TS 应用（基于 Vite）
- `wails.json` – Wails 构建/开发配置文件

## Spotlight 搜索（BV / 名称 / UP / fid）

- 左上搜索按钮触发 Spotlight 样式浮层，背景虚化
- 支持 BV 号、视频标题、UP 主（singer / singerId）匹配本地歌曲
- 支持收藏夹 fid（Favorite.id）匹配，点击后选中并按收藏夹播放
- 回车可选择首条结果，点击结果立即播放或切换歌单

## Bilibili 音频解析（yt-dlp + 缓存）

- 后端 `Service.ResolveBiliAudio(bvidOrUrl)` 调用 yt-dlp 解析 bestaudio（优先 m4a），未过期则直接返回缓存
- Song 增加 `streamUrlExpiresAt` 字段；解析成功自动写库并记录到期时间（从 URL 的 expire/deadline 参数推断，缺省 +2h）
- 返回结构 `BiliAudio`：`url`、`expiresAt`、`fromCache`、`title`、`format`，便于前端按需刷新或提示
- 需要本机可执行的 yt-dlp；未安装时返回错误

## 下一步计划

- 将真实音频播放和媒体会话接入前端
- 移植 Bilibili 数据获取和歌词搜索逻辑并接入后端
- 完善导入/导出 UI 和播放列表操作，以镜像扩展功能

## 开发计划

1. B 站音频解析服务：内嵌 yt-dlp 获取 bestaudio m4a，必要时通过 Go 代理添加 Referer；缓存直链并在过期时刷新。
2. 多 P/收藏夹联动：支持分 P 选择、根据 fid 拉取收藏夹并批量入库；结果直接可被 Spotlight 搜索。
3. 快捷键与无障碍：为 Spotlight 搜索绑定 Cmd/Ctrl+K，补充焦点管理与可达性提示。
4. 播放稳健性：增加音频直链失效重试与降级提示，覆盖 Safari/Edge 兼容性。
5. 自动化检查：补充前端单测/Smoke 测试覆盖搜索浮层交互与播放触发。
