package services

import (
	"errors"
	"fmt"
	"time"

	"half-beat-player/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// Seed inserts a default empty playlist if the DB is empty.
func (s *Service) Seed() error {
	var count int64
	if err := s.db.Model(&models.Favorite{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	seedFav := models.Favorite{ID: "FavList-default", Title: "默认歌单"}
	return s.db.Create(&seedFav).Error
}

// ListSongs returns all songs.
func (s *Service) ListSongs() ([]models.Song, error) {
	var songs []models.Song
	if err := s.db.Find(&songs).Error; err != nil {
		return nil, err
	}
	return songs, nil
}

// UpsertSongs inserts or updates songs with their stream sources.
// Each new song is a separate instance, even if they share the same BVID.
// Supports backward compatibility by accepting streamUrl in Song object.
// Uses INSERT OR REPLACE to handle duplicate IDs gracefully.
func (s *Service) UpsertSongs(songs []models.Song) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		for i := range songs {
			// 每个新的歌曲实例都需要独立的 ID
			if songs[i].ID == "" {
				songs[i].ID = uuid.NewString()
			}

			// 确保歌曲有名字
			if songs[i].Name == "" {
				return fmt.Errorf("歌曲缺少名字")
			}

			// 向后兼容：如果 streamUrl 存在但 sourceId 为空，创建 StreamSource
			if songs[i].StreamURL != "" && songs[i].SourceID == "" {
				sourceID := uuid.NewString()
				source := models.StreamSource{
					ID:        sourceID,
					BVID:      songs[i].BVID,
					StreamURL: songs[i].StreamURL,
					ExpiresAt: songs[i].StreamURLExpiresAt,
				}
				if err := tx.Create(&source).Error; err != nil {
					return err
				}
				songs[i].SourceID = sourceID
			}
		}

		// 批量保存歌曲（使用 UPSERT 处理重复 ID）
		if err := tx.Clauses(clause.OnConflict{
			UpdateAll: true,
		}).Create(&songs).Error; err != nil {
			return err
		}

		return nil
	})
}

// CreateStreamSource creates a new stream source and returns its ID.
func (s *Service) CreateStreamSource(bvid, streamURL string, expiresAt time.Time) (string, error) {
	sourceID := uuid.NewString()
	source := models.StreamSource{
		ID:        sourceID,
		BVID:      bvid,
		StreamURL: streamURL,
		ExpiresAt: expiresAt,
	}
	if err := s.db.Create(&source).Error; err != nil {
		return "", err
	}
	return sourceID, nil
}

// DeleteSong removes song only if it's not referenced by any favorite.
func (s *Service) DeleteSong(id string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		// 检查是否有歌单引用此歌曲
		var refCount int64
		if err := tx.Model(&models.SongRef{}).Where("song_id = ?", id).Count(&refCount).Error; err != nil {
			return err
		}

		if refCount > 0 {
			return fmt.Errorf("歌曲仍被歌单引用，无法删除")
		}

		// 删除歌曲
		if err := tx.Delete(&models.Song{}, "id = ?", id).Error; err != nil {
			return err
		}

		// 检查是否有其他歌曲引用此流源
		var song models.Song
		if err := tx.First(&song, "id = ?", id).Error; err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}

		// 如果没有其他歌曲引用此流源，删除流源
		if song.SourceID != "" {
			var sourceRefCount int64
			if err := tx.Model(&models.Song{}).Where("source_id = ?", song.SourceID).Count(&sourceRefCount).Error; err != nil {
				return err
			}

			if sourceRefCount == 0 {
				if err := tx.Delete(&models.StreamSource{}, "id = ?", song.SourceID).Error; err != nil {
					return err
				}
			}
		}

		return nil
	})
}

// DeleteUnreferencedSongs deletes all songs that are not referenced by any favorite.
func (s *Service) DeleteUnreferencedSongs() (int64, error) {
	var deletedCount int64
	err := s.db.Transaction(func(tx *gorm.DB) error {
		// 获取所有被引用的歌曲 ID
		var referencedIDs []string
		if err := tx.Model(&models.SongRef{}).
			Distinct("song_id").
			Pluck("song_id", &referencedIDs).Error; err != nil {
			return err
		}

		// 删除所有未被引用的歌曲
		var result *gorm.DB
		if len(referencedIDs) == 0 {
			// 如果没有引用，删除所有歌曲
			result = tx.Delete(&models.Song{})
			if result.Error != nil {
				return result.Error
			}
		} else {
			// 删除不在引用列表中的歌曲
			result = tx.Where("id NOT IN ?", referencedIDs).Delete(&models.Song{})
			if result.Error != nil {
				return result.Error
			}
		}
		deletedCount = result.RowsAffected

		// 清理未被引用的流源
		if err := tx.Where("id NOT IN (SELECT DISTINCT source_id FROM songs WHERE source_id IS NOT NULL AND source_id != '')").
			Delete(&models.StreamSource{}).Error; err != nil {
			return err
		}

		return nil
	})
	return deletedCount, err
}
