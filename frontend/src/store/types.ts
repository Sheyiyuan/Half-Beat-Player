/**
 * 统一 Store 类型定义
 * 集中管理全局应用状态的类型
 */

import {
    Song, Favorite, PlayerSetting, LyricMapping, Theme, UserInfo
} from '../types';
import { MantineColorScheme } from '@mantine/core';

// ========== 播放器状态 ==========
export interface PlayerState {
    queue: Song[];
    currentIndex: number;
    currentSong: Song | null;
    isPlaying: boolean;
    progress: number;
    duration: number;
    volume: number;
    playMode: 'loop-all' | 'loop-one' | 'shuffle' | 'no-loop';
    skipStartTime: number;
    skipEndTime: number;
    skipEnabled: boolean;
}

// ========== 歌单状态 ==========
export interface PlaylistState {
    favorites: Favorite[];
    songs: Song[];
    selectedFavId: string | null;
    isLoadingFavorites: boolean;
    isLoadingSongs: boolean;
}

// ========== 主题状态 ==========
export interface ThemeState {
    themes: Theme[];
    currentThemeId: string | null;

    // 主题颜色配置
    themeColor: string;
    colorScheme: 'light' | 'dark';

    // 背景设置
    backgroundColor: string;
    backgroundOpacity: number;
    backgroundImageUrl: string;
    backgroundBlur: number;

    // 面板设置
    panelColor: string;
    panelOpacity: number;
    panelBlur: number;
    panelRadius: number;

    // 控件与文字
    controlColor: string;
    controlOpacity: number;
    controlBlur: number;
    textColorPrimary: string;
    textColorSecondary: string;

    // 歌单卡片
    favoriteCardColor: string;
    cardOpacity: number;

    // 其他设置
    componentRadius: number;
    modalRadius: number;
    notificationRadius: number;
    coverRadius: number;

    // 模态框设置
    modalColor: string;
    modalOpacity: number;
    modalBlur: number;

    // 窗口控制
    windowControlsPos: 'left' | 'right' | 'hidden';
}

// ========== 模态框状态 ==========
export interface ModalState {
    loginOpen: boolean;
    settingsOpen: boolean;
    playlistOpen: boolean;
    themeManagerOpen: boolean;
    themeEditorOpen: boolean;
    themeDetailOpen: boolean;
    themeDetailData: Theme | null;
    themeDetailReadonly: boolean;
    globalSearchOpen: boolean;
    bvAddOpen: boolean;
    favoriteListOpen: boolean;
    createFavoriteOpen: boolean;
    addToFavoriteOpen: boolean;
    downloadManagerOpen: boolean;
    songDetailOpen: boolean;
    songDetailData: Song | null;
}

// ========== UI 状态 ==========
export interface UIState {
    status: string;
    userInfo: UserInfo | null;
    isLoading: boolean;
    errorMessage: string | null;
    searchQuery: string;
    globalSearchTerm: string;
    globalSearchResults: Song[];
}

// ========== 数据状态 ==========
export interface DataState {
    setting: PlayerSetting | null;
    lyricMapping: LyricMapping | null;
    cachedSongs: Map<string, Song>;
    cachedCovers: Map<string, string>;
}

// ========== 播放器操作接口 ==========
export interface PlayerActions {
    setSong: (song: Song | null) => void;
    setQueue: (queue: Song[]) => void;
    setCurrentIndex: (index: number) => void;
    setIsPlaying: (playing: boolean) => void;
    setProgress: (progress: number) => void;
    setDuration: (duration: number) => void;
    setVolume: (volume: number) => void;
    setPlayMode: (mode: 'loop-all' | 'loop-one' | 'shuffle' | 'no-loop') => void;
    setSkipStartTime: (time: number) => void;
    setSkipEndTime: (time: number) => void;
    setSkipEnabled: (enabled: boolean) => void;

    // 便捷方法
    play: () => void;
    pause: () => void;
    nextSong: () => void;
    prevSong: () => void;
    seek: (time: number) => void;
}

// ========== 歌单操作接口 ==========
export interface PlaylistActions {
    setFavorites: (favorites: Favorite[]) => void;
    setSongs: (songs: Song[]) => void;
    setSelectedFavId: (favId: string | null) => void;
    addSong: (song: Song) => void;
    removeSong: (songId: string) => void;
    updateSong: (songId: string, updates: Partial<Song>) => void;
    addFavorite: (favorite: Favorite) => void;
    removeFavorite: (favId: string) => void;
    updateFavorite: (favId: string, updates: Partial<Favorite>) => void;
    setIsLoadingFavorites: (loading: boolean) => void;
    setIsLoadingSongs: (loading: boolean) => void;
}

