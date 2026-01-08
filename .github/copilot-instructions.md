# Half Beat Player - GitHub Copilot 指令

> **重要提示**：每次提交代码或完成重大功能更新时，必须同步更新此文档（只保留“仍然有效”的规则与最新变更）。

## 项目概述

Half Beat Player 是基于 Bilibili API 的桌面音乐播放器（Wails v2），支持跳过片头片尾。

- 架构：Wails v2（Go 后端 + TS/React 前端）
- 数据：SQLite（GORM）
- 关键能力：扫码登录、BV 解析、音频代理播放、歌单管理、下载管理

## 技术栈与目录

### 后端（Go）

- 版本：Go 1.22+
- 错误处理：统一用 `fmt.Errorf("context: %w", err)` 包装
- API：在 `internal/services/service.go` 定义方法并通过 Wails 绑定
- DB 模型：`internal/models/`

### 前端（TS/React）

- React 18 + TypeScript 5.3+
- UI：Mantine v8（`@mantine/core`, `@mantine/hooks`, `@mantine/notifications`）
- 状态：以 `frontend/src/hooks/useAppStore.ts` 为单一数据入口（store + actions）
- 样式：Mantine theme + `frontend/src/index.css`
- 图标：`lucide-react` 或 `@tabler/icons-react`

### 常用入口

- `main.go`：应用入口 + AutoMigrate
- `internal/proxy/proxy.go`：音频/图片代理（绕过 Referer 限制）
- `frontend/src/App.tsx`：前端主入口
- `frontend/src/components/`：布局/卡片/模态框

## 开发约定（必须遵守）

1. 修改后端 Service 导出方法后，运行 `wails generate module` 更新前端绑定。
2. 音频播放必须走本地代理（`internal/proxy/`），不要直接把 B 站直链塞给 `<audio>`。
3. 图片资源（头像、封面）建议使用 `useImageProxy` Hook 处理，特别是在 Windows 环境下。
4. 长文本显示优先使用 `useScrollingText` Hook 或 `ScrollingText` 组件，而非简单的省略号。
5. 并发：谨慎使用 goroutine；确保 context 可取消；后台任务尽量 best-effort，不阻塞播放。
6. 资源管理：应用关闭时正确停止代理与关闭 DB。

## 数据持久化与缓存（关键约束）

### 登录会话 / 播放记录入库

- `LoginSession` 与 `PlayHistory` 采用“单行表”（ID=1）保存；首次读取支持从旧 JSON 文件一次性迁移并 best-effort 删除旧文件。
- 关键路径：
  - `internal/services/login.go`
  - `internal/services/download.go`
  - `internal/models/models.go`、`main.go`（AutoMigrate）

### 音频缓存目录

- 缓存目录：`~/.config/half-beat/app_data/audio_cache`（Linux；`~/.config` 默认隐藏）
- 启动时创建 `audio_cache`，确保目录可见。
- `ClearAudioCache()`：清空目录内容但保留目录本身。

### 播放即缓存（落盘）

- 前端：代理播放 URL 追加 `sid=<song.id>`
- 后端代理：收到 `/audio` 且带 `sid` 时，后台 best-effort 拉取完整音频并写入 `audio_cache/<sid>.m4s`（不阻塞当前播放）

## 图片代理系统（Windows 兼容性）

### 问题背景

Windows 环境下 B 站图片资源（头像、封面）因 Referer/CORS 限制无法直接加载。

### 解决方案

- 后端：`internal/proxy/proxy.go` 新增 `/image` 端点，设置适当请求头绕过限制
- 前端：`useImageProxy` Hook 提供统一的图片 URL 转换接口

### 使用方式

```typescript
import { useImageProxy } from '../../hooks/ui/useImageProxy';

const MyComponent = () => {
    const { getProxiedImageUrlSync } = useImageProxy();
    
    return <Image src={getProxiedImageUrlSync(originalUrl)} />;
};
```

### 自动处理

- 跳过本地资源（data:、blob:、127.0.0.1）
- 错误时自动回退到原始 URL
- 已更新的组件：TopBar（头像）、SongDetailCard（封面）、搜索/BV 模态框

## 滚动文本系统

### 核心组件

- **useScrollingText Hook**: 智能检测文本宽度，动态计算滚动参数
- **ScrollingText 组件**: 可复用的滚动文本组件，支持所有 Mantine Text 属性

### 特性

1. **智能触发**: 基于实际文本宽度而非字符数量
2. **平滑动画**: 带开始/结束暂停的滚动效果
3. **交互友好**: 鼠标悬停暂停滚动
4. **视觉优化**: 渐变遮罩效果
5. **响应式**: 窗口大小变化时自动重新计算

### 使用方式

```typescript
import { useScrollingText } from '../../hooks/ui/useScrollingText';

const MyComponent = () => {
    const scrollingText = useScrollingText({
        text: songName,
        containerWidth: 300,
        speed: 60, // 像素/秒
        pauseDuration: 2, // 暂停时间(秒)
    });
    
    return (
        <div 
            ref={scrollingText.containerRef}
            className={scrollingText.containerClassName}
            style={scrollingText.containerStyle}
        >
            <Text 
                ref={scrollingText.textRef}
                className={scrollingText.textClassName}
                style={scrollingText.animationStyle}
            >
                {songName}
            </Text>
        </div>
    );
};
```

### CSS 类

- `.scrolling-text-container`: 容器样式，支持渐变遮罩
- `.scrolling-text.animate`: 文本动画样式
- `.has-scrolling`: 启用滚动时的容器状态类

## Windows 图标生成系统

