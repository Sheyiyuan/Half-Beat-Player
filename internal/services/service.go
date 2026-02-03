package services

import (
	"context"
	"fmt"
	"half-beat-player/internal/proxy"
	"net"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"os"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"gorm.io/gorm"
)

// Service exposes backend operations to the Wails frontend.
type Service struct {
	db         *gorm.DB
	cookieJar  http.CookieJar
	httpClient *http.Client
	dataDir    string // 数据目录用于存储 cookie
	appCtx     context.Context
	audioProxy *proxy.AudioProxy
}

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
	// 确保音频缓存目录存在，便于用户可见且避免首次写入失败
	_ = os.MkdirAll(filepath.Join(dataDir, cacheDir), 0o755)

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

func (s *Service) SetAudioProxy(ap *proxy.AudioProxy) {
	s.audioProxy = ap
}

// EnsureAudioProxyRunning attempts to start the local audio proxy.
// It is safe to call multiple times.
func (s *Service) EnsureAudioProxyRunning() error {
	if s.audioProxy == nil {
		return fmt.Errorf("audio proxy not initialised")
	}
	if s.audioProxy.IsRunning() {
		return nil
	}
	if err := s.audioProxy.Start(); err != nil {
		return fmt.Errorf("start audio proxy: %w", err)
	}
	return nil
}

// GetProxyBaseURL returns the base URL for the local proxy (backward compatible fallback).
func (s *Service) GetProxyBaseURL() string {
	if s.audioProxy != nil {
		return s.audioProxy.GetBaseURL()
	}
	return "http://127.0.0.1:9999"
}

// GetImageProxyURL returns a proxied URL for images to bypass CORS restrictions
func (s *Service) GetImageProxyURL(imageURL string) string {
	if imageURL == "" {
		return ""
	}
	if s.audioProxy != nil {
		return s.audioProxy.GetImageProxyURL(imageURL)
	}
	// Backward compatible fallback
	return fmt.Sprintf("http://127.0.0.1:9999/image?u=%s", url.QueryEscape(imageURL))
}

func (s *Service) getAudioProxyURL(audioURL string) string {
	if s.audioProxy != nil {
		return s.audioProxy.GetProxyURL(audioURL)
	}
	return fmt.Sprintf("http://127.0.0.1:9999/audio?u=%s", url.QueryEscape(audioURL))
}

func (s *Service) SetAppContext(ctx context.Context) {
	s.appCtx = ctx
}

// 窗口控制方法
func (s *Service) MinimiseWindow() {
	if s.appCtx != nil {
		runtime.WindowMinimise(s.appCtx)
	}
}

func (s *Service) MaximizeWindow() {
	if s.appCtx != nil {
		runtime.WindowMaximise(s.appCtx)
	}
}

func (s *Service) UnmaximizeWindow() {
	if s.appCtx != nil {
		runtime.WindowUnmaximise(s.appCtx)
	}
}

func (s *Service) IsWindowMaximized() bool {
	if s.appCtx != nil {
		return runtime.WindowIsMaximised(s.appCtx)
	}
	return false
}

func (s *Service) CloseWindow() {
	if s.appCtx != nil {
		runtime.Quit(s.appCtx)
	}
}

func (s *Service) DragWindow() {
	// Wails v2 frameless window dragging is handled on the frontend via CSS:
	//   --wails-draggable: drag
	// This method is kept for backward compatibility.
}

// 最小化到托盘（隐藏窗口）
func (s *Service) MinimizeToTray() {
	if s.appCtx != nil {
		runtime.WindowHide(s.appCtx)
	}
}

// 直接退出应用
func (s *Service) QuitApp() {
	if s.appCtx != nil {
		runtime.Quit(s.appCtx)
	}
}
