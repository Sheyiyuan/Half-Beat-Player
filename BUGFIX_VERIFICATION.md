# UNIQUE constraint Bug Fix 验证测试计划

## 概述

此文档详细说明如何验证 "UNIQUE constraint failed: songs.id" bug 已被成功修复。

## 修复内容

**文件**: `/internal/services/service.go` 行 85-127  
**函数**: `UpsertSongs(songs []models.Song) error`  
**改动**: 使用 `clause.OnConflict{UpdateAll: true}` 实现 UPSERT 语义

## 测试场景

### 场景 1：添加 BV 号歌曲（基础测试）

**操作步骤**:
1. 打开应用
2. 点击搜索框，输入有效的 BV 号（如 `BV1jj411a7Cy`）
3. 当本地没有此 BV 号时，显示"解析 BV 号并添加到歌单"按钮
4. 点击"确认添加"
5. 应该成功添加而不出现数据库错误

**预期结果**: ✅ 歌曲成功添加到库中，无 UNIQUE constraint 错误

**之前的问题**: ❌ "UNIQUE constraint failed: songs.id"

---

### 场景 2：重复添加同一首歌（并发测试）

**操作步骤**:
1. 添加一首 BV 号歌曲（如 BV1jj411a7Cy）
2. 立即再次尝试添加相同的 BV 号
3. 系统应该用新数据覆盖旧数据，而不是报错

**预期结果**: ✅ 第二次添加成功，数据被覆盖更新

**之前的问题**: ❌ 第二次添加失败，报"UNIQUE constraint failed"

---

### 场景 3：播放歌曲时更新流地址（高频操作）

**操作步骤**:
1. 加入一首歌曲到播放列表
2. 点击播放
3. 系统会调用 `usePlaySong.ts` 获取最新流地址并通过 `UpsertSongs()` 保存
4. 继续播放，应该顺利进行

**预期结果**: ✅ 音频正常播放，流地址成功更新

**之前的问题**: ❌ "UNIQUE constraint failed" 或 "本地文件加载失败"

---

### 场景 4：导入 B 站收藏夹（批量操作）

**操作步骤**:
1. 登录 B 站账号
2. 点击"导入收藏夹"
3. 选择包含多个 BV 号的收藏夹
4. 点击"导入"
5. 系统会批量调用 `UpsertSongs()` 添加所有歌曲

**预期结果**: ✅ 所有歌曲成功导入，无数据库错误

**之前的问题**: ❌ 导入过程中因为重复的歌曲而失败，报 UNIQUE constraint 错误

---

### 场景 5：快速修改歌曲信息（缓存防抖测试）

**操作步骤**:
1. 加入一首歌曲
2. 修改其跳过起始时间或其他信息（触发 `useSongCache.ts` 的防抖保存）
3. 立即再修改一次（在 500ms 防抖窗口内）
4. 等待防抖完成（500ms）

**预期结果**: ✅ 两次修改都成功保存，后面的修改覆盖前面的

**之前的问题**: ❌ 因为两个 `UpsertSongs` 调用在短时间内发生，第二个报错

---

## 验证清单

| 场景 | 操作             | 预期         | 实际 | 状态 |
| ---- | ---------------- | ------------ | ---- | ---- |
| 1    | 添加新 BV 号     | ✅ 成功       |      | ⬜    |
| 2    | 重复添加同一 BV  | ✅ 覆盖更新   |      | ⬜    |
| 3    | 播放时更新流地址 | ✅ 音频播放   |      | ⬜    |
| 4    | 导入收藏夹       | ✅ 全部导入   |      | ⬜    |
| 5    | 快速修改信息     | ✅ 都成功保存 |      | ⬜    |

## 错误现象排查

如果仍然看到以下错误，说明修复可能未生效：

### ❌ 仍然出现 UNIQUE constraint 错误

**可能原因**:
1. 应用未重新编译（使用了旧的二进制）
2. 数据库文件未清理（旧 schema）

**解决方案**:
```bash
# 重新编译
cd /Users/syy/Desktop/code/azusa-player/tomorin
wails build

# 或清理并运行
rm -rf ~/Library/Application\ Support/Tomorin\ Player/app_data/
wails dev
```

### ❌ 其他数据库错误

**可能原因**:
1. 其他地方的 `tx.Create()` 未使用 UPSERT
2. 外键约束冲突

**检查方法**:
```bash
# 查看完整的错误日志
sqlite3 ~/Library/Application\ Support/Tomorin\ Player/app_data/tomorin.db ".tables"
```

## 代码审查关键点

修复的代码应包含：

```go
if err := tx.Clauses(clause.OnConflict{
    UpdateAll: true,
}).Create(&songs).Error; err != nil {
    return err
}
```

**关键要素**:
- ✅ `clause.OnConflict` 已导入（在 imports 中）
- ✅ `UpdateAll: true` 设置为更新所有列
- ✅ 保持在 Transaction 内部
- ✅ 注释说明了这是 INSERT OR REPLACE 语义

## 编译验证

运行后应该看到:
```
✅ Compiling application: Done.
✅ Built '/Users/syy/Desktop/code/azusa-player/tomorin/build/bin/Tomorin Player.app'
```

如果看到编译错误，说明代码修改有语法问题。

## 数据库查询验证（高级）

如果需要直接验证数据库中的数据：

```bash
# 打开数据库
sqlite3 ~/Library/Application\ Support/Tomorin\ Player/app_data/tomorin.db

# 查看 songs 表结构
.schema songs

# 查看是否有重复的 song id（应该没有）
SELECT id, COUNT(*) FROM songs GROUP BY id HAVING COUNT(*) > 1;

# 应该返回空结果（没有重复）
```

## 完成标志

修复认为完全成功当且仅当：

✅ 编译无错误  
✅ 应用启动正常  
✅ 所有 5 个场景都能顺利完成  
✅ 数据库中没有重复的 song id  
✅ 日志中没有 UNIQUE constraint 错误  

## 后续维护

- 监控用户报告中是否还有 UNIQUE constraint 相关的错误
- 如果出现其他数据库约束错误，使用相同的 `clause.OnConflict` 方式解决
- 定期检查是否有新的 `.Create()` 调用需要转换为 UPSERT

---

**修复时间**: 2025-12-26 09:58:49  
**编译平台**: darwin/arm64 (macOS Apple Silicon)  
**修复验证员**: GitHub Copilot  
