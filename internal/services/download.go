package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"half-beat-player/internal/models"

	"gorm.io/gorm"
)

// 音频与封面存储相关常量
const (
	cacheDir        = "audio_cache" // 被动缓存
	downloadsDir    = "downloads"   // 主动下载
	coversDir       = "covers"      // 封面缓存
	playHistoryFile = "play_history.json"
)

// PlayHistory 记录上次播放的信息
type PlayHistory struct {
	FavoriteID string `json:"favoriteId"`
	SongID     string `json:"songId"`
	Timestamp  int64  `json:"timestamp"`
}

// ensureCoverCached 下载封面到本地缓存并返回本地路径
func (s *Service) ensureCoverCached(song *models.Song) (string, error) {
	if song == nil {
		return "", fmt.Errorf("song 不能为空")
	}

	if song.Cover == "" {
		return "", nil
	}

	// 已有本地封面且文件存在则复用
	if song.CoverLocal != "" {
		if _, err := os.Stat(song.CoverLocal); err == nil {
			return song.CoverLocal, nil
		}
	}

	dstDir := filepath.Join(s.dataDir, coversDir)
	if err := os.MkdirAll(dstDir, 0o755); err != nil {
		return "", fmt.Errorf("创建封面目录失败: %w", err)
	}

	ext := ".jpg"
	if u, err := url.Parse(song.Cover); err == nil {
		lower := strings.ToLower(u.Path)
		switch {
		case strings.HasSuffix(lower, ".png"):
			ext = ".png"
		case strings.HasSuffix(lower, ".webp"):
			ext = ".webp"
		case strings.HasSuffix(lower, ".jpeg"):
			ext = ".jpeg"
		case strings.HasSuffix(lower, ".jpg"):
			ext = ".jpg"
		}
	}

	dstPath := filepath.Join(dstDir, song.ID+ext)
	tmpPath := dstPath + ".part"
	_ = os.Remove(tmpPath)

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "GET", song.Cover, nil)
	if err != nil {
		return "", fmt.Errorf("创建封面请求失败: %w", err)
	}
	req.Header.Set("User-Agent", "Mozilla/5.0")
	req.Header.Set("Referer", "https://www.bilibili.com/")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("下载封面失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("封面下载失败，状态码: %d", resp.StatusCode)
	}

	const maxCoverSize = 2 * 1024 * 1024 // 2MB 上限，避免异常大文件
	f, err := os.Create(tmpPath)
	if err != nil {
		return "", fmt.Errorf("创建封面文件失败: %w", err)
	}
	defer f.Close()

	if _, err := io.Copy(f, io.LimitReader(resp.Body, maxCoverSize)); err != nil {
		_ = f.Close()
		_ = os.Remove(tmpPath)
		return "", fmt.Errorf("写入封面失败: %w", err)
	}

	if err := os.Rename(tmpPath, dstPath); err != nil {
		_ = os.Remove(tmpPath)
		return "", fmt.Errorf("保存封面失败: %w", err)
	}

	song.CoverLocal = dstPath
	_ = s.db.Model(song).Update("cover_local", dstPath)

	return dstPath, nil
}

