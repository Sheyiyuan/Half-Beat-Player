package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"time"

	"tomorin-player/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// Service exposes backend operations to the Wails frontend.
type Service struct {
	db         *gorm.DB
	cookieJar  http.CookieJar
	httpClient *http.Client
	dataDir    string // 数据目录用于存储 cookie
}

const cookieCacheFile = "sessdata.json"

func NewService(db *gorm.DB, dataDir string) *Service {
	jar, _ := cookiejar.New(nil)

	// 创建具有合理超时的 HTTP Transport
	transport := &http.Transport{
		DialContext: (&net.Dialer{
			Timeout:   10 * time.Second, // 连接超时
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
		Timeout:   30 * time.Second, // 默认请求超时
	}

	// 确保数据目录存在（跨平台用户级路径）
	_ = os.MkdirAll(dataDir, 0o755)

	service := &Service{
		db:         db,
		cookieJar:  jar,
		httpClient: client,
		dataDir:    dataDir,
	}

	// 在启动时尝试恢复之前的登录状态
	_ = service.restoreLogin()

	return service
}

func (s *Service) GetHTTPClient() *http.Client {
	return s.httpClient
}

// Seed inserts a default empty playlist if the DB is empty.
func (s *Service) Seed() error {
	var count int64
	if err := s.db.Model(&models.Favorite{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	seedFav := models.Favorite{ID: "FavList-default", Title: "默认歌单"}
	return s.db.Create(&seedFav).Error
}

// ListSongs returns all songs.
func (s *Service) ListSongs() ([]models.Song, error) {
	var songs []models.Song
	if err := s.db.Find(&songs).Error; err != nil {
		return nil, err
	}
	return songs, nil
}

// UpsertSongs inserts or updates songs with their stream sources.
// Each new song is a separate instance, even if they share the same BVID.
// Supports backward compatibility by accepting streamUrl in Song object.
// Uses INSERT OR REPLACE to handle duplicate IDs gracefully.
func (s *Service) UpsertSongs(songs []models.Song) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		for i := range songs {
			// 每个新的歌曲实例都需要独立的 ID
			if songs[i].ID == "" {
				songs[i].ID = uuid.NewString()
			}

			// 确保歌曲有名字
			if songs[i].Name == "" {
				return fmt.Errorf("歌曲缺少名字")
			}

			// 向后兼容：如果 streamUrl 存在但 sourceId 为空，创建 StreamSource
			if songs[i].StreamURL != "" && songs[i].SourceID == "" {
				sourceID := uuid.NewString()
				source := models.StreamSource{
					ID:        sourceID,
					BVID:      songs[i].BVID,
					StreamURL: songs[i].StreamURL,
					ExpiresAt: songs[i].StreamURLExpiresAt,
				}
				if err := tx.Create(&source).Error; err != nil {
					return err
				}
				songs[i].SourceID = sourceID
			}
		}

		// 批量保存歌曲（使用 UPSERT 处理重复 ID）
		if err := tx.Clauses(clause.OnConflict{
			UpdateAll: true,
		}).Create(&songs).Error; err != nil {
			return err
		}

		return nil
	})
}

// CreateStreamSource creates a new stream source and returns its ID.
func (s *Service) CreateStreamSource(bvid, streamURL string, expiresAt time.Time) (string, error) {
	sourceID := uuid.NewString()
	source := models.StreamSource{
		ID:        sourceID,
		BVID:      bvid,
		StreamURL: streamURL,
		ExpiresAt: expiresAt,
	}
	if err := s.db.Create(&source).Error; err != nil {
		return "", err
	}
	return sourceID, nil
}

// DeleteSong removes song only if it's not referenced by any favorite.
func (s *Service) DeleteSong(id string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		// 检查是否有歌单引用此歌曲
		var refCount int64
		if err := tx.Model(&models.SongRef{}).Where("song_id = ?", id).Count(&refCount).Error; err != nil {
			return err
		}

		if refCount > 0 {
			return fmt.Errorf("歌曲仍被歌单引用，无法删除")
		}

		// 删除歌曲
		if err := tx.Delete(&models.Song{}, "id = ?", id).Error; err != nil {
			return err
		}

		// 检查是否有其他歌曲引用此流源
		var song models.Song
		if err := tx.First(&song, "id = ?", id).Error; err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}

		// 如果没有其他歌曲引用此流源，删除流源
		if song.SourceID != "" {
			var sourceRefCount int64
			if err := tx.Model(&models.Song{}).Where("source_id = ?", song.SourceID).Count(&sourceRefCount).Error; err != nil {
				return err
			}

			if sourceRefCount == 0 {
				if err := tx.Delete(&models.StreamSource{}, "id = ?", song.SourceID).Error; err != nil {
					return err
				}
			}
		}

		return nil
	})
}

// DeleteUnreferencedSongs deletes all songs that are not referenced by any favorite.
func (s *Service) DeleteUnreferencedSongs() (int64, error) {
	return 0, s.db.Transaction(func(tx *gorm.DB) error {
		// 获取所有被引用的歌曲 ID
		var referencedIDs []string
		if err := tx.Model(&models.SongRef{}).
			Distinct("song_id").
			Pluck("song_id", &referencedIDs).Error; err != nil {
			return err
		}

		// 删除所有未被引用的歌曲
		if len(referencedIDs) == 0 {
			// 如果没有引用，删除所有歌曲
			if err := tx.Delete(&models.Song{}).Error; err != nil {
				return err
			}
		} else {
			// 删除不在引用列表中的歌曲
			if err := tx.Where("id NOT IN ?", referencedIDs).Delete(&models.Song{}).Error; err != nil {
				return err
			}
		}

		// 清理未被引用的流源
		if err := tx.Where("id NOT IN (SELECT DISTINCT source_id FROM songs WHERE source_id IS NOT NULL AND source_id != '')").
			Delete(&models.StreamSource{}).Error; err != nil {
			return err
		}

		return nil
	})
}

// ListFavorites returns favorites with song ids only (frontend can hydrate).
func (s *Service) ListFavorites() ([]models.Favorite, error) {
	var favs []models.Favorite
	if err := s.db.Preload("SongIDs").Find(&favs).Error; err != nil {
		return nil, err
	}
	return favs, nil
}

