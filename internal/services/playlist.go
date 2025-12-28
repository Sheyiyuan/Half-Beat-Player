package services

import (
	"errors"
	"time"

	"half-beat-player/internal/models"

	"gorm.io/gorm"
)

// SavePlaylist saves the current playback queue and index.
func (s *Service) SavePlaylist(queueJSON string, currentIndex int) error {
	playlist := models.Playlist{
		ID:           1,
		Queue:        queueJSON,
		CurrentIndex: currentIndex,
		UpdatedAt:    time.Now(),
	}
	return s.db.Save(&playlist).Error
}

// GetPlaylist retrieves the saved playlist state.
func (s *Service) GetPlaylist() (models.Playlist, error) {
	var playlist models.Playlist
	if err := s.db.First(&playlist, 1).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Return empty playlist if not found
			return models.Playlist{
				ID:           1,
				Queue:        "[]",
				CurrentIndex: 0,
			}, nil
		}
		return playlist, err
	}
	return playlist, nil
}
