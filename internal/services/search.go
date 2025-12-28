package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"

	"half-beat-player/internal/models"

	"gorm.io/gorm"
)

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