// SaveFavorite stores a favorite list.
func (s *Service) SaveFavorite(fav models.Favorite) error {
	if fav.ID == "" {
		fav.ID = "FavList-" + uuid.NewString()
	}
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clauseOnConflictID()).Create(&fav).Error; err != nil {
			return err
		}
		if err := tx.Where("favorite_id = ?", fav.ID).Delete(&models.SongRef{}).Error; err != nil {
			return err
		}
		for i := range fav.SongIDs {
			fav.SongIDs[i].FavoriteID = fav.ID
		}
		if len(fav.SongIDs) == 0 {
			return nil
		}
		return tx.Create(&fav.SongIDs).Error
	})
}

// DeleteFavorite deletes a favorite and its song refs.
func (s *Service) DeleteFavorite(id string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Delete(&models.Favorite{}, "id = ?", id).Error; err != nil {
			return err
		}
		return tx.Delete(&models.SongRef{}, "favorite_id = ?", id).Error
	})
}

// SavePlayerSetting overwrites the single settings row.
func (s *Service) SavePlayerSetting(setting models.PlayerSetting) error {
	setting.ID = 1
	setting.UpdatedAt = time.Now()
	fmt.Printf("SavePlayerSetting: Saving themes: %s\n", setting.Themes)
	err := s.db.Save(&setting).Error
	if err != nil {
		fmt.Printf("SavePlayerSetting: Error: %v\n", err)
	} else {
		fmt.Printf("SavePlayerSetting: Success\n")
	}
	return err
}

// GetPlayerSetting returns the stored setting (or defaults).
func (s *Service) GetPlayerSetting() (models.PlayerSetting, error) {
	var setting models.PlayerSetting
	if err := s.db.First(&setting, 1).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			themesJSON, _ := formatThemesJSON([]models.Theme{})
			setting = models.PlayerSetting{
				ID:             1,
				PlayMode:       "order",
				DefaultVolume:  0.5,
				Themes:         themesJSON,
				CurrentThemeID: "light",
			}
			if err := s.db.Create(&setting).Error; err != nil {
				return setting, err
			}
			return setting, nil
		}
		return setting, err
	}
	return setting, nil
}

// SaveLyricMapping upserts lyric text and offset.
func (s *Service) SaveLyricMapping(mapping models.LyricMapping) error {
	if mapping.ID == "" {
		return fmt.Errorf("lyric id required")
	}
	mapping.UpdatedAt = time.Now()
	return s.db.Save(&mapping).Error
}

func (s *Service) GetLyricMapping(id string) (models.LyricMapping, error) {
	var m models.LyricMapping
	if err := s.db.First(&m, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 返回空记录，不打印错误日志
			return models.LyricMapping{ID: id}, nil
		}
		return m, err
	}
	return m, nil
}

// SavePlaylist saves the current playback queue and index.
func (s *Service) SavePlaylist(queueJSON string, currentIndex int) error {
	playlist := models.Playlist{
		ID:           1,
		Queue:        queueJSON,
		CurrentIndex: currentIndex,
		UpdatedAt:    time.Now(),
	}
	return s.db.Save(&playlist).Error
}

// GetPlaylist retrieves the saved playlist state.
func (s *Service) GetPlaylist() (models.Playlist, error) {
	var playlist models.Playlist
	if err := s.db.First(&playlist, 1).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Return empty playlist if not found
			return models.Playlist{
				ID:           1,
				Queue:        "[]",
				CurrentIndex: 0,
			}, nil
		}
		return playlist, err
	}
	return playlist, nil
}

// ExportData dumps all persisted entities.
type ExportData struct {
	Songs     []models.Song         `json:"songs"`
	Favorites []models.Favorite     `json:"favorites"`
	Settings  models.PlayerSetting  `json:"settings"`
	Lyrics    []models.LyricMapping `json:"lyrics"`
}

func (s *Service) ExportData() (ExportData, error) {
	var out ExportData
	if err := s.db.Find(&out.Songs).Error; err != nil {
		return out, err
	}
	if err := s.db.Preload("SongIDs").Find(&out.Favorites).Error; err != nil {
		return out, err
	}
	out.Settings, _ = s.GetPlayerSetting()
	if err := s.db.Find(&out.Lyrics).Error; err != nil {
		return out, err
	}
	return out, nil
}

func (s *Service) ImportData(in ExportData) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec("DELETE FROM song_refs").Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM favorites").Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM songs").Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM lyric_mappings").Error; err != nil {
			return err
		}
		if err := tx.Save(&in.Songs).Error; err != nil {
			return err
		}
		for i := range in.Favorites {
			if in.Favorites[i].ID == "" {
				in.Favorites[i].ID = "FavList-" + uuid.NewString()
			}
		}
		if err := tx.Save(&in.Favorites).Error; err != nil {
			return err
		}
		for i := range in.Favorites {
			for j := range in.Favorites[i].SongIDs {
				in.Favorites[i].SongIDs[j].FavoriteID = in.Favorites[i].ID
			}
			if err := tx.Create(&in.Favorites[i].SongIDs).Error; err != nil {
				return err
			}
		}
		if err := tx.Save(&in.Settings).Error; err != nil {
			return err
		}
		if err := tx.Save(&in.Lyrics).Error; err != nil {
			return err
		}
		return nil
	})
}

// ClearLibrary removes all songs, favorites, and lyric mappings, then seeds an empty default favorite.
func (s *Service) ClearLibrary() error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec("DELETE FROM song_refs").Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM favorites").Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM songs").Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM lyric_mappings").Error; err != nil {
			return err
		}
		seed := models.Favorite{ID: "FavList-default", Title: "默认歌单"}
		if err := tx.Create(&seed).Error; err != nil {
			return err
		}
		return nil
	})
}

