package services

import (
	"half-beat-player/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// ListFavorites returns favorites with song ids only (frontend can hydrate).
func (s *Service) ListFavorites() ([]models.Favorite, error) {
	var favs []models.Favorite
	if err := s.db.Preload("SongIDs").Find(&favs).Error; err != nil {
		return nil, err
	}
	return favs, nil
}

// SaveFavorite stores a favorite list.
func (s *Service) SaveFavorite(fav models.Favorite) error {
	if fav.ID == "" {
		fav.ID = "FavList-" + uuid.NewString()
	}
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clauseOnConflictID()).Create(&fav).Error; err != nil {
			return err
		}
		if err := tx.Where("favorite_id = ?", fav.ID).Delete(&models.SongRef{}).Error; err != nil {
			return err
		}
		for i := range fav.SongIDs {
			fav.SongIDs[i].FavoriteID = fav.ID
		}
		if len(fav.SongIDs) == 0 {
			return nil
		}
		return tx.Create(&fav.SongIDs).Error
	})
}

// DeleteFavorite deletes a favorite and its song refs.
func (s *Service) DeleteFavorite(id string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Delete(&models.Favorite{}, "id = ?", id).Error; err != nil {
			return err
		}
		return tx.Delete(&models.SongRef{}, "favorite_id = ?", id).Error
	})
}

// clauseOnConflictID is a small helper to update on PK conflict.
func clauseOnConflictID() clause.Expression {
	return clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoUpdates: clause.Assignments(map[string]interface{}{"title": clause.Expr{SQL: "excluded.title"}, "updated_at": clause.Expr{SQL: "excluded.updated_at"}}),
	}
}