// DownloadSong downloads the audio file for the given song ID to the local cache directory
// and returns the absolute file path. The file is saved under dataDir/audio_cache.
func (s *Service) DownloadSong(songID string) (string, error) {
	if songID == "" {
		return "", fmt.Errorf("songID 不能为空")
	}

	// Lookup song
	var song models.Song
	if err := s.db.First(&song, "id = ?", songID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", fmt.Errorf("未找到歌曲: %s", songID)
		}
		return "", fmt.Errorf("查询歌曲失败: %w", err)
	}

	// 封面本地缓存（最佳努力，不阻断音频下载）
	if _, err := s.ensureCoverCached(&song); err != nil {
		fmt.Printf("[Download] 封面缓存失败: %v\n", err)
	}

	// Ensure we have a valid audio URL
	var audioURL string
	if song.StreamURL != "" && song.StreamURLExpiresAt.After(time.Now().Add(30*time.Second)) {
		if strings.Contains(song.StreamURL, "127.0.0.1:9999/audio") {
			if song.BVID == "" {
				return "", fmt.Errorf("歌曲缺少 BVID，无法解析播放地址")
			}
			info, err := s.GetPlayURL(song.BVID, 1)
			if err != nil {
				return "", err
			}
			audioURL = info.RawURL
		} else {
			audioURL = song.StreamURL
		}
	} else {
		if song.BVID == "" {
			return "", fmt.Errorf("歌曲缺少 BVID，无法解析播放地址")
		}
		info, err := s.GetPlayURL(song.BVID, 1)
		if err != nil {
			return "", err
		}
		audioURL = info.RawURL
		song.StreamURL = info.ProxyURL
		song.StreamURLExpiresAt = info.ExpiresAt
		song.UpdatedAt = time.Now()
		_ = s.db.Save(&song).Error
	}

	dstDir := filepath.Join(s.dataDir, downloadsDir)
	if err := os.MkdirAll(dstDir, 0o755); err != nil {
		return "", fmt.Errorf("创建下载目录失败: %w", err)
	}

	filename := fmt.Sprintf("%s.m4s", song.ID)
	dstPath := filepath.Join(dstDir, filename)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "GET", audioURL, nil)
	if err != nil {
		return "", fmt.Errorf("创建下载请求失败: %w", err)
	}
	req.Header.Set("User-Agent", "Mozilla/5.0")
	req.Header.Set("Referer", "https://www.bilibili.com/")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("下载失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("下载失败，状态码: %d", resp.StatusCode)
	}

	contentLength := resp.ContentLength
	if contentLength <= 0 {
		return "", fmt.Errorf("无法获取文件大小信息，可能是服务器不支持")
	}

	tmpPath := dstPath + ".part"
	_ = os.Remove(tmpPath)

	f, err := os.Create(tmpPath)
	if err != nil {
		return "", fmt.Errorf("创建文件失败: %w", err)
	}
	defer f.Close()

	written, err := io.Copy(f, resp.Body)
	if err != nil {
		_ = f.Close()
		_ = os.Remove(tmpPath)
		return "", fmt.Errorf("写入文件失败: %w", err)
	}

	if written != contentLength {
		_ = f.Close()
		_ = os.Remove(tmpPath)
		return "", fmt.Errorf("下载不完整: 期望 %d 字节，实际 %d 字节", contentLength, written)
	}

	if err := f.Sync(); err != nil {
		_ = f.Close()
		_ = os.Remove(tmpPath)
		return "", fmt.Errorf("刷新文件失败: %w", err)
	}
	_ = f.Close()

	stat, err := os.Stat(tmpPath)
	if err != nil {
		_ = os.Remove(tmpPath)
		return "", fmt.Errorf("文件验证失败: %w", err)
	}
	if stat.Size() != contentLength {
		_ = os.Remove(tmpPath)
		return "", fmt.Errorf("文件大小验证失败: 期望 %d 字节，实际 %d 字节", contentLength, stat.Size())
	}

	if _, err := os.Stat(dstPath); err == nil {
		if err := os.Remove(dstPath); err != nil {
			_ = os.Remove(tmpPath)
			return "", fmt.Errorf("无法覆盖已存在的文件: %w", err)
		}
	}

	if err := os.Rename(tmpPath, dstPath); err != nil {
		_ = os.Remove(tmpPath)
		return "", fmt.Errorf("保存文件失败: %w", err)
	}

	stat, err = os.Stat(dstPath)
	if err != nil {
		_ = os.Remove(dstPath)
		return "", fmt.Errorf("最终验证失败: %w", err)
	}
	if stat.Size() != contentLength {
		_ = os.Remove(dstPath)
		return "", fmt.Errorf("最终大小验证失败: 期望 %d 字节，实际 %d 字节", contentLength, stat.Size())
	}

	fmt.Printf("[Download] 成功下载 %s: %d 字节\n", filename, contentLength)
	return dstPath, nil
}

// GetLocalAudioURL returns a local proxy URL for a cached audio file if it exists,
// otherwise returns an empty string.
func (s *Service) GetLocalAudioURL(songID string) (string, error) {
	if songID == "" {
		return "", fmt.Errorf("songID 不能为空")
	}
	fname := fmt.Sprintf("%s.m4s", songID)
	path := filepath.Join(s.dataDir, cacheDir, fname)
	if _, err := os.Stat(path); err == nil {
		urlStr := fmt.Sprintf("http://127.0.0.1:%d/local?f=%s", 9999, url.QueryEscape(fname))
		return urlStr, nil
	}
	path2 := filepath.Join(s.dataDir, downloadsDir, fname)
	if _, err := os.Stat(path2); err == nil {
		urlStr := fmt.Sprintf("http://127.0.0.1:%d/local?f=%s", 9999, url.QueryEscape(fname))
		return urlStr, nil
	}
	return "", nil
}

// OpenAudioCacheFolder opens the audio cache directory in the system file manager.
func (s *Service) OpenAudioCacheFolder() error {
	dir := filepath.Join(s.dataDir, cacheDir)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("创建缓存目录失败: %w", err)
	}

	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", dir)
	case "linux":
		cmd = exec.Command("xdg-open", dir)
	case "windows":
		cmd = exec.Command("explorer", dir)
	default:
		return fmt.Errorf("不支持的操作系统: %s", runtime.GOOS)
	}

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("打开文件管理器失败: %w", err)
	}
	return nil
}

