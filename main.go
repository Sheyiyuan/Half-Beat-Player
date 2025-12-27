package main

import (
	"context"
	"embed"
	"log"
	"os"
	"path/filepath"

	"tomorin-player/internal/db"
	"tomorin-player/internal/models"
	"tomorin-player/internal/proxy"
	"tomorin-player/internal/services"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"gorm.io/gorm"
)

//go:embed frontend/dist
var assets embed.FS

var audioProxy *proxy.AudioProxy

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

func resolveDataDir() string {
	configDir, err := os.UserConfigDir()
	if err != nil {
		// Fallback to relative directory if unavailable
		return filepath.Join("app_data")
	}

	dir := filepath.Join(configDir, "Tomorin Player", "app_data")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		// Fallback to relative directory if creation fails
		return filepath.Join("app_data")
	}

	return dir
}

func run() error {
	dataDir := resolveDataDir()
	dbPath := filepath.Join(dataDir, "tomorin.db")

	gormDB, err := db.Open(dbPath, func(gdb *gorm.DB) error {
		// 标准迁移
		if err := gdb.AutoMigrate(&models.StreamSource{}, &models.Song{}, &models.Favorite{}, &models.SongRef{}, &models.PlayerSetting{}, &models.LyricMapping{}, &models.Playlist{}); err != nil {
			return err
		}
		// 确保 songs 表有 bvid 列（兼容旧数据库）
		if !gdb.Migrator().HasColumn(&models.Song{}, "bvid") {
			if err := gdb.Migrator().AddColumn(&models.Song{}, "bvid"); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return err
	}

	backend := services.NewService(gormDB, dataDir)
	if err := backend.Seed(); err != nil {
		return err
	}

	// Initialize audio proxy
	audioProxy = proxy.NewAudioProxy(9999, backend.GetHTTPClient(), dataDir)

	return wails.Run(&options.App{
		Title:  "Tomorin Player",
		Width:  1280,
		Height: 800,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		Logger:           logger.NewDefaultLogger(),
		BackgroundColour: &options.RGBA{R: 30, G: 30, B: 30, A: 1},
		OnStartup: func(ctx context.Context) {
			// Start audio proxy on app startup
			if err := audioProxy.Start(); err != nil {
				log.Printf("Failed to start audio proxy: %v", err)
			}
		},
		OnShutdown: func(ctx context.Context) {
			log.Println("OnShutdown called")
			// Stop audio proxy on app shutdown
			_ = audioProxy.Stop()
		},
		Bind: []interface{}{backend},
	})
}
