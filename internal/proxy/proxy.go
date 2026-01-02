package proxy

import (
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

type AudioProxy struct {
	port       int
	listener   net.Listener
	server     *http.Server
	httpClient *http.Client
	baseDir    string
	mu         sync.RWMutex
	isRunning  bool
}

func NewAudioProxy(port int, httpClient *http.Client, baseDir string) *AudioProxy {
	return &AudioProxy{
		port:       port,
		httpClient: httpClient,
		baseDir:    baseDir,
	}
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
		_ = server.Serve(listener)
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
					ap.serveLocalFile(w, cachePath)
					return
				}
				
				downloadPath := filepath.Join(ap.baseDir, "downloads", fileName)
				if _, err := os.Stat(downloadPath); err == nil {
					fmt.Printf("[Proxy] Serving from downloads: %s\n", downloadPath)
					ap.serveLocalFile(w, downloadPath)
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

// serveLocalFile serves a local file with proper headers
func (ap *AudioProxy) serveLocalFile(w http.ResponseWriter, filePath string) {
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
	w.Header().Set("Content-Length", fmt.Sprintf("%d", fileInfo.Size()))
	w.Header().Set("Accept-Ranges", "bytes")
	w.Header().Set("Cache-Control", "public, max-age=86400")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Stream file
	w.WriteHeader(http.StatusOK)
	io.Copy(w, file)
}

// GetProxyURL returns the full proxy URL for an audio stream
func (ap *AudioProxy) GetProxyURL(audioURL string) string {
	return fmt.Sprintf("http://127.0.0.1:%d/audio?u=%s", ap.port, url.QueryEscape(audioURL))
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

	// Let ServeFile handle Range and Content-Type (CORS already set at function start)
	fmt.Printf("[Proxy] Serving local file: %s\n", path)
	http.ServeFile(w, r, path)
}