// OpenDownloadsFolder opens the downloads directory in the system file manager.
func (s *Service) OpenDownloadsFolder() error {
	dir := filepath.Join(s.dataDir, downloadsDir)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("创建下载目录失败: %w", err)
	}

	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", dir)
	case "linux":
		cmd = exec.Command("xdg-open", dir)
	case "windows":
		cmd = exec.Command("explorer", dir)
	default:
		return fmt.Errorf("不支持的操作系统: %s", runtime.GOOS)
	}

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("打开文件管理器失败: %w", err)
	}
	return nil
}

// IsSongDownloaded checks if the song exists in the downloads directory
func (s *Service) IsSongDownloaded(songID string) (bool, error) {
	if songID == "" {
		return false, fmt.Errorf("songID 不能为空")
	}
	fname := fmt.Sprintf("%s.m4s", songID)
	path := filepath.Join(s.dataDir, downloadsDir, fname)
	if _, err := os.Stat(path); err != nil {
		if os.IsNotExist(err) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

// DeleteDownloadedSong deletes the song file from the downloads directory
func (s *Service) DeleteDownloadedSong(songID string) error {
	if songID == "" {
		return fmt.Errorf("songID 不能为空")
	}
	fname := fmt.Sprintf("%s.m4s", songID)
	path := filepath.Join(s.dataDir, downloadsDir, fname)
	if _, err := os.Stat(path); err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	return os.Remove(path)
}

// OpenDownloadedFile reveals the downloaded file in the system file manager
func (s *Service) OpenDownloadedFile(songID string) error {
	if songID == "" {
		return fmt.Errorf("songID 不能为空")
	}
	fname := fmt.Sprintf("%s.m4s", songID)
	path := filepath.Join(s.dataDir, downloadsDir, fname)
	if _, err := os.Stat(path); err != nil {
		return err
	}

	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", "-R", path)
	case "linux":
		cmd = exec.Command("xdg-open", filepath.Dir(path))
	case "windows":
		cmd = exec.Command("explorer", path)
	default:
		return fmt.Errorf("不支持的操作系统: %s", runtime.GOOS)
	}
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("打开文件失败: %w", err)
	}
	return nil
}

// GetAudioCacheSize 获取缓存大小
func (s *Service) GetAudioCacheSize() (int64, error) {
	cachePath := filepath.Join(s.dataDir, cacheDir)
	if _, err := os.Stat(cachePath); os.IsNotExist(err) {
		return 0, nil
	}

	var size int64
	err := filepath.Walk(cachePath, func(_ string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			size += info.Size()
		}
		return nil
	})
	return size, err
}

// ClearAudioCache 清除所有缓存音乐
func (s *Service) ClearAudioCache() error {
	cachePath := filepath.Join(s.dataDir, cacheDir)
	if _, err := os.Stat(cachePath); os.IsNotExist(err) {
		return nil
	}
	return os.RemoveAll(cachePath)
}

// SavePlayHistory 保存播放历史
func (s *Service) SavePlayHistory(favoriteID, songID string) error {
	historyFile := filepath.Join(s.dataDir, playHistoryFile)
	history := PlayHistory{
		FavoriteID: favoriteID,
		SongID:     songID,
		Timestamp:  time.Now().Unix(),
	}

	data, err := json.MarshalIndent(history, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(historyFile, data, 0o644)
}

// GetPlayHistory 获取播放历史
func (s *Service) GetPlayHistory() (PlayHistory, error) {
	historyFile := filepath.Join(s.dataDir, playHistoryFile)
	data, err := os.ReadFile(historyFile)
	if err != nil {
		if os.IsNotExist(err) {
			return PlayHistory{}, nil
		}
		return PlayHistory{}, err
	}

	var history PlayHistory
	if err := json.Unmarshal(data, &history); err != nil {
		return PlayHistory{}, err
	}
	return history, nil
}

// OpenDatabaseFile opens the database file in the system file manager.
func (s *Service) OpenDatabaseFile() error {
	dbDir := s.dataDir
	if _, err := os.Stat(dbDir); err != nil {
		return fmt.Errorf("数据库目录不存在: %w", err)
	}

	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		// macOS: 使用 open 打开文件夹
		cmd = exec.Command("open", dbDir)
	case "linux":
		// Linux: 使用文件管理器打开文件夹
		cmd = exec.Command("xdg-open", dbDir)
	case "windows":
		// Windows: 使用 explorer 打开文件夹
		cmd = exec.Command("explorer", dbDir)
	default:
		return fmt.Errorf("不支持的操作系统: %s", runtime.GOOS)
	}

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("打开数据库目录失败: %w", err)
	}
	return nil
}
