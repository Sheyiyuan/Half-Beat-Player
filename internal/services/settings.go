package services

import (
    "encoding/json"
    "errors"
    "fmt"
    "time"

    "half-beat-player/internal/models"

    "github.com/google/uuid"
    "gorm.io/gorm"
)

// SavePlayerSetting overwrites the single settings row.
func (s *Service) SavePlayerSetting(setting models.PlayerSetting) error {
    setting.ID = 1
    setting.UpdatedAt = time.Now()
    // Persist player settings

    // 使用 UpdateColumns 明确更新所有字段（包括零值）
    err := s.db.Model(&models.PlayerSetting{}).Where("id = ?", 1).UpdateColumns(map[string]interface{}{
        "default_volume": setting.DefaultVolume,
        "play_mode":      setting.PlayMode,
        "themes":         setting.Themes,
        "updated_at":     time.Now(),
    }).Error

    if err != nil {
        fmt.Printf("SavePlayerSetting error: %v\n", err)
    }
    return err
}

// GetPlayerSetting returns the stored setting (or defaults).
func (s *Service) GetPlayerSetting() (models.PlayerSetting, error) {
    var setting models.PlayerSetting
    if err := s.db.First(&setting, 1).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            themesJSON, _ := formatThemesJSON([]models.Theme{})
            setting = models.PlayerSetting{
                ID:             1,
                PlayMode:       "order",
                DefaultVolume:  0.5,
                Themes:         themesJSON,
                CurrentThemeID: "light",
            }
            if err := s.db.Create(&setting).Error; err != nil {
                return setting, err
            }
            fmt.Printf("GetPlayerSetting: Created default - Volume: %.2f\n", setting.DefaultVolume)
            return setting, nil
        }
        return setting, err
    }
    fmt.Printf("GetPlayerSetting: Loaded - Volume: %.2f, PlayMode: %s\n", setting.DefaultVolume, setting.PlayMode)
    return setting, nil
}

// formatThemesJSON converts theme slice to JSON string
func formatThemesJSON(themes []models.Theme) (string, error) {
    data, err := json.Marshal(themes)
    return string(data), err
}

// parseThemesJSON converts JSON string back to theme slice
func parseThemesJSON(themesJSON string) ([]models.Theme, error) {
    var themes []models.Theme
    if themesJSON == "" || themesJSON == "null" {
        return themes, nil
    }
    if err := json.Unmarshal([]byte(themesJSON), &themes); err != nil {
        // Return empty slice instead of nil on error
        return themes, err
    }
    return themes, nil
}

// GetThemes returns all available themes
func (s *Service) GetThemes() ([]models.Theme, error) {
    setting, err := s.GetPlayerSetting()
    if err != nil {
        fmt.Printf("GetThemes: GetPlayerSetting error: %v\n", err)
        return []models.Theme{}, err
    }
    fmt.Printf("GetThemes: Themes JSON: %s\n", setting.Themes)
    themes, err := parseThemesJSON(setting.Themes)
    if err != nil {
        fmt.Printf("GetThemes: parseThemesJSON error: %v\n", err)
        return []models.Theme{}, err
    }
    fmt.Printf("GetThemes: Parsed %d themes\n", len(themes))
    return themes, nil
}