// ResolveBiliAudio replaced with GetPlayURL (uses API + login instead of yt-dlp)
// Kept for compatibility; now delegates to GetPlayURL
func (s *Service) ResolveBiliAudio(input string) (models.BiliAudio, error) {
	bvid := extractBVID(input)
	if bvid == "" {
		return models.BiliAudio{}, fmt.Errorf("invalid BVID format")
	}

	playInfo, err := s.GetPlayURL(bvid, 1)
	if err != nil {
		return models.BiliAudio{}, err
	}

	meta, metaErr := s.getVideoInfo(bvid)
	if metaErr != nil {
		// 允许封面缺失，但记录上下文
		meta = VideoInfo{Title: playInfo.Title, Cover: "", Duration: playInfo.Duration, Author: ""}
	}

	return models.BiliAudio{
		URL:       playInfo.RawURL,
		ExpiresAt: playInfo.ExpiresAt,
		FromCache: false,
		Title:     playInfo.Title,
		Format:    "m4a",
		Cover:     meta.Cover,
		Duration:  meta.Duration,
		Author:    meta.Author,
	}, nil
}

func (s *Service) findSongByBVID(bvid string) (*models.Song, error) {
	var song models.Song
	if err := s.db.First(&song, "bvid = ?", bvid).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &song, nil
}

func normalizeBiliURL(input string) string {
	trimmed := strings.TrimSpace(input)
	if strings.HasPrefix(trimmed, "http://") || strings.HasPrefix(trimmed, "https://") {
		return trimmed
	}
	if strings.HasPrefix(strings.ToLower(trimmed), "av") {
		return fmt.Sprintf("https://www.bilibili.com/video/%s", trimmed)
	}
	return fmt.Sprintf("https://www.bilibili.com/video/%s", trimmed)
}

var bvRegexp = regexp.MustCompile(`BV[0-9A-Za-z]{10}`)

func extractBVID(input string) string {
	if match := bvRegexp.FindString(input); match != "" {
		return match
	}
	return ""
}

func deriveExpireTime(raw string) time.Time {
	fallback := time.Now().Add(2 * time.Hour)
	u, err := url.Parse(raw)
	if err != nil {
		return fallback
	}
	q := u.Query()
	candidates := []string{"expire", "expires", "deadline", "e", "validtime"}
	for _, key := range candidates {
		if v := q.Get(key); v != "" {
			ts, parseErr := strconv.ParseInt(v, 10, 64)
			if parseErr != nil {
				continue
			}
			if ts > 1e12 {
				ts = ts / 1000 // handle ms timestamps
			}
			if ts > 0 {
				return time.Unix(ts, 0)
			}
		}
	}
	return fallback
}

func normalizeBiliPic(u string) string {
	u = strings.TrimSpace(u)
	if u == "" {
		return ""
	}
	if strings.HasPrefix(u, "//") {
		return "https:" + u
	}
	if strings.HasPrefix(u, "http://") {
		return "https://" + strings.TrimPrefix(u, "http://")
	}
	if strings.HasPrefix(u, "https://") {
		return u
	}
	return "https://" + strings.TrimPrefix(u, "//")
}

// ===== Login & Session =====

type QRCodeResponse struct {
	URL       string    `json:"url"`
	QRCodeKey string    `json:"qrcode_key"`
	ExpireAt  time.Time `json:"expire_at"`
}

func (s *Service) GenerateLoginQR() (QRCodeResponse, error) {
	endpoint := "https://passport.bilibili.com/x/passport-login/web/qrcode/generate"

	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return QRCodeResponse{}, err
	}

	// 添加必要的请求头
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Referer", "https://www.bilibili.com/")
	req.Header.Set("Origin", "https://www.bilibili.com")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return QRCodeResponse{}, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return QRCodeResponse{}, err
	}

	var res struct {
		Code int `json:"code"`
		Data struct {
			URL string `json:"url"`
			Key string `json:"qrcode_key"`
		} `json:"data"`
		Message string `json:"message"`
	}

	if err := json.Unmarshal(body, &res); err != nil {
		return QRCodeResponse{}, fmt.Errorf("parse response failed: %w, body: %s", err, string(body))
	}

	if res.Code != 0 {
		return QRCodeResponse{}, fmt.Errorf("generate QR failed: code=%d, message=%s", res.Code, res.Message)
	}

	return QRCodeResponse{
		URL:       res.Data.URL,
		QRCodeKey: res.Data.Key,
		ExpireAt:  time.Now().Add(3 * time.Minute),
	}, nil
}

type LoginPollResponse struct {
	LoggedIn bool   `json:"loggedIn"`
	Message  string `json:"message"`
}

func (s *Service) PollLogin(qrcodeKey string) (LoginPollResponse, error) {
	endpoint := fmt.Sprintf("https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=%s", url.QueryEscape(qrcodeKey))

	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return LoginPollResponse{}, err
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Referer", "https://www.bilibili.com/")
	req.Header.Set("Origin", "https://www.bilibili.com")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return LoginPollResponse{}, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return LoginPollResponse{}, err
	}

	var res struct {
		Code int `json:"code"`
		Data struct {
			Code         int    `json:"code"`
			Message      string `json:"message"`
			RefreshToken string `json:"refresh_token"`
			Timestamp    int64  `json:"timestamp"`
			URL          string `json:"url"`
		} `json:"data"`
		Message string `json:"message"`
	}

	if err := json.Unmarshal(body, &res); err != nil {
		return LoginPollResponse{}, fmt.Errorf("parse response failed: %w", err)
	}

	// 根据 data.code 判断状态
	// 0 = 登录成功
	// 86038 = 二维码已失效
	// 86101 = 未扫码
	// 86090 = 已扫码未确认
	switch res.Data.Code {
	case 0:
		// 登录成功，Cookie 会自动保存到 CookieJar
		// 保存登录状态到文件
		_ = s.saveCookies()
		return LoginPollResponse{LoggedIn: true, Message: "登录成功"}, nil
	case 86038:
		return LoginPollResponse{LoggedIn: false, Message: "二维码已失效"}, nil
	case 86101:
		return LoginPollResponse{LoggedIn: false, Message: "未扫码"}, nil
	case 86090:
		return LoginPollResponse{LoggedIn: false, Message: "已扫码，等待确认"}, nil
	default:
		msg := res.Data.Message
		if msg == "" {
			msg = fmt.Sprintf("未知状态码: %d", res.Data.Code)
		}
		return LoginPollResponse{LoggedIn: false, Message: msg}, nil
	}
}