// ========== 主题操作接口 ==========
export interface ThemeActions {
    setThemes: (themes: Theme[]) => void;
    setCurrentThemeId: (id: string | null) => void;
    setThemeColor: (color: string) => void;
    setColorScheme: (scheme: 'light' | 'dark') => void;
    setBackgroundColor: (color: string) => void;
    setBackgroundOpacity: (opacity: number) => void;
    setBackgroundImageUrl: (url: string) => void;
    setBackgroundBlur: (blur: number) => void;
    setPanelColor: (color: string) => void;
    setPanelOpacity: (opacity: number) => void;
    setPanelBlur: (blur: number) => void;
    setPanelRadius: (radius: number) => void;
    setControlColor: (color: string) => void;
    setControlOpacity: (opacity: number) => void;
    setControlBlur: (blur: number) => void;
    setTextColorPrimary: (color: string) => void;
    setTextColorSecondary: (color: string) => void;
    setFavoriteCardColor: (color: string) => void;
    setCardOpacity: (opacity: number) => void;
    setComponentRadius: (radius: number) => void;
    setModalRadius: (radius: number) => void;
    setNotificationRadius: (radius: number) => void;
    setCoverRadius: (radius: number) => void;
    setModalColor: (color: string) => void;
    setModalOpacity: (opacity: number) => void;
    setModalBlur: (blur: number) => void;
    setWindowControlsPos: (pos: 'left' | 'right' | 'hidden') => void;

    // 便捷方法
    applyTheme: (theme: Theme) => void;
}

// ========== 模态框操作接口 ==========
export interface ModalActions {
    openLogin: () => void;
    closeLogin: () => void;
    openSettings: () => void;
    closeSettings: () => void;
    openPlaylist: () => void;
    closePlaylist: () => void;
    openThemeManager: () => void;
    closeThemeManager: () => void;
    openThemeDetail: (theme: Theme, readonly?: boolean) => void;
    closeThemeDetail: () => void;
    openGlobalSearch: () => void;
    closeGlobalSearch: () => void;
    openBVAdd: () => void;
    closeBVAdd: () => void;
    openFavoriteList: () => void;
    closeFavoriteList: () => void;
    openCreateFavorite: () => void;
    closeCreateFavorite: () => void;
    openAddToFavorite: () => void;
    closeAddToFavorite: () => void;
    openDownloadManager: () => void;
    closeDownloadManager: () => void;
    openSongDetail: (song: Song) => void;
    closeSongDetail: () => void;
}

// ========== UI 操作接口 ==========
export interface UIActions {
    setStatus: (status: string) => void;
    setUserInfo: (userInfo: UserInfo | null) => void;
    setIsLoading: (loading: boolean) => void;
    setErrorMessage: (message: string | null) => void;
    setSearchQuery: (query: string) => void;
    setGlobalSearchTerm: (term: string) => void;
    setGlobalSearchResults: (results: Song[]) => void;
}

// ========== 数据操作接口 ==========
export interface DataActions {
    setSetting: (setting: PlayerSetting | null) => void;
    setLyricMapping: (mapping: LyricMapping | null) => void;
    setCachedSong: (songId: string, song: Song) => void;
    getCachedSong: (songId: string) => Song | undefined;
    setCachedCover: (url: string, base64: string) => void;
    getCachedCover: (url: string) => string | undefined;
    clearSongCache: () => void;
    clearCoverCache: () => void;
}

// ========== 全局操作接口 ==========
export interface AppActions
    extends PlayerActions, PlaylistActions, ThemeActions, ModalActions, UIActions, DataActions { }

// ========== 应用 Store 接口 ==========
export interface AppStore {
    // 各个状态域
    player: PlayerState;
    playlist: PlaylistState;
    theme: ThemeState;
    modals: ModalState;
    ui: UIState;
    data: DataState;

    // 所有操作集合
    actions: AppActions;
}

// ========== 应用 Store Context 值 ==========
export interface AppStoreContextValue {
    store: AppStore;
    dispatch: (action: AppStoreAction) => void;
}

// ========== Store Action 类型 ==========
export type AppStoreAction =
    | { type: 'SET_SONG'; payload: Song | null }
    | { type: 'SET_QUEUE'; payload: Song[] }
    | { type: 'SET_CURRENT_INDEX'; payload: number }
    | { type: 'SET_IS_PLAYING'; payload: boolean }
    | { type: 'SET_PROGRESS'; payload: number }
    | { type: 'SET_DURATION'; payload: number }
    | { type: 'SET_VOLUME'; payload: number }
    | { type: 'SET_PLAY_MODE'; payload: 'loop-all' | 'loop-one' | 'shuffle' | 'no-loop' }
    | { type: 'SET_FAVORITES'; payload: Favorite[] }
    | { type: 'SET_SONGS'; payload: Song[] }
    | { type: 'SET_SELECTED_FAV_ID'; payload: string | null }
    | { type: 'SET_THEMES'; payload: Theme[] }
    | { type: 'SET_CURRENT_THEME_ID'; payload: string | null }
    | { type: 'SET_COLOR_SCHEME'; payload: 'light' | 'dark' }
    | { type: 'OPEN_MODAL'; payload: keyof ModalState }
    | { type: 'CLOSE_MODAL'; payload: keyof ModalState }
    | { type: 'SET_THEME_DETAIL'; payload: { theme: Theme; readonly: boolean } }
    | { type: 'SET_USER_INFO'; payload: UserInfo | null }
    | { type: 'SET_STATUS'; payload: string }
    // ... 其他 action types
    ;
