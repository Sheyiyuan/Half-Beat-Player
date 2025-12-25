# Tomorin Player - GitHub Copilot 指令

## 项目概述

**Tomorin Player** 是一个基于 B站 API 的音乐播放器，采用 Wails 框架构建桌面应用。

- **语言**: Go (后端) + TypeScript/React (前端)
- **框架**: Wails v2, React 18, Mantine v8
- **主要功能**: B站扫码登录、BV 号解析、音频播放、歌单管理

## 最近完成的工作

### ✅ Phase 1-4: 核心功能实现 (已完成)
1. **完全去除 yt-dlp** → 改用 B站 API
2. **修复页面样式** → 添加 Mantine CSS 导入和全局样式
3. **QR 码生成** → 从第三方 API 改为本地 `qrcode` 库
4. **用户信息显示** → 实现 `GetUserInfo()`，显示头像/用户名，缓存到 localStorage

### ✅ Phase 5: BV 号解析失败修复 (刚完成)

**问题**: 输入 BV 号解析失败，显示"未知错误"

**修复方案**:
- 后端: 改进错误消息，修复 API 字段类型
- 前端: 添加登录状态检查

**编译状态**: ✅ 成功

## 代码规范

### Go 后端
- 错误处理: 使用 `fmt.Errorf` 包装错误，提供上下文
- HTTP 请求: 使用 `s.httpClient`
- 数据模型: 在 `internal/models/models.go` 中定义

### TypeScript/React 前端
- 状态管理: React Hooks
- 通知: Mantine `notifications` API
- 样式: Mantine v8 + `index.css`

## 常见任务

1. **添加新 API**: 在 Go 中实现 → 运行 `wails generate` → 在前端调用
2. **修改 UI**: 编辑 `.tsx` 文件，使用 Mantine 组件
3. **调试**: `wails dev` (http://localhost:34115)

## 重要文件

| 文件 | 用途 |
|-----|-----|
| `main.go` | Wails 入口 |
| `internal/services/service.go` | 核心业务逻辑 |
| `internal/models/models.go` | 数据模型 |
| `frontend/src/App.tsx` | 主 React 组件 |
| `wails.json` | Wails 配置 |

## 下一步改进

- [ ] 添加日志记录系统
- [ ] 实现缓存机制
- [ ] 添加网络重试逻辑
- [ ] 支持 Windows/Linux
- [ ] 添加单元测试

