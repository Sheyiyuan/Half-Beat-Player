package services

import (
    "net"
    "net/http"
    "net/http/cookiejar"
    "os"
    "time"

    "gorm.io/gorm"
)

// Service exposes backend operations to the Wails frontend.
type Service struct {
    db         *gorm.DB
    cookieJar  http.CookieJar
    httpClient *http.Client
    dataDir    string // 数据目录用于存储 cookie
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
