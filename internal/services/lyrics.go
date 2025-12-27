package services

import (
	"errors"
	"fmt"
	"time"

	"tomorin-player/internal/models"

	"gorm.io/gorm"
)

// SaveLyricMapping upserts lyric text and offset.
func (s *Service) SaveLyricMapping(mapping models.LyricMapping) error {
	if mapping.ID == "" {
		return fmt.Errorf("lyric id required")
	}
	mapping.UpdatedAt = time.Now()
	return s.db.Save(&mapping).Error
}

func (s *Service) GetLyricMapping(id string) (models.LyricMapping, error) {
	var m models.LyricMapping
	if err := s.db.First(&m, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 返回空记录，不打印错误日志
			return models.LyricMapping{ID: id}, nil
		}
		return m, err
	}
	return m, nil
}
