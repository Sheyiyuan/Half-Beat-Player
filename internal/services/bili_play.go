package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	"tomorin-player/internal/models"
)

// PlayInfo holds resolved playback info.
type PlayInfo struct {
	RawURL    string
	ProxyURL  string
	ExpiresAt time.Time
	Title     string
	Duration  int64
}

// VideoInfo holds Bilibili video metadata.
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
