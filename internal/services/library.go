package services

import (
	"half-beat-player/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ExportData dumps all persisted entities.
type ExportData struct {
	Songs     []models.Song         `json:"songs"`
	Favorites []models.Favorite     `json:"favorites"`
	Settings  models.PlayerSetting  `json:"settings"`
	Lyrics    []models.LyricMapping `json:"lyrics"`
}

func (s *Service) ExportData() (ExportData, error) {
	var out ExportData
	if err := s.db.Find(&out.Songs).Error; err != nil {
		return out, err
	}
	if err := s.db.Preload("SongIDs").Find(&out.Favorites).Error; err != nil {
		return out, err
	}
	out.Settings, _ = s.GetPlayerSetting()
	if err := s.db.Find(&out.Lyrics).Error; err != nil {
		return out, err
	}
	return out, nil
}

func (s *Service) ImportData(in ExportData) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec("DELETE FROM song_refs").Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM favorites").Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM songs").Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM lyric_mappings").Error; err != nil {
			return err
		}
		if err := tx.Save(&in.Songs).Error; err != nil {
			return err
		}
		for i := range in.Favorites {
			if in.Favorites[i].ID == "" {
				in.Favorites[i].ID = "FavList-" + uuid.NewString()
			}
		}
		if err := tx.Save(&in.Favorites).Error; err != nil {
			return err
		}
		for i := range in.Favorites {
			for j := range in.Favorites[i].SongIDs {
				in.Favorites[i].SongIDs[j].FavoriteID = in.Favorites[i].ID
			}
			if err := tx.Create(&in.Favorites[i].SongIDs).Error; err != nil {
				return err
			}
		}
		if err := tx.Save(&in.Settings).Error; err != nil {
			return err
		}
		if err := tx.Save(&in.Lyrics).Error; err != nil {
			return err
		}
		return nil
	})
}

// ClearLibrary removes all songs, favorites, and lyric mappings, then seeds an empty default favorite.
func (s *Service) ClearLibrary() error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec("DELETE FROM song_refs").Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM favorites").Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM songs").Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM lyric_mappings").Error; err != nil {
			return err
		}
		seed := models.Favorite{ID: "FavList-default", Title: "默认歌单"}
		if err := tx.Create(&seed).Error; err != nil {
			return err
		}
		return nil
	})
}