func (s *Service) IsLoggedIn() bool {
	// Check if we have SESSDATA cookie
	cookies := s.cookieJar.Cookies(&url.URL{Scheme: "https", Host: "www.bilibili.com"})
	for _, c := range cookies {
		if c.Name == "SESSDATA" && c.Value != "" {
			return true
		}
	}
	return false
}

// saveCookies 将 SESSDATA cookie 保存到文件
func (s *Service) saveCookies() error {
	cookies := s.cookieJar.Cookies(&url.URL{Scheme: "https", Host: "www.bilibili.com"})

	var sessdataValue string
	for _, c := range cookies {
		if c.Name == "SESSDATA" && c.Value != "" {
			sessdataValue = c.Value
			break
		}
	}

	data := map[string]string{
		"sessdata": sessdataValue,
		"saved_at": time.Now().Format(time.RFC3339),
	}

	filePath := filepath.Join(s.dataDir, cookieCacheFile)
	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("编码 cookie 失败: %w", err)
	}

	if err := os.WriteFile(filePath, jsonData, 0600); err != nil {
		return fmt.Errorf("保存 cookie 失败: %w", err)
	}

	return nil
}

// restoreLogin 从文件恢复之前保存的登录状态
func (s *Service) restoreLogin() error {
	filePath := filepath.Join(s.dataDir, cookieCacheFile)

	data, err := os.ReadFile(filePath)
	if err != nil {
		// 文件不存在或无法读取，这是正常的第一次启动情况
		return nil
	}

	var cookieData map[string]string
	if err := json.Unmarshal(data, &cookieData); err != nil {
		return fmt.Errorf("解析保存的 cookie 失败: %w", err)
	}

	sessdata := cookieData["sessdata"]
	if sessdata == "" {
		return nil
	}

	// 恢复 SESSDATA cookie
	biliURL := &url.URL{Scheme: "https", Host: "www.bilibili.com"}
	cookies := []*http.Cookie{
		{
			Name:     "SESSDATA",
			Value:    sessdata,
			Path:     "/",
			Domain:   ".bilibili.com",
			Expires:  time.Now().AddDate(0, 1, 0), // 默认一个月有效期
			HttpOnly: true,
			Secure:   true,
		},
	}
	s.cookieJar.SetCookies(biliURL, cookies)

	return nil
}

type UserInfo struct {
	UID      int64  `json:"uid"`
	Username string `json:"username"`
	Face     string `json:"face"`
	Level    int    `json:"level"`
	VIPType  int    `json:"vip_type"`
}

func (s *Service) GetUserInfo() (*UserInfo, error) {
	if !s.IsLoggedIn() {
		return nil, fmt.Errorf("未登录")
	}

	endpoint := "https://api.bilibili.com/x/web-interface/nav"
	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Referer", "https://www.bilibili.com/")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var res struct {
		Code int `json:"code"`
		Data struct {
			IsLogin   bool   `json:"isLogin"`
			Mid       int64  `json:"mid"`
			Uname     string `json:"uname"`
			Face      string `json:"face"`
			LevelInfo struct {
				CurrentLevel int `json:"current_level"`
			} `json:"level_info"`
			VipType int `json:"vipType"`
		} `json:"data"`
		Message string `json:"message"`
	}

	if err := json.Unmarshal(body, &res); err != nil {
		return nil, fmt.Errorf("解析用户信息失败: %w", err)
	}

	if res.Code != 0 {
		return nil, fmt.Errorf("获取用户信息失败: code=%d, message=%s", res.Code, res.Message)
	}

	if !res.Data.IsLogin {
		return nil, fmt.Errorf("登录状态已失效")
	}

	return &UserInfo{
		UID:      res.Data.Mid,
		Username: res.Data.Uname,
		Face:     res.Data.Face,
		Level:    res.Data.LevelInfo.CurrentLevel,
		VIPType:  res.Data.VipType,
	}, nil
}

func (s *Service) Logout() error {
	// Clear all cookies
	s.cookieJar.SetCookies(&url.URL{Scheme: "https", Host: "www.bilibili.com"}, []*http.Cookie{})

	// Delete saved cookie file
	filePath := filepath.Join(s.dataDir, cookieCacheFile)
	_ = os.Remove(filePath)

	return nil
}

// GetMyFavoriteCollections 获取当前登录用户的收藏夹列表
func (s *Service) GetMyFavoriteCollections() ([]models.BiliFavoriteCollection, error) {
	if !s.IsLoggedIn() {
		return nil, fmt.Errorf("未登录")
	}

	user, err := s.GetUserInfo()
	if err != nil {
		return nil, fmt.Errorf("获取用户信息失败: %w", err)
	}

	endpoint := fmt.Sprintf("https://api.bilibili.com/x/v3/fav/folder/created/list?up_mid=%d&pn=1&ps=100", user.UID)
	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0")
	req.Header.Set("Referer", "https://www.bilibili.com/")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var res struct {
		Code int    `json:"code"`
		Msg  string `json:"message"`
		Data struct {
			List []struct {
				ID         int64  `json:"id"`
				Title      string `json:"title"`
				MediaCount int    `json:"media_count"`
				Cover      string `json:"cover"`
			} `json:"list"`
		} `json:"data"`
	}

	if err := json.Unmarshal(body, &res); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w, body: %s", err, string(body))
	}

	if res.Code != 0 {
		msg := res.Msg
		if msg == "" {
			msg = "未知错误"
		}
		return nil, fmt.Errorf("API 错误: %d (%s)", res.Code, msg)
	}

	var out []models.BiliFavoriteCollection
	for _, it := range res.Data.List {
		out = append(out, models.BiliFavoriteCollection{
			ID:    it.ID,
			Title: it.Title,
			Count: it.MediaCount,
			Cover: it.Cover,
		})
	}
	return out, nil
}

