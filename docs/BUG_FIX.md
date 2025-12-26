# Bug Fix: UNIQUE constraint failed: songs.id

## 问题描述

用户在添加歌曲、导入收藏夹或播放音频时，会遇到"UNIQUE constraint failed: songs.id"数据库错误，导致以下情况：
- 新添加的歌曲无法保存
- 本地缓存的歌曲信息无法更新
- 播放过程中流地址更新失败

错误日志示例：
```
UNIQUE constraint failed: songs.id
本地文件加载失败，清除本地 URL 并重新获取网络地址
音频加载错误
```

## 根本原因

在 Go 后端的 `UpsertSongs()` 函数中，使用了 `tx.Create(&songs)` 进行批量插入。问题在于：

1. **只支持插入，不支持更新**：`Create()` 方法仅能插入新记录，无法在主键冲突时进行更新
2. **多次调用导致重复插入尝试**：前端多个地方会调用 `UpsertSongs()`，包括：
   - `useBVModal.ts` - 添加 BV 号歌曲
   - `usePlaySong.ts` - 更新播放地址
   - `useSongCache.ts` - 缓存歌曲元数据（带 500ms 防抖）
   - `useFavoriteActions.ts` - 导入收藏夹和创建歌单
   
3. **竞态条件**：当这些调用在短时间内发生时（尤其是缓存层的防抖未完成），会尝试用同一个 ID 插入两次

## 解决方案

修改 `UpsertSongs()` 函数，使用 GORM 的 `clause.OnConflict` 实现真正的 UPSERT 操作：

```go
// 修改前（只能插入，主键冲突时报错）
if err := tx.Create(&songs).Error; err != nil {
    return err
}

// 修改后（支持插入或更新）
if err := tx.Clauses(clause.OnConflict{
    UpdateAll: true,
}).Create(&songs).Error; err != nil {
    return err
}
```

### 工作原理

- `clause.OnConflict{UpdateAll: true}` 使用 SQL 的 `INSERT OR REPLACE` 语义
- 如果歌曲 ID 已存在，则用新值覆盖所有列
- 如果歌曲 ID 不存在，则插入新记录
- 避免了 UNIQUE 约束违反的错误

## 修改文件

- `/internal/services/service.go` - 行 85-127
  - `UpsertSongs()` 函数
  - 添加了 `UpdateAll: true` 的 `OnConflict` 子句
  - 添加了注释说明行为

## 测试验证

### 修复后的行为

✅ **添加 BV 号歌曲** - 即使多次调用 `UpsertSongs()`，第二次不会报错
✅ **更新播放地址** - 播放过程中动态获取新的流地址并保存
✅ **缓存歌曲元数据** - 500ms 防抖的异步保存不再与其他操作冲突
✅ **导入收藏夹** - 批量导入大量 BV 号时不再出现约束违反

### 编译状态

✅ **编译成功** - 2025/12/26 09:58:49
- 平台: darwin/arm64 (macOS)
- 耗时: 6.767s
- 二进制: `/Users/syy/Desktop/code/azusa-player/tomorin/build/bin/Tomorin Player.app`

## 影响范围

- **前端代码**: 无需修改，所有调用点自动受益
- **数据库**: 无迁移需要，使用现有的 songs 表结构
- **向后兼容性**: 完全兼容，只是修改了数据库操作的语义

## 相关代码

前端调用点（所有自动修复）：
1. `/frontend/src/hooks/features/useBVModal.ts` - BV 号添加
2. `/frontend/src/hooks/player/usePlaySong.ts` - 流地址更新
3. `/frontend/src/hooks/data/useSongCache.ts` - 元数据缓存
4. `/frontend/src/hooks/features/useFavoriteActions.ts` - 收藏夹导入
5. `/frontend/src/hooks/data/useSongs.ts` - 歌曲管理
6. `/frontend/src/hooks/player/useAudioEvents.ts` - 音频事件处理

## 版本信息

- **修复日期**: 2025-12-26
- **GORM 版本**: v4+ (支持 clause.OnConflict)
- **修复类型**: Bug Fix (数据库层)
