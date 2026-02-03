// Re-export from wailsjs generated models
export { models } from "../wailsjs/go/models";
export { services } from "../wailsjs/go/models";

// Type aliases for convenience
import { models, services } from "../wailsjs/go/models";

// Define clean data types without protobuf methods
export interface Song {
    id: string;
    bvid: string;
    name: string;
    singer: string;
    singerId: string;
    cover: string;
    coverLocal: string;
    sourceId: string;
    streamUrl: string;
    streamUrlExpiresAt: string;
    lyric: string;
    lyricOffset: number;
    skipStartTime: number;
    skipEndTime: number;
    pageNumber: number;
    pageTitle: string;
    videoTitle: string;
    totalPages: number;
    createdAt: string;
    updatedAt: string;
}

export interface SongRef {
    favoriteId: string;
    songId: string;
    addedAt: string;
}

export interface Favorite {
    id: string;
    title: string;
    songIds: SongRef[];
    createdAt: string;
    updatedAt: string;
}

export type PlayerSetting = models.PlayerSetting;
export type LyricMapping = models.LyricMapping;
export type Playlist = models.Playlist;
export type ExportData = services.ExportData;
export type BiliAudio = models.BiliAudio;

// Extend Theme to include new properties from JSON data
export interface Theme extends models.Theme {
    // 基础设置
    themeColor?: string;
    colorScheme?: string;
    // 背景设置
    backgroundColor?: string;
    backgroundOpacity?: number;
    backgroundImage?: string;
    backgroundImageSourceUrl?: string;
    backgroundBlur?: number;
    // 面板设置
    panelColor?: string;
    panelOpacity?: number;
    panelBlur?: number;
    panelRadius?: number;
    // 控件与文字
    controlColor?: string;
    controlOpacity?: number;
    controlBlur?: number;
    textColorPrimary?: string;
    textColorSecondary?: string;
    // 歌单卡片
    favoriteCardColor?: string;
    cardOpacity?: number;
    // 其他设置
    componentRadius?: number;
    modalRadius?: number;
    notificationRadius?: number;
    coverRadius?: number;
    // 模态框设置
    modalColor?: string;
    modalOpacity?: number;
    modalBlur?: number;
    // 窗口控制
    windowControlsPos?: string;
}

export interface UserInfo {
    uid: number;
    username: string;
    face: string;
    level: number;
    vipType: number;
}

// Export classes for runtime use
export const SongClass = models.Song;
export const FavoriteClass = models.Favorite;
export const SongRefClass = models.SongRef;
export const PlayerSettingClass = models.PlayerSetting;
export const LyricMappingClass = models.LyricMapping;

// Type conversion functions
export function convertSong(s: any): Song {
    return {
        id: s.id || '',
        bvid: s.bvid || '',
        name: s.name || '',
        singer: s.singer || '',
        singerId: s.singerId || '',
        cover: s.cover || '',
        coverLocal: s.coverLocal || '',
        sourceId: s.sourceId || '',
        streamUrl: s.streamUrl || '',
        streamUrlExpiresAt: s.streamUrlExpiresAt?.toString ? s.streamUrlExpiresAt.toString() : s.streamUrlExpiresAt || '',
        lyric: s.lyric || '',
        lyricOffset: s.lyricOffset || 0,
        skipStartTime: s.skipStartTime || 0,
        skipEndTime: s.skipEndTime || 0,
        pageNumber: s.pageNumber || 0,
        pageTitle: s.pageTitle || '',
        videoTitle: s.videoTitle || '',
        totalPages: s.totalPages || 0,
        createdAt: s.createdAt?.toString ? s.createdAt.toString() : s.createdAt || '',
        updatedAt: s.updatedAt?.toString ? s.updatedAt.toString() : s.updatedAt || '',
    };
}

export function convertSongs(songs: any[]): Song[] {
    return songs.map(convertSong);
}

export function convertSongRef(ref: any): SongRef {
    return {
        favoriteId: ref.favoriteId || '',
        songId: ref.songId || '',
        addedAt: ref.addedAt?.toString ? ref.addedAt.toString() : ref.addedAt || '',
    };
}

export function convertFavorite(f: any): Favorite {
    return {
        id: f.id || '',
        title: f.title || '',
        songIds: (f.songIds || []).map(convertSongRef),
        createdAt: f.createdAt?.toString ? f.createdAt.toString() : f.createdAt || '',
        updatedAt: f.updatedAt?.toString ? f.updatedAt.toString() : f.updatedAt || '',
    };
}

export function convertFavorites(favs: any[]): Favorite[] {
    return favs.map(convertFavorite);
}

export function convertTheme(t: any): Theme {
    // 如果 data 字段存在，解析 JSON 配置
    let themeConfig: any = {};
    if (t.data) {
        try {
            themeConfig = typeof t.data === 'string' ? JSON.parse(t.data) : t.data;
        } catch (e) {
            console.warn('Failed to parse theme data:', e);
        }
    }

    return {
        id: t.id || '',
        name: t.name || '',
        data: t.data || '',
        isDefault: t.isDefault || false,
        isReadOnly: t.isReadOnly || false,
        // 展开配置数据到主题对象供前端使用
        themeColor: themeConfig.themeColor || '#1f77f0',
        backgroundColor: themeConfig.backgroundColor || '#0a0e27',
        backgroundOpacity: themeConfig.backgroundOpacity ?? 1,
        backgroundImage: themeConfig.backgroundImage || '',
        backgroundImageSourceUrl: themeConfig.backgroundImageSourceUrl || '',
        backgroundBlur: themeConfig.backgroundBlur ?? 0,
        panelColor: themeConfig.panelColor || '#1a1f3a',
        panelOpacity: themeConfig.panelOpacity ?? 0.6,
        panelBlur: themeConfig.panelBlur ?? 10,
        panelRadius: themeConfig.panelRadius ?? 8,
        controlColor: themeConfig.controlColor || '#2a2f4a',
        controlOpacity: themeConfig.controlOpacity ?? 1,
        controlBlur: themeConfig.controlBlur ?? 0,
        textColorPrimary: themeConfig.textColorPrimary || '#ffffff',
        textColorSecondary: themeConfig.textColorSecondary || '#909296',
        favoriteCardColor: themeConfig.favoriteCardColor || '#2a2f4a',
        cardOpacity: themeConfig.cardOpacity ?? 0.5,
        componentRadius: themeConfig.componentRadius ?? 6,
        modalRadius: themeConfig.modalRadius ?? 8,
        notificationRadius: themeConfig.notificationRadius ?? 4,
        coverRadius: themeConfig.coverRadius ?? 4,
        modalColor: themeConfig.modalColor || '#1a1f3a',
        modalOpacity: themeConfig.modalOpacity ?? 0.95,
        modalBlur: themeConfig.modalBlur ?? 10,
        windowControlsPos: themeConfig.windowControlsPos || 'left',
        colorScheme: themeConfig.colorScheme || 'dark',
    };
}

export function convertThemes(themes: any[]): Theme[] {
    return themes.map(convertTheme);
}