// GetFavoriteCollectionInfo 获取收藏夹的基本信息（标题、封面等）
func (s *Service) GetFavoriteCollectionInfo(mediaID int64) (*models.BiliFavoriteCollection, error) {
	endpoint := fmt.Sprintf("https://api.bilibili.com/x/v3/fav/resource/list?media_id=%d&pn=1&ps=1", mediaID)

	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
	req.Header.Set("Referer", "https://www.bilibili.com/")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	// 检测是否返回了 HTML 错误页面
	if len(body) > 0 && body[0] == '<' {
		return nil, fmt.Errorf("收藏夹不存在或无权限访问")
	}

	var res struct {
		Code int    `json:"code"`
		Msg  string `json:"message"`
		Data struct {
			Info struct {
				ID         int64  `json:"id"`
				Title      string `json:"title"`
				Cover      string `json:"cover"`
				MediaCount int    `json:"media_count"`
			} `json:"info"`
		} `json:"data"`
	}

	if err := json.Unmarshal(body, &res); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	if res.Code != 0 {
		msg := res.Msg
		if msg == "" {
			msg = "未知错误"
		}
		return nil, fmt.Errorf("API 错误 (code=%d): %s", res.Code, msg)
	}

	return &models.BiliFavoriteCollection{
		ID:    res.Data.Info.ID,
		Title: res.Data.Info.Title,
		Count: res.Data.Info.MediaCount,
		Cover: res.Data.Info.Cover,
	}, nil
}

// GetFavoriteCollectionBVIDs 获取指定收藏夹的所有 BVID（公开收藏夹可用，无需登录）
// 使用 /x/v3/fav/resource/ids API，一次性获取所有内容ID
func (s *Service) GetFavoriteCollectionBVIDs(mediaID int64) ([]models.BiliFavoriteInfo, error) {
	endpoint := fmt.Sprintf("https://api.bilibili.com/x/v3/fav/resource/ids?media_id=%d&platform=web", mediaID)

	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
	req.Header.Set("Referer", "https://www.bilibili.com/")

	// cookieJar 会自动管理 Cookie，不需要手动设置

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	// 检测是否返回了 HTML 错误页面
	if len(body) > 0 && body[0] == '<' {
		return nil, fmt.Errorf("收藏夹不存在或无权限访问")
	}

	var res struct {
		Code int    `json:"code"`
		Msg  string `json:"message"`
		Data []struct {
			ID   int64  `json:"id"`
			Type int    `json:"type"`
			BvID string `json:"bv_id"`
			BVID string `json:"bvid"`
		} `json:"data"`
	}

	if err := json.Unmarshal(body, &res); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w, body: %s", err, string(body[:min(len(body), 200)]))
	}

	if res.Code != 0 {
		msg := res.Msg
		if msg == "" {
			msg = "未知错误"
		}
		return nil, fmt.Errorf("API 错误 (code=%d): %s", res.Code, msg)
	}

	if len(res.Data) == 0 {
		return nil, fmt.Errorf("收藏夹为空或不存在")
	}

	// 只返回视频类型的内容（type=2），过滤音频和视频合集
	var result []models.BiliFavoriteInfo
	for _, item := range res.Data {
		if item.Type != 2 {
			continue
		}

		bvid := item.BVID
		if bvid == "" {
			bvid = item.BvID
		}

		if bvid != "" {
			result = append(result, models.BiliFavoriteInfo{
				BVID:  bvid,
				Title: "", // ids 接口不返回标题，需要后续通过解析 BV 号获取
				Cover: "", // ids 接口不返回封面
			})
		}
	}

	return result, nil
}

// ===== Play URL Resolution =====

type PlayInfo struct {
	RawURL    string
	ProxyURL  string
	ExpiresAt time.Time
	Title     string
	Duration  int64
}

type VideoInfo struct {
	Title    string
	Cover    string
	Duration int64
	Author   string
}

func (s *Service) GetPlayURL(bvid string, p int) (PlayInfo, error) {
	if p < 1 {
		p = 1
	}

	// Check if bvid is valid
	if bvid == "" {
		return PlayInfo{}, fmt.Errorf("BVID 不能为空")
	}

	// Step 1: Get cid from pagelist
	cid, title, duration, err := s.getCidFromBVID(bvid, p)
	if err != nil {
		return PlayInfo{}, fmt.Errorf("无法获取视频信息: %w", err)
	}

	// Step 2: Get playurl
	audioURL, exp, err := s.getAudioURL(bvid, cid)
	if err != nil {
		// Check if login error
		if err.Error() != "" {
			return PlayInfo{}, fmt.Errorf("无法获取音频链接: %w", err)
		}
		return PlayInfo{}, err
	}

	proxyURL := fmt.Sprintf("http://127.0.0.1:9999/audio?u=%s", url.QueryEscape(audioURL))

	return PlayInfo{
		RawURL:    audioURL,
		ProxyURL:  proxyURL,
		ExpiresAt: exp,
		Title:     title,
		Duration:  duration,
	}, nil
}

