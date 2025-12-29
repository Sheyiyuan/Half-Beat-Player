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
	BVID               string    `gorm:"column:bvid" json:"bvid"`
	Name               string    `json:"name"`
	Singer             string    `json:"singer"`
	SingerID           string    `json:"singerId"`
	Cover              string    `json:"cover"`
	CoverLocal         string    `json:"coverLocal"`
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
	ID                  string  `json:"id"`
	Name                string  `json:"name"`
	ThemeColor          string  `json:"themeColor"`
	BackgroundColor     string  `json:"backgroundColor"`
	BackgroundOpacity   float64 `json:"backgroundOpacity"`
	BackgroundImage     string  `json:"backgroundImage"`
	BackgroundBlur      float64 `json:"backgroundBlur"`      // Blur radius for background image (0-50)
	PanelColor          string  `json:"panelColor"`
	PanelOpacity        float64 `json:"panelOpacity"`
	PanelBlur           float64 `json:"panelBlur"`            // Gaussian blur for panels (0-30)
	PanelRadius         float64 `json:"panelRadius"`          // Border radius for panels (0-20)
	ControlColor        string  `json:"controlColor"`        // Color for buttons/inputs
	ControlOpacity      float64 `json:"controlOpacity"`      // Opacity for buttons/inputs
	ControlBlur         float64 `json:"controlBlur"`         // Blur for buttons/inputs (0-20)
	TextColorPrimary    string  `json:"textColorPrimary"`    // Primary text color
	TextColorSecondary  string  `json:"textColorSecondary"`  // Secondary/dimmed text color
	FavoriteCardColor   string  `json:"favoriteCardColor"`   // Color for favorite list cards
	CardOpacity         float64 `json:"cardOpacity"`         // Opacity for cards (0-1)
	ComponentRadius     float64 `json:"componentRadius"`       // Border radius for components like buttons/inputs (0-32)
	ModalRadius         float64 `json:"modalRadius"`           // Border radius for modals (0-32)
	NotificationRadius  float64 `json:"notificationRadius"`    // Border radius for notifications (0-32)
	CoverRadius         float64 `json:"coverRadius"`           // Border radius for song covers (0-32)
	ModalColor          string  `json:"modalColor"`            // Color for modal backgrounds
	ModalOpacity        float64 `json:"modalOpacity"`          // Opacity for modals (0-1)
	ModalBlur           float64 `json:"modalBlur"`             // Blur radius for modals (0-30)
	WindowControlsPos   string  `json:"windowControlsPos"`    // Position of window controls: "left", "right", "hidden" (default: "right")
	IsDefault           bool    `json:"isDefault"`
	IsReadOnly          bool    `json:"isReadOnly"`
}

// PlayerSetting captures basic playback preferences.
type PlayerSetting struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Config    map[string]any `gorm:"column:config;serializer:json" json:"config"`
	UpdatedAt time.Time      `json:"updatedAt"`
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
