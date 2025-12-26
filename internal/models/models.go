package models

import "time"

// StreamSource represents the actual playable audio stream.
// Multiple songs can share the same stream source.
type StreamSource struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	BVID      string    `json:"bvid"`
	StreamURL string    `json:"streamUrl"`
	ExpiresAt time.Time `json:"expiresAt"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// Song represents a song instance with independent metadata.
// Each song instance is unique, even if they share the same stream source.
type Song struct {
	ID                 string    `gorm:"primaryKey" json:"id"`
	BVID               string    `json:"bvid"`
	Name               string    `json:"name"`
	Singer             string    `json:"singer"`
	SingerID           string    `json:"singerId"`
	Cover              string    `json:"cover"`
	SourceID           string    `json:"sourceId"`           // Foreign key to StreamSource
	StreamURL          string    `json:"streamUrl"`          // Cache of the stream URL (for backward compatibility)
	StreamURLExpiresAt time.Time `json:"streamUrlExpiresAt"` // Expiration of cached URL
	Lyric              string    `json:"lyric"`
	LyricOffset        int       `json:"lyricOffset"`
	SkipStartTime      float64   `json:"skipStartTime"`
	SkipEndTime        float64   `json:"skipEndTime"`
	CreatedAt          time.Time `json:"createdAt"`
	UpdatedAt          time.Time `json:"updatedAt"`
}

// Favorite stores a playlist of songs by id to keep schema simple.
type Favorite struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	Title     string    `json:"title"`
	SongIDs   []SongRef `gorm:"foreignKey:FavoriteID" json:"songIds"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type SongRef struct {
	ID         uint   `gorm:"primaryKey" json:"id"`
	FavoriteID string `json:"favoriteId"`
	SongID     string `json:"songId"`
}

// Theme represents a theme configuration
type Theme struct {
	ID                string  `json:"id"`
	Name              string  `json:"name"`
	ColorScheme       string  `json:"colorScheme"` // "light" or "dark"
	ThemeColor        string  `json:"themeColor"`
	BackgroundColor   string  `json:"backgroundColor"`
	BackgroundOpacity float64 `json:"backgroundOpacity"`
	BackgroundImage   string  `json:"backgroundImage"`
	PanelColor        string  `json:"panelColor"`
	PanelOpacity      float64 `json:"panelOpacity"`
	IsDefault         bool    `json:"isDefault"`
	IsReadOnly        bool    `json:"isReadOnly"`
}

// PlayerSetting captures basic playback preferences.
type PlayerSetting struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	PlayMode       string    `json:"playMode"`
	DefaultVolume  float64   `json:"defaultVolume"`
	Themes         string    `gorm:"type:longtext" json:"themes"`
	CurrentThemeID string    `json:"currentThemeId"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// Playlist stores the current playback queue state.
type Playlist struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Queue        string    `gorm:"type:longtext" json:"queue"` // JSON array of song IDs
	CurrentIndex int       `json:"currentIndex"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// LyricMapping caches text and offset.
type LyricMapping struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	Lyric     string    `json:"lyric"`
	OffsetMS  int       `json:"offsetMs"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// BiliFavoriteCollection represents a Bilibili favorite folder
type BiliFavoriteCollection struct {
	ID    int64  `json:"id"`
	Title string `json:"title"`
	Count int    `json:"count"`
	Cover string `json:"cover"`
}

// BiliFavoriteInfo represents a single favorite item (video)
type BiliFavoriteInfo struct {
	BVID  string `json:"bvid"`
	Title string `json:"title"`
	Cover string `json:"cover"`
}

// BiliAudio captures resolved audio URL and cache metadata
type BiliAudio struct {
	URL       string    `json:"url"`
	ExpiresAt time.Time `json:"expiresAt"`
	FromCache bool      `json:"fromCache"`
	Title     string    `json:"title"`
	Format    string    `json:"format"`
	Cover     string    `json:"cover"`
	Duration  int64     `json:"duration"`
	Author    string    `json:"author"`
}
