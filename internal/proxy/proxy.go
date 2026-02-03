package proxy

import (
	"context"
	"fmt"
	"io"
	"mime"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"
)

type AudioProxy struct {
	port       int
	listener   net.Listener
	server     *http.Server
	httpClient *http.Client
	baseDir    string
	mu         sync.RWMutex
	isRunning  bool

	cacheMu       sync.Mutex
	cacheInFlight map[string]struct{}
}

func NewAudioProxy(port int, httpClient *http.Client, baseDir string) *AudioProxy {
	return &AudioProxy{
		port:          port,
		httpClient:    httpClient,
		baseDir:       baseDir,
		cacheInFlight: map[string]struct{}{},
	}
}

func (ap *AudioProxy) IsRunning() bool {
	ap.mu.RLock()
	defer ap.mu.RUnlock()
	return ap.isRunning
}

func (ap *AudioProxy) ensureCachedAsync(decodedURL, sid string) {
	if sid == "" {
		return
	}
	cacheDir := filepath.Join(ap.baseDir, "audio_cache")
	cachePath := filepath.Join(cacheDir, sid+".m4s")

	if _, err := os.Stat(cachePath); err == nil {
		return
	}

	ap.cacheMu.Lock()
	if _, ok := ap.cacheInFlight[sid]; ok {
		ap.cacheMu.Unlock()
		return
	}
	ap.cacheInFlight[sid] = struct{}{}
	ap.cacheMu.Unlock()

	go func() {
		defer func() {
			ap.cacheMu.Lock()
			delete(ap.cacheInFlight, sid)
			ap.cacheMu.Unlock()
		}()

		if err := os.MkdirAll(cacheDir, 0o755); err != nil {
			fmt.Printf("[Proxy] Cache mkdir failed (%s): %v\n", cacheDir, err)
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		req, err := http.NewRequestWithContext(ctx, "GET", decodedURL, nil)
		if err != nil {
			fmt.Printf("[Proxy] Cache request build failed (%s): %v\n", sid, err)
			return
		}
		// 与实时代理一致的请求头（不带 Range，尝试获取完整文件）
		req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
		req.Header.Set("Referer", "https://www.bilibili.com")
		req.Header.Set("Origin", "https://www.bilibili.com")
		req.Header.Set("Accept", "*/*")

		resp, err := ap.httpClient.Do(req)
		if err != nil {
			fmt.Printf("[Proxy] Cache upstream failed (%s): %v\n", sid, err)
			return
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			// Range-only 或其他情况不缓存
			fmt.Printf("[Proxy] Cache skip (%s): status=%d\n", sid, resp.StatusCode)
			return
		}

		tmp := cachePath + ".part"
		_ = os.Remove(tmp)
		f, err := os.Create(tmp)
		if err != nil {
			fmt.Printf("[Proxy] Cache create failed (%s): %v\n", sid, err)
			return
		}
		_, copyErr := io.Copy(f, resp.Body)
		closeErr := f.Close()
		if copyErr != nil {
			_ = os.Remove(tmp)
			fmt.Printf("[Proxy] Cache write failed (%s): %v\n", sid, copyErr)
			return
		}
		if closeErr != nil {
			_ = os.Remove(tmp)
			fmt.Printf("[Proxy] Cache close failed (%s): %v\n", sid, closeErr)
			return
		}
		if err := os.Rename(tmp, cachePath); err != nil {
			_ = os.Remove(tmp)
			fmt.Printf("[Proxy] Cache rename failed (%s): %v\n", sid, err)
			return
		}
		fmt.Printf("[Proxy] Cached audio: %s\n", cachePath)
	}()
}

func (ap *AudioProxy) Start() error {
	ap.mu.Lock()
	defer ap.mu.Unlock()

	if ap.isRunning {
		return nil
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/audio", ap.handleAudio)
	mux.HandleFunc("/local", ap.handleLocal)
	mux.HandleFunc("/image", ap.handleImage)
	mux.HandleFunc("/theme-image", ap.handleThemeImage)

	server := &http.Server{
		Addr:    fmt.Sprintf("127.0.0.1:%d", ap.port),
		Handler: mux,
	}

	listener, err := net.Listen("tcp", server.Addr)
	if err != nil {
		return err
	}

	ap.listener = listener
	ap.server = server
	ap.isRunning = true

	go func() {
		err := server.Serve(listener)
		if err != nil && err != http.ErrServerClosed {
			fmt.Printf("[Proxy] Server exited unexpectedly: %v\n", err)
		}

		ap.mu.Lock()
		shouldCloseServer := ap.server == server
		shouldCloseListener := ap.listener == listener
		ap.server = nil
		ap.listener = nil
		ap.isRunning = false
		ap.mu.Unlock()

		// Best-effort: ensure port is released.
		if shouldCloseServer {
			_ = server.Close()
		}
		if shouldCloseListener {
			_ = listener.Close()
		}
	}()

	return nil
}

func (ap *AudioProxy) Stop() error {
	ap.mu.Lock()
	defer ap.mu.Unlock()

	if !ap.isRunning {
		return nil
	}

	if ap.server != nil {
		_ = ap.server.Close()
	}
	if ap.listener != nil {
		_ = ap.listener.Close()
	}

	ap.isRunning = false
	return nil
}

func (ap *AudioProxy) handleAudio(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers first for all responses
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Range")

	// Handle preflight
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	rawURL := r.URL.Query().Get("u")
	if rawURL == "" {
		http.Error(w, "missing u parameter", http.StatusBadRequest)
		return
	}

	decodedURL, err := url.QueryUnescape(rawURL)
	if err != nil {
		http.Error(w, "invalid URL encoding", http.StatusBadRequest)
		return
	}

	fmt.Printf("[Proxy] Fetching upstream: %s\n", decodedURL)

	// 最佳努力：如果前端传了 sid，则后台尝试缓存成 audio_cache/<sid>.m4s
	sid := r.URL.Query().Get("sid")
	ap.ensureCachedAsync(decodedURL, sid)

	// Create upstream request with auth headers
	req, err := http.NewRequest("GET", decodedURL, nil)
	if err != nil {
		http.Error(w, "failed to create request", http.StatusInternalServerError)
		return
	}

	// Set comprehensive headers to bypass Bilibili restrictions
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Referer", "https://www.bilibili.com")
	req.Header.Set("Origin", "https://www.bilibili.com")
	req.Header.Set("Accept", "*/*")
	req.Header.Set("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
	req.Header.Set("Accept-Encoding", "gzip, deflate, br")
	req.Header.Set("Sec-Fetch-Dest", "audio")
	req.Header.Set("Sec-Fetch-Mode", "cors")
	req.Header.Set("Sec-Fetch-Site", "cross-site")
	req.Header.Set("Priority", "u=1, i")

	// Handle Range request
	if r.Header.Get("Range") != "" {
		req.Header.Set("Range", r.Header.Get("Range"))
	}

	resp, err := ap.httpClient.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("upstream error: %v", err), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()
	fmt.Printf("[Proxy] Upstream status: %s, Content-Type: %s\n", resp.Status, resp.Header.Get("Content-Type"))

	// 如果上游返回 403，尝试从本地缓存提供
	if resp.StatusCode == http.StatusForbidden {
		fmt.Printf("[Proxy] Got 403, attempting local cache fallback\n")
		// 从 URL 中提取文件名（songId）
		parsedURL, err := url.Parse(decodedURL)
		if err == nil {
			var fileName string

			// 尝试从 URL 路径末尾获取文件名
			pathParts := strings.Split(parsedURL.Path, "/")
			if len(pathParts) > 0 {
				potentialFileName := pathParts[len(pathParts)-1]
				if strings.HasSuffix(potentialFileName, ".m4s") || strings.HasSuffix(potentialFileName, ".mp4") {
					fileName = potentialFileName
				}
			}

			if fileName != "" {
				// 尝试从缓存或下载目录提供
				cachePath := filepath.Join(ap.baseDir, "audio_cache", fileName)
				if _, err := os.Stat(cachePath); err == nil {
					fmt.Printf("[Proxy] Serving from cache: %s\n", cachePath)
					ap.serveLocalFile(w, r, cachePath)
					return
				}

				downloadPath := filepath.Join(ap.baseDir, "downloads", fileName)
				if _, err := os.Stat(downloadPath); err == nil {
					fmt.Printf("[Proxy] Serving from downloads: %s\n", downloadPath)
					ap.serveLocalFile(w, r, downloadPath)
					return
				}

				fmt.Printf("[Proxy] No local cache found for %s (cache: %s, downloads: %s)\n", fileName, cachePath, downloadPath)
			}
		}

		// 无法回退，返回 403
		http.Error(w, "upstream forbidden and no local cache available", http.StatusForbidden)
		return
	}

	// Copy response headers, but skip CORS headers to avoid conflicts; override Content-Type for audio
	contentType := resp.Header.Get("Content-Type")
	for k, vv := range resp.Header {
		if k == "Access-Control-Allow-Origin" ||
			k == "Access-Control-Allow-Methods" ||
			k == "Access-Control-Allow-Headers" ||
			k == "Access-Control-Allow-Credentials" {
			continue
		}
		if k == "Content-Type" {
			// defer setting after loop
			continue
		}
		for _, v := range vv {
			w.Header().Add(k, v)
		}
	}

	// Normalize Content-Type: upstream常返回 application/octet-stream，但 m4s/mp4 仍可作为 audio/mp4 播放
	if contentType == "" || contentType == "application/octet-stream" {
		contentType = "audio/mp4"
	} else if contentType == "video/mp4" {
		// DASH 音轨通常标 video/mp4，这里强制为 audio/mp4 以避免浏览器判不支持
		contentType = "audio/mp4"
	}
	w.Header().Set("Content-Type", contentType)

	// 确保 Range 可用
	w.Header().Set("Accept-Ranges", "bytes")
	// Set cache headers (CORS already set at function start)
	w.Header().Set("Cache-Control", "public, max-age=86400")

	// Write status
	w.WriteHeader(resp.StatusCode)

	// For HEAD requests, don't stream the body
	if r.Method == "HEAD" {
		return
	}

	// Stream response body with timeout
	io.Copy(w, resp.Body)
}

// serveLocalFile serves a local file with proper headers and Range support
func (ap *AudioProxy) serveLocalFile(w http.ResponseWriter, r *http.Request, filePath string) {
	file, err := os.Open(filePath)
	if err != nil {
		fmt.Printf("[Proxy] Error opening local file: %v\n", err)
		http.Error(w, "file not found", http.StatusNotFound)
		return
	}
	defer file.Close()

	fileInfo, err := file.Stat()
	if err != nil {
		fmt.Printf("[Proxy] Error stating local file: %v\n", err)
		http.Error(w, "stat error", http.StatusInternalServerError)
		return
	}

	// Set response headers
	w.Header().Set("Content-Type", "audio/mp4")
	w.Header().Set("Accept-Ranges", "bytes")
	w.Header().Set("Cache-Control", "public, max-age=86400")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	fileSize := fileInfo.Size()

	// Handle Range requests
	rangeHeader := r.Header.Get("Range")
	if rangeHeader != "" {
		ranges, err := parseRange(rangeHeader, fileSize)
		if err == nil && len(ranges) == 1 {
			ra := ranges[0]
			w.Header().Set("Content-Range", fmt.Sprintf("bytes %d-%d/%d", ra.start, ra.start+ra.length-1, fileSize))
			w.Header().Set("Content-Length", fmt.Sprintf("%d", ra.length))
			w.WriteHeader(http.StatusPartialContent)
			file.Seek(ra.start, 0)
			io.CopyN(w, file, ra.length)
			return
		}
	}

	// Full file response
	w.Header().Set("Content-Length", fmt.Sprintf("%d", fileSize))
	w.WriteHeader(http.StatusOK)
	io.Copy(w, file)
}

type httpRange struct {
	start  int64
	length int64
}

func parseRange(s string, size int64) ([]httpRange, error) {
	if !strings.HasPrefix(s, "bytes=") {
		return nil, fmt.Errorf("invalid range")
	}
	var ranges []httpRange
	for _, ra := range strings.Split(s[6:], ",") {
		ra = strings.TrimSpace(ra)
		if ra == "" {
			continue
		}
		parts := strings.Split(ra, "-")
		if len(parts) != 2 {
			return nil, fmt.Errorf("invalid range")
		}
		start, err1 := strconv.ParseInt(parts[0], 10, 64)
		end, err2 := strconv.ParseInt(parts[1], 10, 64)
		if err1 != nil || err2 != nil || start < 0 || end < 0 || start > end {
			return nil, fmt.Errorf("invalid range")
		}
		if start >= size {
			return nil, fmt.Errorf("invalid range")
		}
		if end >= size {
			end = size - 1
		}
		ranges = append(ranges, httpRange{start: start, length: end - start + 1})
	}
	return ranges, nil
}

// GetProxyURL returns the full proxy URL for an audio stream
func (ap *AudioProxy) GetProxyURL(audioURL string) string {
	return fmt.Sprintf("http://127.0.0.1:%d/audio?u=%s", ap.port, url.QueryEscape(audioURL))
}

// GetBaseURL returns the base URL for the proxy server
func (ap *AudioProxy) GetBaseURL() string {
	return fmt.Sprintf("http://127.0.0.1:%d", ap.port)
}

// GetImageProxyURL returns the full proxy URL for an image
func (ap *AudioProxy) GetImageProxyURL(imageURL string) string {
	return fmt.Sprintf("http://127.0.0.1:%d/image?u=%s", ap.port, url.QueryEscape(imageURL))
}

// GetLocalProxyURL returns the full proxy URL for a local audio file
func (ap *AudioProxy) GetLocalProxyURL(fileName string) string {
	return fmt.Sprintf("http://127.0.0.1:%d/local?f=%s", ap.port, url.QueryEscape(fileName))
}

// GetThemeImageProxyURL returns the full proxy URL for a local theme image
func (ap *AudioProxy) GetThemeImageProxyURL(fileName string) string {
	return fmt.Sprintf("http://127.0.0.1:%d/theme-image?f=%s", ap.port, url.QueryEscape(fileName))
}

// handleLocal serves cached local audio files under baseDir/audio_cache via /local?f=filename
func (ap *AudioProxy) handleLocal(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers first for all responses
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Range")

	// Handle preflight
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	fname := r.URL.Query().Get("f")
	if fname == "" {
		http.Error(w, "missing f parameter", http.StatusBadRequest)
		return
	}
	// Prevent path traversal: only allow basename
	if fname != filepath.Base(fname) {
		http.Error(w, "invalid filename", http.StatusBadRequest)
		return
	}

	// Try cache first, then downloads
	path := filepath.Join(ap.baseDir, "audio_cache", fname)
	if _, err := os.Stat(path); err != nil {
		if os.IsNotExist(err) {
			alt := filepath.Join(ap.baseDir, "downloads", fname)
			if _, err2 := os.Stat(alt); err2 == nil {
				path = alt
			} else {
				// Log for debugging
				fmt.Printf("[Proxy] File not found: %s (tried cache: %s, downloads: %s)\n", fname, path, alt)
				http.Error(w, "file not found", http.StatusNotFound)
				return
			}
		} else {
			fmt.Printf("[Proxy] Stat error for %s: %v\n", fname, err)
			http.Error(w, "stat error", http.StatusInternalServerError)
			return
		}
	}

	// Let serveLocalFile handle Range and Content-Type (CORS already set at function start)
	fmt.Printf("[Proxy] Serving local file: %s\n", path)
	ap.serveLocalFile(w, r, path)
}

// handleImage proxies image requests to bypass CORS and Referer restrictions
func (ap *AudioProxy) handleImage(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers first for all responses
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Range")

	// Handle preflight
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	rawURL := r.URL.Query().Get("u")
	if rawURL == "" {
		http.Error(w, "missing u parameter", http.StatusBadRequest)
		return
	}

	decodedURL, err := url.QueryUnescape(rawURL)
	if err != nil {
		http.Error(w, "invalid URL encoding", http.StatusBadRequest)
		return
	}

	fmt.Printf("[Proxy] Fetching image: %s\n", decodedURL)

	// Create upstream request with auth headers
	req, err := http.NewRequest("GET", decodedURL, nil)
	if err != nil {
		http.Error(w, "failed to create request", http.StatusInternalServerError)
		return
	}

	// Set comprehensive headers to bypass Bilibili restrictions
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Referer", "https://www.bilibili.com")
	req.Header.Set("Origin", "https://www.bilibili.com")
	req.Header.Set("Accept", "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8")
	req.Header.Set("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
	req.Header.Set("Accept-Encoding", "gzip, deflate, br")
	req.Header.Set("Sec-Fetch-Dest", "image")
	req.Header.Set("Sec-Fetch-Mode", "cors")
	req.Header.Set("Sec-Fetch-Site", "cross-site")

	resp, err := ap.httpClient.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("upstream error: %v", err), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	fmt.Printf("[Proxy] Image upstream status: %s, Content-Type: %s\n", resp.Status, resp.Header.Get("Content-Type"))

	// Copy response headers, but skip CORS headers to avoid conflicts
	contentType := resp.Header.Get("Content-Type")
	for k, vv := range resp.Header {
		if k == "Access-Control-Allow-Origin" ||
			k == "Access-Control-Allow-Methods" ||
			k == "Access-Control-Allow-Headers" ||
			k == "Access-Control-Allow-Credentials" {
			continue
		}
		for _, v := range vv {
			w.Header().Add(k, v)
		}
	}

	// Ensure proper Content-Type for images
	if contentType == "" {
		contentType = "image/jpeg" // fallback
	}
	w.Header().Set("Content-Type", contentType)

	// Set cache headers
	w.Header().Set("Cache-Control", "public, max-age=86400")

	// Write status
	w.WriteHeader(resp.StatusCode)

	// For HEAD requests, don't stream the body
	if r.Method == "HEAD" {
		return
	}

	// Stream response body
	io.Copy(w, resp.Body)
}

// handleThemeImage serves local cached theme images under baseDir/theme_images via /theme-image?f=filename
func (ap *AudioProxy) handleThemeImage(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers first for all responses
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Range")

	// Handle preflight
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	fname := r.URL.Query().Get("f")
	if fname == "" {
		http.Error(w, "missing f parameter", http.StatusBadRequest)
		return
	}
	// Prevent path traversal: only allow basename
	if fname != filepath.Base(fname) {
		http.Error(w, "invalid filename", http.StatusBadRequest)
		return
	}

	path := filepath.Join(ap.baseDir, "theme_images", fname)
	fileInfo, err := os.Stat(path)
	if err != nil {
		if os.IsNotExist(err) {
			http.Error(w, "file not found", http.StatusNotFound)
			return
		}
		http.Error(w, "stat error", http.StatusInternalServerError)
		return
	}

	// Best-effort Content-Type
	if ext := filepath.Ext(fileInfo.Name()); ext != "" {
		if ct := mime.TypeByExtension(ext); ct != "" {
			w.Header().Set("Content-Type", ct)
		}
	}

	// Cache headers
	w.Header().Set("Cache-Control", "public, max-age=86400")

	// For HEAD requests, don't stream the body
	if r.Method == "HEAD" {
		w.WriteHeader(http.StatusOK)
		return
	}

	http.ServeFile(w, r, path)
}
