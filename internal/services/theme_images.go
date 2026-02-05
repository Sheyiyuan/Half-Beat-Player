package services

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
	"mime"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const (
	themeImageDirName  = "theme_images"
	maxThemeImageBytes = 20 << 20 // 20MB
)

// SaveThemeImageFromDataURL stores a data URL image locally and returns a proxied URL.
func (s *Service) SaveThemeImageFromDataURL(dataURL string) (string, error) {
	if strings.TrimSpace(dataURL) == "" {
		return "", fmt.Errorf("data URL is empty")
	}
	mimeType, data, err := decodeImageDataURL(dataURL)
	if err != nil {
		return "", fmt.Errorf("decode data URL: %w", err)
	}
	return s.saveThemeImageBytes(data, mimeType)
}

// SaveThemeImageFromURL downloads an image URL, stores it locally, and returns a proxied URL.
func (s *Service) SaveThemeImageFromURL(imageURL string) (string, error) {
	trimmed := strings.TrimSpace(imageURL)
	if trimmed == "" {
		return "", fmt.Errorf("image URL is empty")
	}
	if !strings.HasPrefix(trimmed, "http://") && !strings.HasPrefix(trimmed, "https://") {
		return "", fmt.Errorf("unsupported URL scheme")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "GET", trimmed, nil)
	if err != nil {
		return "", fmt.Errorf("create request: %w", err)
	}

	// Set headers to bypass common hotlink restrictions
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
	req.Header.Set("Referer", "https://www.bilibili.com")
	req.Header.Set("Origin", "https://www.bilibili.com")
	req.Header.Set("Accept", "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8")
	req.Header.Set("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("download image: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		return "", fmt.Errorf("upstream status: %s", resp.Status)
	}

	data, err := readWithLimit(resp.Body, maxThemeImageBytes)
	if err != nil {
		return "", fmt.Errorf("read image: %w", err)
	}

	contentType := resp.Header.Get("Content-Type")
	if contentType == "" {
		contentType = http.DetectContentType(data)
	}
	if !strings.HasPrefix(contentType, "image/") {
		return "", fmt.Errorf("invalid content type: %s", contentType)
	}

	return s.saveThemeImageBytes(data, contentType)
}

func (s *Service) saveThemeImageBytes(data []byte, contentType string) (string, error) {
	if len(data) == 0 {
		return "", fmt.Errorf("image data is empty")
	}
	if len(data) > maxThemeImageBytes {
		return "", fmt.Errorf("image exceeds %d bytes", maxThemeImageBytes)
	}

	imageDir := filepath.Join(s.dataDir, themeImageDirName)
	if err := os.MkdirAll(imageDir, 0o755); err != nil {
		return "", fmt.Errorf("create theme image dir: %w", err)
	}

	hash := sha256.Sum256(data)
	ext := inferImageExtension(contentType, data)
	fileName := fmt.Sprintf("%x%s", hash, ext)
	path := filepath.Join(imageDir, fileName)

	if _, err := os.Stat(path); err == nil {
		return s.getThemeImageProxyURL(fileName), nil
	}

	tmp := path + ".part"
	_ = os.Remove(tmp)
	if err := os.WriteFile(tmp, data, 0o644); err != nil {
		return "", fmt.Errorf("write image: %w", err)
	}
	if err := os.Rename(tmp, path); err != nil {
		_ = os.Remove(tmp)
		return "", fmt.Errorf("finalize image: %w", err)
	}

	return s.getThemeImageProxyURL(fileName), nil
}

func (s *Service) getThemeImageProxyURL(fileName string) string {
	if s.audioProxy != nil {
		return s.audioProxy.GetThemeImageProxyURL(fileName)
	}
	return fmt.Sprintf("http://127.0.0.1:9999/theme-image?f=%s", url.QueryEscape(fileName))
}

func decodeImageDataURL(dataURL string) (string, []byte, error) {
	if !strings.HasPrefix(dataURL, "data:") {
		return "", nil, fmt.Errorf("invalid data URL")
	}
	parts := strings.SplitN(dataURL, ",", 2)
	if len(parts) != 2 {
		return "", nil, fmt.Errorf("invalid data URL format")
	}
	meta := parts[0]
	if !strings.HasSuffix(meta, ";base64") {
		return "", nil, fmt.Errorf("data URL must be base64 encoded")
	}
	mimeType := strings.TrimSuffix(strings.TrimPrefix(meta, "data:"), ";base64")
	if !strings.HasPrefix(mimeType, "image/") {
		return "", nil, fmt.Errorf("invalid mime type: %s", mimeType)
	}
	decoded, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return "", nil, fmt.Errorf("decode base64: %w", err)
	}
	return mimeType, decoded, nil
}

func inferImageExtension(contentType string, data []byte) string {
	ct := strings.TrimSpace(contentType)
	if ct == "" {
		ct = http.DetectContentType(data)
	}
	if exts, err := mime.ExtensionsByType(ct); err == nil && len(exts) > 0 {
		return normalizeExt(exts[0])
	}
	// Fallback mapping
	switch {
	case strings.Contains(ct, "png"):
		return ".png"
	case strings.Contains(ct, "webp"):
		return ".webp"
	case strings.Contains(ct, "gif"):
		return ".gif"
	case strings.Contains(ct, "jpeg"), strings.Contains(ct, "jpg"):
		return ".jpg"
	default:
		return ".jpg"
	}
}

func normalizeExt(ext string) string {
	if ext == "" {
		return ".jpg"
	}
	if !strings.HasPrefix(ext, ".") {
		return "." + ext
	}
	return ext
}

func readWithLimit(r io.Reader, limit int) ([]byte, error) {
	data, err := io.ReadAll(io.LimitReader(r, int64(limit)+1))
	if err != nil {
		return nil, err
	}
	if len(data) > limit {
		return nil, fmt.Errorf("payload too large")
	}
	return data, nil
}
