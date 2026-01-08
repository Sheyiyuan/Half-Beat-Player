package db

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Open opens (and migrates) a SQLite database at the given path.
func Open(dbPath string, migrate func(*gorm.DB) error) (*gorm.DB, error) {
	if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil {
		return nil, fmt.Errorf("create db dir: %w", err)
	}

	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		// 禁用 GORM 默认日志，防止 RecordNotFound 错误被打印
		Logger: logger.Discard,
	})
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}

	if migrate != nil {
		if err := migrate(db); err != nil {
			return nil, fmt.Errorf("migrate: %w", err)
		}
	}

	log.Printf("database ready at %s", dbPath)
	return db, nil
}