func (s *Service) getCidFromBVID(bvid string, p int) (int64, string, int64, error) {
	endpoint := fmt.Sprintf("https://api.bilibili.com/x/player/pagelist?bvid=%s", bvid)
	req, _ := http.NewRequest("GET", endpoint, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0")
	req.Header.Set("Referer", "https://www.bilibili.com/")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return 0, "", 0, fmt.Errorf("pagelist request error: %w", err)
	}
	defer resp.Body.Close()

	var res struct {
		Code int    `json:"code"`
		Msg  string `json:"message"`
		Data []struct {
			Cid      int64  `json:"cid"`
			Page     int    `json:"page"`
			Part     string `json:"part"`
			Duration int64  `json:"duration"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return 0, "", 0, fmt.Errorf("pagelist decode error: %w", err)
	}
	if res.Code != 0 {
		return 0, "", 0, fmt.Errorf("pagelist API error: code=%d, msg=%s", res.Code, res.Msg)
	}
	if len(res.Data) == 0 {
		return 0, "", 0, fmt.Errorf("pagelist: no data returned for BVID=%s", bvid)
	}

	// Find page p
	page := res.Data[0]
	if p-1 < len(res.Data) {
		page = res.Data[p-1]
	}
	return page.Cid, page.Part, page.Duration, nil
}

func (s *Service) getAudioURL(bvid string, cid int64) (string, time.Time, error) {
	endpoint := fmt.Sprintf("https://api.bilibili.com/x/player/playurl?bvid=%s&cid=%d&fnval=4048", bvid, cid)
	req, _ := http.NewRequest("GET", endpoint, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0")
	req.Header.Set("Referer", fmt.Sprintf("https://www.bilibili.com/video/%s", bvid))

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("playurl request error: %w", err)
	}
	defer resp.Body.Close()

	var res struct {
		Code int    `json:"code"`
		Msg  string `json:"message"`
		Data struct {
			DASH struct {
				Audio []struct {
					BaseURL   string   `json:"baseUrl"`
					BackupURL []string `json:"backup_url"`
				} `json:"audio"`
			} `json:"dash"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return "", time.Time{}, fmt.Errorf("playurl decode error: %w", err)
	}
	if res.Code != 0 {
		return "", time.Time{}, fmt.Errorf("playurl API error: code=%d, msg=%s", res.Code, res.Msg)
	}

	if len(res.Data.DASH.Audio) == 0 {
		return "", time.Time{}, fmt.Errorf("no audio track found in DASH data")
	}

	audio := res.Data.DASH.Audio[0]
	audioURL := audio.BaseURL
	if audioURL == "" && len(audio.BackupURL) > 0 {
		audioURL = audio.BackupURL[0]
	}
	if audioURL == "" {
		return "", time.Time{}, fmt.Errorf("no playable audio URL in audio track")
	}

	exp := deriveExpireTime(audioURL)
	return audioURL, exp, nil
}

func (s *Service) getVideoInfo(bvid string) (VideoInfo, error) {
	endpoint := fmt.Sprintf("https://api.bilibili.com/x/web-interface/view?bvid=%s", bvid)
	req, _ := http.NewRequest("GET", endpoint, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0")
	req.Header.Set("Referer", fmt.Sprintf("https://www.bilibili.com/video/%s", bvid))

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return VideoInfo{}, fmt.Errorf("video info request error: %w", err)
	}
	defer resp.Body.Close()

	var res struct {
		Code int    `json:"code"`
		Msg  string `json:"message"`
		Data struct {
			Title    string `json:"title"`
			Pic      string `json:"pic"`
			Duration int64  `json:"duration"`
			Owner    struct {
				Name string `json:"name"`
			} `json:"owner"`
			Staff []struct {
				Name string `json:"name"`
			} `json:"staff"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return VideoInfo{}, fmt.Errorf("video info decode error: %w", err)
	}
	if res.Code != 0 {
		return VideoInfo{}, fmt.Errorf("video info API error: code=%d, msg=%s", res.Code, res.Msg)
	}

	// 组合作者信息：优先 staff 列表，多人用分号分隔；否则使用 owner.name
	authors := []string{}
	for _, st := range res.Data.Staff {
		if st.Name != "" {
			authors = append(authors, st.Name)
		}
	}
	if len(authors) == 0 && res.Data.Owner.Name != "" {
		authors = append(authors, res.Data.Owner.Name)
	}
	author := strings.Join(authors, "; ")

	return VideoInfo{
		Title:    res.Data.Title,
		Cover:    normalizeBiliPic(res.Data.Pic),
		Duration: res.Data.Duration,
		Author:   author,
	}, nil
}

// SearchLocalSongs searches songs in local database by name or singer.
func (s *Service) SearchLocalSongs(keyword string) ([]models.Song, error) {
	var songs []models.Song
	searchTerm := "%" + keyword + "%"
	if err := s.db.Where("name LIKE ? OR singer LIKE ?", searchTerm, searchTerm).
		Find(&songs).Error; err != nil {
		return nil, err
	}
	return songs, nil
}

// SearchBiliVideos queries Bilibili video search and returns lightweight Song-like items.
func (s *Service) SearchBiliVideos(keyword string, page int, pageSize int) ([]models.Song, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 30 {
		pageSize = 10
	}
	api := "https://api.bilibili.com/x/web-interface/search/type"
	q := url.Values{}
	q.Set("search_type", "video")
	q.Set("keyword", keyword)
	q.Set("page", fmt.Sprintf("%d", page))
	q.Set("page_size", fmt.Sprintf("%d", pageSize))
	q.Set("order", "totalrank")
	endpoint := api + "?" + q.Encode()

	req, _ := http.NewRequest("GET", endpoint, nil)
	req.Header.Set("User-Agent", "Mozilla/5.0")
	req.Header.Set("Referer", "https://www.bilibili.com/")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	var parsed struct {
		Code int `json:"code"`
		Data struct {
			Result []struct {
				BVID     string `json:"bvid"`
				Title    string `json:"title"`
				Author   string `json:"author"`
				Pic      string `json:"pic"`
				Duration string `json:"duration"`
			} `json:"result"`
		} `json:"data"`
	}
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, err
	}
	if parsed.Code != 0 {
		return []models.Song{}, nil
	}

	// Strip HTML tags from title
	tagRe := regexp.MustCompile(`<[^>]+>`)

	var out []models.Song
	for _, it := range parsed.Data.Result {
		out = append(out, models.Song{
			ID:       "",
			BVID:     it.BVID,
			Name:     tagRe.ReplaceAllString(it.Title, ""),
			Singer:   it.Author,
			SingerID: "",
			Cover:    normalizeBiliPic(it.Pic),
			SourceID: "",
		})
	}
	return out, nil
}

// SearchBVID searches for a BV number in both local database and Bilibili.
// Returns local results first, then remote results.
func (s *Service) SearchBVID(bvid string) ([]models.Song, error) {
	var results []models.Song

	// 1. 搜索本地数据库中相同 BVID 的所有歌曲实例
	if err := s.db.Where("bvid = ?", bvid).Find(&results).Error; err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// 2. 从 B站搜索该 BV 号的视频信息
	// 这里直接调用 ResolveBiliAudio 获取最新信息
	audioInfo, err := s.ResolveBiliAudio(bvid)
	if err == nil {
		// 创建一个虚拟的歌曲条目表示 B站版本
		remoteResult := models.Song{
			ID:       "",
			BVID:     bvid,
			Name:     audioInfo.Title,
			Singer:   audioInfo.Author,
			SingerID: "",
			Cover:    audioInfo.Cover,
			SourceID: "", // 未保存的远程资源
		}
		results = append(results, remoteResult)
	}

	return results, nil
}

// clauseOnConflictID is a small helper to update on PK conflict.
func clauseOnConflictID() clause.Expression {
	return clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoUpdates: clause.Assignments(map[string]interface{}{"title": clause.Expr{SQL: "excluded.title"}, "updated_at": clause.Expr{SQL: "excluded.updated_at"}}),
	}
}

// formatThemesJSON converts theme slice to JSON string
func formatThemesJSON(themes []models.Theme) (string, error) {
	data, err := json.Marshal(themes)
	return string(data), err
}

// parseThemesJSON converts JSON string back to theme slice
func parseThemesJSON(themesJSON string) ([]models.Theme, error) {
	var themes []models.Theme
	if themesJSON == "" || themesJSON == "null" {
		return themes, nil
	}
	if err := json.Unmarshal([]byte(themesJSON), &themes); err != nil {
		// Return empty slice instead of nil on error
		return themes, err
	}
	return themes, nil
}

// GetThemes returns all available themes
func (s *Service) GetThemes() ([]models.Theme, error) {
	setting, err := s.GetPlayerSetting()
	if err != nil {
		fmt.Printf("GetThemes: GetPlayerSetting error: %v\n", err)
		return []models.Theme{}, err
	}
	fmt.Printf("GetThemes: Themes JSON: %s\n", setting.Themes)
	themes, err := parseThemesJSON(setting.Themes)
	if err != nil {
		fmt.Printf("GetThemes: parseThemesJSON error: %v\n", err)
		return []models.Theme{}, err
	}
	fmt.Printf("GetThemes: Parsed %d themes\n", len(themes))
	return themes, nil
}

// CreateTheme adds a new custom theme
func (s *Service) CreateTheme(theme models.Theme) (models.Theme, error) {
	fmt.Printf("CreateTheme: Creating theme %s\n", theme.Name)
	setting, err := s.GetPlayerSetting()
	if err != nil {
		fmt.Printf("CreateTheme: GetPlayerSetting error: %v\n", err)
		return theme, err
	}

	fmt.Printf("CreateTheme: Current themes JSON: %s\n", setting.Themes)
	themes, err := parseThemesJSON(setting.Themes)
	if err != nil {
		fmt.Printf("CreateTheme: parseThemesJSON error: %v\n", err)
		return theme, err
	}
	fmt.Printf("CreateTheme: Parsed %d existing themes\n", len(themes))

	// Generate unique ID for new theme
	theme.ID = "theme-" + uuid.NewString()
	theme.IsDefault = false
	theme.IsReadOnly = false
	themes = append(themes, theme)
	fmt.Printf("CreateTheme: Generated ID %s, now have %d themes\n", theme.ID, len(themes))

	themesJSON, err := formatThemesJSON(themes)
	if err != nil {
		fmt.Printf("CreateTheme: formatThemesJSON error: %v\n", err)
		return theme, err
	}
	fmt.Printf("CreateTheme: New themes JSON: %s\n", themesJSON)

	setting.Themes = themesJSON
	err = s.SavePlayerSetting(setting)
	if err != nil {
		fmt.Printf("CreateTheme: SavePlayerSetting error: %v\n", err)
	} else {
		fmt.Printf("CreateTheme: Successfully saved, returning theme with ID %s\n", theme.ID)
	}
	return theme, err
}

// UpdateTheme modifies an existing custom theme
func (s *Service) UpdateTheme(theme models.Theme) error {
	fmt.Printf("UpdateTheme: Updating theme %s (%s)\n", theme.ID, theme.Name)
	setting, err := s.GetPlayerSetting()
	if err != nil {
		fmt.Printf("UpdateTheme: GetPlayerSetting error: %v\n", err)
		return err
	}

	fmt.Printf("UpdateTheme: Current themes JSON: %s\n", setting.Themes)
	themes, err := parseThemesJSON(setting.Themes)
	if err != nil {
		fmt.Printf("UpdateTheme: parseThemesJSON error: %v\n", err)
		return err
	}
	fmt.Printf("UpdateTheme: Parsed %d themes before update\n", len(themes))

	found := false
	for i, t := range themes {
		if t.ID == theme.ID {
			// 保留 IsDefault 属性
			theme.IsDefault = t.IsDefault
			themes[i] = theme
			found = true
			fmt.Printf("UpdateTheme: Found and updated theme at index %d\n", i)
			break
		}
	}

	if !found {
		fmt.Printf("UpdateTheme: Theme ID %s not found!\n", theme.ID)
		return fmt.Errorf("theme not found: %s", theme.ID)
	}

	themesJSON, err := formatThemesJSON(themes)
	if err != nil {
		fmt.Printf("UpdateTheme: formatThemesJSON error: %v\n", err)
		return err
	}
	fmt.Printf("UpdateTheme: New themes JSON: %s\n", themesJSON)

	setting.Themes = themesJSON
	err = s.SavePlayerSetting(setting)
	if err != nil {
		fmt.Printf("UpdateTheme: SavePlayerSetting error: %v\n", err)
	} else {
		fmt.Printf("UpdateTheme: Successfully saved\n")
	}
	return err
}

// DeleteTheme removes a custom theme
func (s *Service) DeleteTheme(themeID string) error {
	setting, err := s.GetPlayerSetting()
	if err != nil {
		return err
	}

	themes, err := parseThemesJSON(setting.Themes)
	if err != nil {
		return err
	}

	newThemes := []models.Theme{}
	for _, t := range themes {
		if t.ID == themeID {
			if t.IsDefault {
				return fmt.Errorf("cannot delete default theme")
			}
			continue
		}
		newThemes = append(newThemes, t)
	}

	// If deleted theme was current, switch to light theme
	if setting.CurrentThemeID == themeID {
		setting.CurrentThemeID = "light"
	}

	themesJSON, err := formatThemesJSON(newThemes)
	if err != nil {
		return err
	}

	setting.Themes = themesJSON
	return s.SavePlayerSetting(setting)
}

// SetCurrentTheme changes the active theme
func (s *Service) SetCurrentTheme(themeID string) error {
	setting, err := s.GetPlayerSetting()
	if err != nil {
		return err
	}

	setting.CurrentThemeID = themeID
	return s.SavePlayerSetting(setting)
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

	// Ensure we have a valid audio URL
	var audioURL string
	if song.StreamURL != "" && song.StreamURLExpiresAt.After(time.Now().Add(30*time.Second)) {
		// If existing stream URL seems valid, prefer raw URL derived from it if possible
		// StreamURL may be proxy URL, but for backend direct download, we prefer raw URL
		// If StreamURL looks like proxy, resolve fresh raw URL
		if strings.Contains(song.StreamURL, "127.0.0.1:9999/audio") {
			// Refresh from BVID
			if song.BVID == "" {
				return "", fmt.Errorf("歌曲缺少 BVID，无法解析播放地址")
			}
			info, err := s.GetPlayURL(song.BVID, 1)
			if err != nil {
				return "", err
			}
			audioURL = info.RawURL
		} else {
			// Use current stream URL directly
			audioURL = song.StreamURL
		}
	} else {
		// Refresh play URL
		if song.BVID == "" {
			return "", fmt.Errorf("歌曲缺少 BVID，无法解析播放地址")
		}
		info, err := s.GetPlayURL(song.BVID, 1)
		if err != nil {
			return "", err
		}
		audioURL = info.RawURL
		// Persist refreshed stream URL metadata
		song.StreamURL = info.ProxyURL
		song.StreamURLExpiresAt = info.ExpiresAt
		song.UpdatedAt = time.Now()
		_ = s.db.Save(&song).Error
	}

	// Prepare destination path (downloads directory for active downloads)
	dstDir := filepath.Join(s.dataDir, downloadsDir)
	if err := os.MkdirAll(dstDir, 0o755); err != nil {
		return "", fmt.Errorf("创建下载目录失败: %w", err)
	}

	// Use stable filename based on song ID to make lookup deterministic
	filename := fmt.Sprintf("%s.m4s", song.ID)
	dstPath := filepath.Join(dstDir, filename)

	// Download with extended timeout for large files (5 minutes)
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

	// Get expected content length
	contentLength := resp.ContentLength
	if contentLength <= 0 {
		return "", fmt.Errorf("无法获取文件大小信息，可能是服务器不支持")
	}

	// Write to temporary file
	tmpPath := dstPath + ".part"
	// 如果存在残留的 .part 文件，先删除
	_ = os.Remove(tmpPath)

	f, err := os.Create(tmpPath)
	if err != nil {
		return "", fmt.Errorf("创建文件失败: %w", err)
	}
	defer f.Close()

	// Copy with size tracking to verify complete download
	written, err := io.Copy(f, resp.Body)
	if err != nil {
		_ = f.Close()
		_ = os.Remove(tmpPath)
		return "", fmt.Errorf("写入文件失败: %w", err)
	}

	// Verify file was written completely
	if written != contentLength {
		_ = f.Close()
		_ = os.Remove(tmpPath)
		return "", fmt.Errorf("下载不完整: 期望 %d 字节，实际 %d 字节", contentLength, written)
	}

	// Flush to disk before closing
	if err := f.Sync(); err != nil {
		_ = f.Close()
		_ = os.Remove(tmpPath)
		return "", fmt.Errorf("刷新文件失败: %w", err)
	}
	_ = f.Close()

	// Verify file exists and size is correct
	stat, err := os.Stat(tmpPath)
	if err != nil {
		_ = os.Remove(tmpPath)
		return "", fmt.Errorf("文件验证失败: %w", err)
	}
	if stat.Size() != contentLength {
		_ = os.Remove(tmpPath)
		return "", fmt.Errorf("文件大小验证失败: 期望 %d 字节，实际 %d 字节", contentLength, stat.Size())
	}

	// Check if destination already exists and is different
	if _, err := os.Stat(dstPath); err == nil {
		// File exists, remove it first (atomic operation requires no existing file on some systems)
		if err := os.Remove(dstPath); err != nil {
			_ = os.Remove(tmpPath)
			return "", fmt.Errorf("无法覆盖已存在的文件: %w", err)
		}
	}

	// Atomic rename
	if err := os.Rename(tmpPath, dstPath); err != nil {
		_ = os.Remove(tmpPath)
		return "", fmt.Errorf("保存文件失败: %w", err)
	}

	// Final verification after rename
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
	// First check passive cache
	path := filepath.Join(s.dataDir, cacheDir, fname)
	if _, err := os.Stat(path); err == nil {
		url := fmt.Sprintf("http://127.0.0.1:%d/local?f=%s", 9999, url.QueryEscape(fname))
		return url, nil
	}
	// Then check active downloads
	path2 := filepath.Join(s.dataDir, downloadsDir, fname)
	if _, err := os.Stat(path2); err == nil {
		url := fmt.Sprintf("http://127.0.0.1:%d/local?f=%s", 9999, url.QueryEscape(fname))
		return url, nil
	}
	// Not found
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
		// xdg-open the directory containing the file
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

// 音频存储相关常量
const (
	cacheDir        = "audio_cache" // 被动缓存
	downloadsDir    = "downloads"   // 主动下载
	playHistoryFile = "play_history.json"
)

// PlayHistory 记录上次播放的信息
type PlayHistory struct {
	FavoriteID string `json:"favoriteId"`
	SongID     string `json:"songId"`
	Timestamp  int64  `json:"timestamp"`
}

// GetAudioCacheSize 获取缓存大小
func (s *Service) GetAudioCacheSize() (int64, error) {
	cacheDir := filepath.Join(s.dataDir, cacheDir)
	if _, err := os.Stat(cacheDir); os.IsNotExist(err) {
		return 0, nil
	}

	var size int64
	err := filepath.Walk(cacheDir, func(_ string, info os.FileInfo, err error) error {
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
	cacheDir := filepath.Join(s.dataDir, cacheDir)
	if _, err := os.Stat(cacheDir); os.IsNotExist(err) {
		return nil
	}
	return os.RemoveAll(cacheDir)
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