// CreateTheme adds a new custom theme
func (s *Service) CreateTheme(theme models.Theme) (models.Theme, error) {
    fmt.Printf("CreateTheme: Creating theme %s\n", theme.Name)
    setting, err := s.GetPlayerSetting()
    if err != nil {
        fmt.Printf("CreateTheme: GetPlayerSetting error: %v\n", err)
        return theme, err
    }

    fmt.Printf("CreateTheme: Current themes JSON: %s\n", setting.Themes)
    themes, err := parseThemesJSON(setting.Themes)
    if err != nil {
        fmt.Printf("CreateTheme: parseThemesJSON error: %v\n", err)
        return theme, err
    }
    fmt.Printf("CreateTheme: Parsed %d existing themes\n", len(themes))

    // Generate unique ID for new theme
    theme.ID = "theme-" + uuid.NewString()
    theme.IsDefault = false
    theme.IsReadOnly = false
    themes = append(themes, theme)
    fmt.Printf("CreateTheme: Generated ID %s, now have %d themes\n", theme.ID, len(themes))

    themesJSON, err := formatThemesJSON(themes)
    if err != nil {
        fmt.Printf("CreateTheme: formatThemesJSON error: %v\n", err)
        return theme, err
    }
    fmt.Printf("CreateTheme: New themes JSON: %s\n", themesJSON)

    setting.Themes = themesJSON
    err = s.SavePlayerSetting(setting)
    if err != nil {
        fmt.Printf("CreateTheme: SavePlayerSetting error: %v\n", err)
    } else {
        fmt.Printf("CreateTheme: Successfully saved, returning theme with ID %s\n", theme.ID)
    }
    return theme, err
}

// UpdateTheme modifies an existing custom theme
func (s *Service) UpdateTheme(theme models.Theme) error {
    fmt.Printf("UpdateTheme: Updating theme %s (%s)\n", theme.ID, theme.Name)
    setting, err := s.GetPlayerSetting()
    if err != nil {
        fmt.Printf("UpdateTheme: GetPlayerSetting error: %v\n", err)
        return err
    }

    fmt.Printf("UpdateTheme: Current themes JSON: %s\n", setting.Themes)
    themes, err := parseThemesJSON(setting.Themes)
    if err != nil {
        fmt.Printf("UpdateTheme: parseThemesJSON error: %v\n", err)
        return err
    }
    fmt.Printf("UpdateTheme: Parsed %d themes before update\n", len(themes))

    found := false
    for i, t := range themes {
        if t.ID == theme.ID {
            // 保留 IsDefault 属性
            theme.IsDefault = t.IsDefault
            themes[i] = theme
            found = true
            fmt.Printf("UpdateTheme: Found and updated theme at index %d\n", i)
            break
        }
    }

    if !found {
        fmt.Printf("UpdateTheme: Theme ID %s not found!\n", theme.ID)
        return fmt.Errorf("theme not found: %s", theme.ID)
    }

    themesJSON, err := formatThemesJSON(themes)
    if err != nil {
        fmt.Printf("UpdateTheme: formatThemesJSON error: %v\n", err)
        return err
    }
    fmt.Printf("UpdateTheme: New themes JSON: %s\n", themesJSON)

    setting.Themes = themesJSON
    err = s.SavePlayerSetting(setting)
    if err != nil {
        fmt.Printf("UpdateTheme: SavePlayerSetting error: %v\n", err)
    } else {
        fmt.Printf("UpdateTheme: Successfully saved\n")
    }
    return err
}

// DeleteTheme removes a custom theme
func (s *Service) DeleteTheme(themeID string) error {
    setting, err := s.GetPlayerSetting()
    if err != nil {
        return err
    }

    themes, err := parseThemesJSON(setting.Themes)
    if err != nil {
        return err
    }

    newThemes := []models.Theme{}
    for _, t := range themes {
        if t.ID == themeID {
            if t.IsDefault {
                return fmt.Errorf("cannot delete default theme")
            }
            continue
        }
        newThemes = append(newThemes, t)
    }

    // If deleted theme was current, switch to light theme
    if setting.CurrentThemeID == themeID {
        setting.CurrentThemeID = "light"
    }

    themesJSON, err := formatThemesJSON(newThemes)
    if err != nil {
        return err
    }

    setting.Themes = themesJSON
    return s.SavePlayerSetting(setting)
}

// SetCurrentTheme changes the active theme
func (s *Service) SetCurrentTheme(themeID string) error {
    setting, err := s.GetPlayerSetting()
    if err != nil {
        return err
    }

    setting.CurrentThemeID = themeID
    return s.SavePlayerSetting(setting)
}
