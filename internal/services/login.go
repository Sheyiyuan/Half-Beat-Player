package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"time"
)

const cookieCacheFile = "sessdata.json"

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
