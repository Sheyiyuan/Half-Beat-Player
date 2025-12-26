# 网络源错误自动重新获取改进

## 问题描述

当播放网络源时（代理 URL），如果出现网络错误（如 403 Forbidden），原有的重试机制存在以下缺陷：

1. **URL 过期未被检测** - 重试时仍使用旧的失效 URL，可能导致同样的错误
2. **缺少 URL 刷新** - 错误处理中没有强制刷新 B站 API 获取新 URL 的逻辑
3. **重试计数限制过高** - 原来设置的上限是 3 次，容易导致用户长时间等待失败

## 解决方案

### 核心改进：强制 URL 刷新策略

在 `useAudioEvents.ts` 中改进网络错误处理：

**之前的逻辑**:
```typescript
// 重试时仍使用原始的 currentSong
playSong(currentSong, queue)  // ❌ currentSong.streamUrl 可能过期或失效
```

**改进后的逻辑**:
```typescript
// 清空 streamUrl，强制 playSong 重新获取新 URL
const urlExpiredSong = {
    ...currentSong,
    streamUrl: '', // 清空强制刷新
    streamUrlExpiresAt: new Date().toISOString(),
};
playSong(urlExpiredSong, queue)  // ✅ playSong 会检测到 URL 过期并调用 GetPlayURL
```

### 工作流程

```
网络错误 (code===2)
    ↓
记录重试次数
    ↓
检查重试次数是否超过 2 次
    ├─ YES → 放弃，提示用户稍后重试 ✓
    └─ NO ↓
停止音频播放，清空 src
    ↓
创建"URL过期"的歌曲对象（streamUrl = ''）
    ↓
延迟 500ms 后调用 playSong(urlExpiredSong)
    ↓
usePlaySong 检测 streamUrl 为空 → 判定为"过期"
    ↓
调用 Services.GetPlayURL(song.bvid, 0)
    ↓
获取全新的代理 URL
    ↓
更新数据库并播放 ✓
```

### 关键改进点

| 项目         | 之前               | 之后                       | 说明                        |
| ------------ | ------------------ | -------------------------- | --------------------------- |
| 重试计数上限 | 3 次               | 2 次                       | 减少用户等待时间            |
| URL 刷新方式 | 被动 (如果过期)    | 主动 (清空)                | 确保获取新 URL              |
| 错误消息     | "播放地址刷新失败" | "网络源失效，正在重新获取" | 更清晰的用户反馈            |
| URL 清空逻辑 | 无                 | 强制清空 streamUrl         | 触发 usePlaySong 的过期判断 |

## 防止死循环的机制

### 1. **重试计数限制**
```typescript
const count = (playbackRetryRef.current.get(currentSong.id) ?? 0) + 1;
if (count > 2) {
    // 放弃，提示用户
    return;
}
```
- 网络源错误最多重试 2 次（获取 2 个新 URL）
- 超过 2 次则放弃，避免无限重试

### 2. **错误类型隔离**
```typescript
if (audio.error && audio.error.code === 2 && currentSong?.bvid) {
    // 只处理网络错误 (code 2 = NETWORK_ERROR)
    // 排除其他类型的错误
}
```
- 仅处理 NETWORK_ERROR，不处理其他错误类型
- 防止将不同类型的错误误判为网络错误

### 3. **手动切歌时清除计数**
在 `usePlaybackControls.ts` 中，当用户点击"下一首"或"上一首"时：
```typescript
playbackRetryRef.current.delete(nextSong.id)
isHandlingErrorRef?.current.delete(nextSong.id)
```
- 新歌曲的重试计数从 0 开始
- 避免跨歌曲的错误状态污染

### 4. **错误处理去重 (isHandlingErrorRef)**
```typescript
if (!currentSong?.id || isHandlingErrorRef.current.has(currentSong.id)) {
    return; // 已在处理中，不重复处理
}
isHandlingErrorRef.current.add(currentSong.id);
```
- 防止同一个错误事件被处理多次
- 当 error 事件频繁触发时有效

## 测试场景

### 场景 1: 代理 URL 过期
```
播放 → error event (403) → 网络错误处理
→ 清空 URL → playSong 获取新 URL
→ 继续播放 ✓
```

### 场景 2: 两次都获取失败
```
第 1 次网络错误 → 获取新 URL1 → 仍失败
第 2 次网络错误 → 获取新 URL2 → 仍失败
超过上限 → 放弃，提示用户
用户手动重试 → 计数重置为 0，可再次重试
```

### 场景 3: 网络恢复
```
网络错误 → 重新获取 URL → 网络已恢复 → 播放成功 ✓
error event 停止触发
重试计数仍为 1，但成功播放
```

## 与本地文件错误的区别

| 错误类型         | 处理方式                | 重试次数 | 目标               |
| ---------------- | ----------------------- | -------- | ------------------ |
| **本地文件错误** | 标记为 `__SKIP_LOCAL__` | 2 次     | 强制使用网络源     |
| **网络源错误**   | 清空 URL，重新获取      | 2 次     | 刷新过期的代理 URL |
| **格式不支持**   | 直接失败，无重试        | 0 次     | 无法恢复           |

## 用户体验改进

### 之前
- 网络错误时会反复尝试相同失效的 URL
- 可能需要等待最多 3 次重试（每次等待音频超时）
- 错误消息不清晰

### 之后
- 自动刷新 B站 API 获取新的代理 URL
- 最多重试 2 次，更快反馈
- 清晰的进度提示："网络源失效，正在重新获取..."
- 若 2 次都失败，明确提示"请稍后重试"（而不是反复尝试）

## 后续可能的改进

1. **指数退避** - 第 2 次重试时延迟更长
2. **本地回退** - 如果网络源 2 次都失败，尝试本地文件
3. **用户手动重试按钮** - 提供明确的"重试"按钮
4. **重试历史记录** - 记录哪些 URL 已失败，避免重复尝试
5. **智能 URL 池** - 缓存多个可用的代理 URL