### 动态生成流程

CI/CD 构建时自动从 PNG 源文件生成优化的多分辨率 ICO 文件：

1. **源文件**: `assets/icons/appicon-256.png`
2. **目标文件**: `build/windows/icon.ico`
3. **包含分辨率**: 
   - 小图标: 16x16, 20x20, 24x24 (256色优化)
   - 中等图标: 32x32, 40x40, 48x48, 64x64, 72x72 (256色优化)
   - 大图标: 96x96, 128x128 (256色优化), 256x256 (全色彩)
4. **优化特性**:
   - 移除过小/冗余尺寸，专注核心Windows场景
   - 小尺寸图标256色优化，减少文件大小
   - 透明背景保持，确保各种主题兼容性

### 工具链

- **首选**: ImageMagick (`convert` 命令)
- **备用**: icoutils (`icotool` 命令)
- **脚本**: `scripts/generate-icons.sh`

### 手动生成

```bash
# 生成 Windows 图标
./scripts/generate-icons.sh windows

# 生成所有平台图标
./scripts/generate-icons.sh all
```

### 集成点

- **Windows 构建**: `scripts/windows/build-windows.sh` 自动调用
- **GitHub Actions**: 工作流中自动执行
- **Wails 配置**: `wails.json` 中指向生成的 ICO 文件

## UI 约定（与 Wails 相关）

### 顶栏拖拽

- 使用 Wails CSS 自定义属性：`--wails-draggable: drag`
- 可点击元素上使用 `--wails-draggable: no-drag` 以避免误拖拽（如 `.window-control`、`button`、`.app-no-drag`）

### 文本省略号策略

- 底部播放条：歌名使用智能滚动展示（`useScrollingText` Hook），支持悬停暂停和渐变遮罩。
- 列表/面板：标题/列表项空间不足时使用单行省略号（通常用 `truncate` 或 `lineClamp={1}`，并确保父容器 `minWidth: 0`）。

## 主题系统（要点）

### 主题模型与序列化

- 后端 Theme 模型精简为：`id`, `name`, `data(JSON)`, `isDefault`, `isReadOnly`（后端不强制 schema）。
- 前端通过 `convertTheme()` 将 `data` 反序列化为完整 Theme 对象，并提供合理默认值。

### colorScheme（亮/暗）

- 字段：`colorScheme: 'light' | 'dark'`（默认 `dark`）
- 应用主题时需同步调用 Mantine 的 `setColorScheme()`。

### 常见踩坑：重启回默认主题

- 正确：主题选择/编辑后调用 `store.actions.applyTheme(theme)`，它会同步 UI 并写入 `localStorage`（`half-beat.currentThemeId`）。
- 错误：只更新 UI setters / 只更新 `currentThemeId`，可能导致下次启动回退。

### 主题详情/编辑（简述）

- 支持 GUI 与 JSON 两种模式；两者等价并互相同步。
- JSON 模式包含强校验、错误提示、复制 JSON（只读模式不显示复制）。
- 两种模式容器高度固定为 500px（ScrollArea）。

## 最近更新（2026-01-09）

- **Windows图标优化**：进一步优化图标生成，使用11个核心尺寸替代18个尺寸，添加256色优化和透明背景处理，减少32%文件大小同时提高兼容性。
- **滚动文本系统**：实现播放控件歌曲名称的增强滚动效果，支持智能触发、悬停暂停、渐变遮罩。
- **Windows图标生成**：CI/CD中动态生成多分辨率ICO文件，解决Windows打包图标问题。
- **图片代理修复**：新增图片代理服务解决 Windows 上 B 站图片资源加载问题（头像、封面等）。
- **版本号系统优化**：统一版本号生成逻辑，修复dev release标题问题。
- 顶栏可拖拽：TopBar 使用 `--wails-draggable`，交互元素 no-drag。
- UI 文本：底部滚动标题不省略；列表项单行省略号。
- 登录/播放记录：统一迁移到 SQLite 单行表（含旧文件迁移）。
- 缓存：音频缓存目录 `audio_cache` 启动即创建；清缓存保留目录；播放即缓存落盘到 `audio_cache/<sid>.m4s`。

## ⚠️ 添加新字段时的关键检查清单

当添加新的主题配置字段（如 `colorScheme`）时，必须在以下所有位置同步修改，否则容易出现 `Can't find variable` / `undefined`：

### 1. 后端模型层

- [ ] 在 Go 结构体中添加字段（`internal/models/models.go`）
- [ ] 确保字段有正确的 JSON 标签

### 2. 前端类型定义层

- [ ] `frontend/wailsjs/go/models.ts`
- [ ] `frontend/src/utils/constants.ts`
- [ ] `frontend/src/types.ts`

### 3. 状态管理层

- [ ] 若字段参与 UI 状态：在 store/state 与 apply 逻辑中处理（优先跟随 `useAppStore` 体系）

### 4. 组件层

- [ ] Props 类型补齐
- [ ] ⚠️ 关键：组件函数参数解构中显式解构该字段

### 5. Hook 层

- [ ] Hook 入参/返回类型补齐
- [ ] ⚠️ 关键：Hook 函数参数解构中显式解构该字段

### 常见错误速查

| 错误                         | 常见原因                         | 解决方案                |
| ---------------------------- | -------------------------------- | ----------------------- |
| `Can't find variable: xxx` | 使用了字段但忘了在参数解构中取出 | 检查函数签名/解构并补齐 |
| `undefined`                | 初始化/默认值遗漏                | 补齐默认值与 apply 逻辑 |

最易出错的地方：**参数解构**。
