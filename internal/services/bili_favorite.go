package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"tomorin-player/internal/models"
)

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
