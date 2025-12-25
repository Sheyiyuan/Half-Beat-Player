// Re-export from wailsjs generated models
export { models } from "../wailsjs/go/models";
export { services } from "../wailsjs/go/models";

// Type aliases for convenience
import { models, services } from "../wailsjs/go/models";

export type Song = models.Song;
export type Favorite = models.Favorite;
export type SongRef = models.SongRef;
export type PlayerSetting = models.PlayerSetting;
export type LyricMapping = models.LyricMapping;
export type Playlist = models.Playlist;
export type ExportData = services.ExportData;
export type Theme = models.Theme;
export type BiliAudio = models.BiliAudio;

// Export classes for runtime use
export const SongClass = models.Song;
export const FavoriteClass = models.Favorite;
export const PlayerSettingClass = models.PlayerSetting;
export const LyricMappingClass = models.LyricMapping;