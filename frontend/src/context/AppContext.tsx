/**
 * 统一的应用 Context 提供者
 * 整合 AppContext、ThemeContext、ModalContext 三个 Context
 * 为整个应用提供单一的状态管理入口
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import {
    AppStore,
    PlayerState,
    PlaylistState,
    ThemeState,
    ModalState,
    UIState,
    DataState,
    AppActions,
    PlayerActions,
    PlaylistActions,
    ThemeActions,
    ModalActions,
    UIActions,
    DataActions,
} from '../store/types';
import { Song, Favorite, Theme, UserInfo, PlayerSetting, LyricMapping, convertTheme, convertThemes } from '../types';
import { DEFAULT_THEMES } from '../utils/constants';
import { useModalManager } from '../hooks/ui/useModalManager';

// ========== Context 定义 ==========
export interface AppContextValue {
    store: AppStore;
    // dispatch: (action: AppStoreAction) => void;
}

const AppStoreContext = createContext<AppContextValue | undefined>(undefined);

// ========== Provider 组件 ==========
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // 获取 Mantine 相关 hooks
    const { setColorScheme: setMantineColorScheme } = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme('light');

    // ========== 播放器状态 ==========
    const [playerQueue, setPlayerQueue] = useState<Song[]>([]);
    const [playerCurrentIndex, setPlayerCurrentIndex] = useState(0);
    const [playerCurrentSong, setPlayerCurrentSong] = useState<Song | null>(null);
    const [playerIsPlaying, setPlayerIsPlaying] = useState(false);
    const [playerProgress, setPlayerProgress] = useState(0);
    const [playerDuration, setPlayerDuration] = useState(0);
    const [playerVolume, setPlayerVolume] = useState(1);
    const [playerPlayMode, setPlayerPlayMode] = useState<'loop-all' | 'loop-one' | 'shuffle' | 'no-loop'>('loop-all');
    const [playerSkipStartTime, setPlayerSkipStartTime] = useState(0);
    const [playerSkipEndTime, setPlayerSkipEndTime] = useState(0);
    const [playerSkipEnabled, setPlayerSkipEnabled] = useState(false);

    // ========== 歌单状态 ==========
    const [playlistFavorites, setPlaylistFavorites] = useState<Favorite[]>([]);
    const [playlistSongs, setPlaylistSongs] = useState<Song[]>([]);
    const [playlistSelectedFavId, setPlaylistSelectedFavId] = useState<string | null>(null);
    const [playlistIsLoadingFavorites, setPlaylistIsLoadingFavorites] = useState(false);
    const [playlistIsLoadingSongs, setPlaylistIsLoadingSongs] = useState(false);

    // ========== 主题状态初始化 ==========
    const getCachedThemes = (): Theme[] => {
        try {
            const saved = localStorage.getItem('half-beat.customThemes');
            if (saved) {
                const cached = JSON.parse(saved) as Theme[];
                return convertThemes(cached);
            }
        } catch (e) {
            console.warn('[AppContext] 读取缓存主题失败:', e);
        }
        return [];
    };

    const initialThemes = [...DEFAULT_THEMES, ...getCachedThemes()];
    const getInitialThemeId = (): string => {
        try {
            const saved = localStorage.getItem('half-beat.currentThemeId');
            if (saved && initialThemes.find(t => t.id === saved)) {
                return saved;
            }
        } catch (e) {
            console.warn('[AppContext] 读取 localStorage 失败:', e);
        }
        const fallback = computedColorScheme === "dark" ? "dark" : "light";
        return fallback;
    };

    const initialThemeId = getInitialThemeId();
    const defaultThemeObj = initialThemes.find(t => t.id === initialThemeId) || DEFAULT_THEMES.find(t => t.id === "light");
    const defaultTheme = defaultThemeObj ? convertTheme(defaultThemeObj) : convertTheme(DEFAULT_THEMES[0]);

    // ========== 主题状态 ==========
    const [themeThemes, setThemeThemes] = useState<Theme[]>(convertThemes(initialThemes));
    const [themeCurrentThemeId, setThemeCurrentThemeId] = useState<string | null>(defaultTheme.id);
    const [themeThemeColor, setThemeThemeColor] = useState(defaultTheme.themeColor || '#ffffff');
    const [themeColorScheme, setThemeColorScheme] = useState<'light' | 'dark'>(
        (defaultTheme.colorScheme as 'light' | 'dark') || 'dark'
    );
    const [themeBackgroundColor, setThemeBackgroundColor] = useState(defaultTheme.backgroundColor || '#ffffff');
    const [themeBackgroundOpacity, setThemeBackgroundOpacity] = useState(defaultTheme.backgroundOpacity ?? 1);
    const [themeBackgroundImageUrl, setThemeBackgroundImageUrl] = useState(defaultTheme.backgroundImage || "");
    const [themeBackgroundBlur, setThemeBackgroundBlur] = useState(defaultTheme.backgroundBlur ?? 0);
    const [themePanelColor, setThemePanelColor] = useState(defaultTheme.panelColor || '#ffffff');
    const [themePanelOpacity, setThemePanelOpacity] = useState(defaultTheme.panelOpacity ?? 0.92);
    const [themePanelBlur, setThemePanelBlur] = useState(defaultTheme.panelBlur ?? 0);
    const [themePanelRadius, setThemePanelRadius] = useState(defaultTheme.panelRadius ?? 8);
    const [themeControlColor, setThemeControlColor] = useState(defaultTheme.controlColor || '#ffffff');
    const [themeControlOpacity, setThemeControlOpacity] = useState(defaultTheme.controlOpacity ?? 1);
    const [themeControlBlur, setThemeControlBlur] = useState(defaultTheme.controlBlur ?? 0);
    const [themeTextColorPrimary, setThemeTextColorPrimary] = useState(defaultTheme.textColorPrimary || "#1a1b1e");
    const [themeTextColorSecondary, setThemeTextColorSecondary] = useState(defaultTheme.textColorSecondary || "#909296");
    const [themeFavoriteCardColor, setThemeFavoriteCardColor] = useState(defaultTheme.favoriteCardColor || '#ffffff');
    const [themeCardOpacity, setThemeCardOpacity] = useState(defaultTheme.cardOpacity ?? 1);
    const [themeComponentRadius, setThemeComponentRadius] = useState(defaultTheme.componentRadius ?? 8);
    const [themeModalRadius, setThemeModalRadius] = useState(defaultTheme.modalRadius ?? 12);
    const [themeNotificationRadius, setThemeNotificationRadius] = useState(defaultTheme.notificationRadius ?? 8);
    const [themeCoverRadius, setThemeCoverRadius] = useState(defaultTheme.coverRadius ?? 8);
    const [themeModalColor, setThemeModalColor] = useState(defaultTheme.modalColor || '#ffffff');
    const [themeModalOpacity, setThemeModalOpacity] = useState(defaultTheme.modalOpacity ?? 1);
    const [themeModalBlur, setThemeModalBlur] = useState(defaultTheme.modalBlur ?? 0);
    const [themeWindowControlsPos, setThemeWindowControlsPos] = useState<'left' | 'right' | 'hidden'>(
        (defaultTheme.windowControlsPos as 'left' | 'right' | 'hidden') || 'right'
    );

    // ========== UI 状态 ==========
    const [uiStatus, setUiStatus] = useState<string>("加载中...");
    const [uiUserInfo, setUiUserInfo] = useState<UserInfo | null>(null);
    const [uiIsLoading, setUiIsLoading] = useState(false);
    const [uiErrorMessage, setUiErrorMessage] = useState<string | null>(null);
    const [uiSearchQuery, setUiSearchQuery] = useState("");
    const [uiGlobalSearchTerm, setUiGlobalSearchTerm] = useState("");
    const [uiGlobalSearchResults, setUiGlobalSearchResults] = useState<Song[]>([]);

    // ========== 数据状态 ==========
    const [dataSetting, setDataSetting] = useState<PlayerSetting | null>(null);
    const [dataLyricMapping, setDataLyricMapping] = useState<LyricMapping | null>(null);
    const [dataCachedSongs] = useState<Map<string, Song>>(new Map());
    const [dataCachedCovers] = useState<Map<string, string>>(new Map());

    // ========== 模态框状态（使用现有的 Hook）==========
    const modalManager = useModalManager();

    // ========== 播放器操作 ==========
    const playerActions: PlayerActions = useMemo(() => ({
        setSong: (song) => setPlayerCurrentSong(song),
        setQueue: (queue) => setPlayerQueue(queue),
        setCurrentIndex: (index) => setPlayerCurrentIndex(index),
        setIsPlaying: (playing) => setPlayerIsPlaying(playing),
        setProgress: (progress) => setPlayerProgress(progress),
        setDuration: (duration) => setPlayerDuration(duration),
        setVolume: (volume) => setPlayerVolume(volume),
        setPlayMode: (mode) => setPlayerPlayMode(mode),
        setSkipStartTime: (time) => setPlayerSkipStartTime(time),
        setSkipEndTime: (time) => setPlayerSkipEndTime(time),
        setSkipEnabled: (enabled) => setPlayerSkipEnabled(enabled),
        play: () => setPlayerIsPlaying(true),
        pause: () => setPlayerIsPlaying(false),
        nextSong: () => {
            const nextIndex = (playerCurrentIndex + 1) % playerQueue.length;
            setPlayerCurrentIndex(nextIndex);
            setPlayerCurrentSong(playerQueue[nextIndex]);
        },
        prevSong: () => {
            const prevIndex = playerCurrentIndex === 0 ? playerQueue.length - 1 : playerCurrentIndex - 1;
            setPlayerCurrentIndex(prevIndex);
            setPlayerCurrentSong(playerQueue[prevIndex]);
        },
        seek: (time) => setPlayerProgress(time),
    }), [playerCurrentIndex, playerQueue]);

    // ========== 歌单操作 ==========
    const playlistActions: PlaylistActions = useMemo(() => ({
        setFavorites: (favorites) => setPlaylistFavorites(favorites),
        setSongs: (songs) => setPlaylistSongs(songs),
        setSelectedFavId: (favId) => setPlaylistSelectedFavId(favId),
        addSong: (song) => setPlaylistSongs(prev => [...prev, song]),
        removeSong: (songId) => setPlaylistSongs(prev => prev.filter(s => s.id !== songId)),
        updateSong: (songId, updates) => setPlaylistSongs(prev =>
            prev.map(s => s.id === songId ? { ...s, ...updates } : s)
        ),
        addFavorite: (favorite) => setPlaylistFavorites(prev => [...prev, favorite]),
        removeFavorite: (favId) => setPlaylistFavorites(prev => prev.filter(f => f.id !== favId)),
        updateFavorite: (favId, updates) => setPlaylistFavorites(prev =>
            prev.map(f => f.id === favId ? { ...f, ...updates } : f)
        ),
        setIsLoadingFavorites: (loading) => setPlaylistIsLoadingFavorites(loading),
        setIsLoadingSongs: (loading) => setPlaylistIsLoadingSongs(loading),
    }), []);

    // ========== 主题操作 ==========
    const applyTheme = useCallback((theme: Theme) => {
        if (!theme) return;

        setThemeThemeColor(theme.themeColor || '#ffffff');
        setThemeBackgroundColor(theme.backgroundColor || '#ffffff');
        setThemeBackgroundOpacity(theme.backgroundOpacity ?? 1);
        setThemeBackgroundImageUrl(theme.backgroundImage || "");
        setThemeBackgroundBlur(theme.backgroundBlur ?? 0);
        setThemePanelColor(theme.panelColor || '#ffffff');
        setThemePanelOpacity(theme.panelOpacity ?? 0.92);
        setThemePanelBlur(theme.panelBlur ?? 0);
        setThemePanelRadius(theme.panelRadius ?? 8);
        setThemeControlColor(theme.controlColor || theme.panelColor || "#ffffff");
        setThemeControlOpacity(theme.controlOpacity ?? 1);
        setThemeControlBlur(theme.controlBlur ?? 0);
        setThemeTextColorPrimary(theme.textColorPrimary || (computedColorScheme === 'dark' ? '#ffffff' : '#1a1b1e'));
        setThemeTextColorSecondary(theme.textColorSecondary || (computedColorScheme === 'dark' ? '#a6a7ab' : '#909296'));
        setThemeFavoriteCardColor(theme.favoriteCardColor || theme.panelColor || "#ffffff");
        setThemeCardOpacity(theme.cardOpacity ?? 1);
        setThemeComponentRadius(theme.componentRadius ?? 8);
        setThemeModalRadius(theme.modalRadius ?? 12);
        setThemeNotificationRadius(theme.notificationRadius ?? 8);
        setThemeCoverRadius(theme.coverRadius ?? 8);
        setThemeModalColor(theme.modalColor || theme.panelColor || "#ffffff");
        setThemeModalOpacity(theme.modalOpacity ?? 1);
        setThemeModalBlur(theme.modalBlur ?? 0);
        setThemeWindowControlsPos((theme.windowControlsPos as 'left' | 'right' | 'hidden') || "right");
        const scheme = (theme.colorScheme as 'light' | 'dark') || 'dark';
        setThemeColorScheme(scheme);
        setThemeCurrentThemeId(theme.id);

        // 应用到 Mantine
        setMantineColorScheme(scheme);

        // 保存到 localStorage
        localStorage.setItem('half-beat.currentThemeId', theme.id);
    }, [computedColorScheme, setMantineColorScheme]);

    const themeActions: ThemeActions = useMemo(() => ({
        setThemes: (themes) => setThemeThemes(themes),
        setCurrentThemeId: (id) => setThemeCurrentThemeId(id),
        setThemeColor: (color) => setThemeThemeColor(color),
        setColorScheme: (scheme) => {
            setThemeColorScheme(scheme);
            setMantineColorScheme(scheme);
        },
        setBackgroundColor: (color) => setThemeBackgroundColor(color),
        setBackgroundOpacity: (opacity) => setThemeBackgroundOpacity(opacity),
        setBackgroundImageUrl: (url) => setThemeBackgroundImageUrl(url.trim()),
        setBackgroundBlur: (blur) => setThemeBackgroundBlur(blur),
        setPanelColor: (color) => setThemePanelColor(color),
        setPanelOpacity: (opacity) => setThemePanelOpacity(opacity),
        setPanelBlur: (blur) => setThemePanelBlur(blur),
        setPanelRadius: (radius) => setThemePanelRadius(radius),
        setControlColor: (color) => setThemeControlColor(color),
        setControlOpacity: (opacity) => setThemeControlOpacity(opacity),
        setControlBlur: (blur) => setThemeControlBlur(blur),
        setTextColorPrimary: (color) => setThemeTextColorPrimary(color),
        setTextColorSecondary: (color) => setThemeTextColorSecondary(color),
        setFavoriteCardColor: (color) => setThemeFavoriteCardColor(color),
        setCardOpacity: (opacity) => setThemeCardOpacity(opacity),
        setComponentRadius: (radius) => setThemeComponentRadius(radius),
        setModalRadius: (radius) => setThemeModalRadius(radius),
        setNotificationRadius: (radius) => setThemeNotificationRadius(radius),
        setCoverRadius: (radius) => setThemeCoverRadius(radius),
        setModalColor: (color) => setThemeModalColor(color),
        setModalOpacity: (opacity) => setThemeModalOpacity(opacity),
        setModalBlur: (blur) => setThemeModalBlur(blur),
        setWindowControlsPos: (pos) => setThemeWindowControlsPos(pos),
        applyTheme,
    }), [applyTheme, setMantineColorScheme]);

    // ========== UI 操作 ==========
    const uiActions: UIActions = useMemo(() => ({
        setStatus: (status) => setUiStatus(status),
        setUserInfo: (userInfo) => setUiUserInfo(userInfo),
        setIsLoading: (loading) => setUiIsLoading(loading),
        setErrorMessage: (message) => setUiErrorMessage(message),
        setSearchQuery: (query) => setUiSearchQuery(query),
        setGlobalSearchTerm: (term) => setUiGlobalSearchTerm(term),
        setGlobalSearchResults: (results) => setUiGlobalSearchResults(results),
    }), []);

    // ========== 数据操作 ==========
    const dataActions: DataActions = useMemo(() => ({
        setSetting: (setting) => setDataSetting(setting),
        setLyricMapping: (mapping) => setDataLyricMapping(mapping),
        setCachedSong: (songId, song) => dataCachedSongs.set(songId, song),
        getCachedSong: (songId) => dataCachedSongs.get(songId),
        setCachedCover: (url, base64) => dataCachedCovers.set(url, base64),
        getCachedCover: (url) => dataCachedCovers.get(url),
        clearSongCache: () => dataCachedSongs.clear(),
        clearCoverCache: () => dataCachedCovers.clear(),
    }), [dataCachedSongs, dataCachedCovers]);

    // ========== 模态框操作 ==========
    const modalActions: ModalActions = useMemo(() => ({
        openLogin: () => modalManager.openModal('loginModal'),
        closeLogin: () => modalManager.closeModal('loginModal'),
        openSettings: () => modalManager.openModal('settingsModal'),
        closeSettings: () => modalManager.closeModal('settingsModal'),
        openPlaylist: () => modalManager.openModal('playlistModal'),
        closePlaylist: () => modalManager.closeModal('playlistModal'),
        openThemeManager: () => modalManager.openModal('themeManagerModal'),
        closeThemeManager: () => modalManager.closeModal('themeManagerModal'),
        openThemeEditor: () => modalManager.openModal('themeEditorModal'),
        closeThemeEditor: () => modalManager.closeModal('themeEditorModal'),
        openThemeDetail: (theme, readonly) => modalManager.openModal('themeDetailModal'),
        closeThemeDetail: () => modalManager.closeModal('themeDetailModal'),
        openGlobalSearch: () => modalManager.openModal('globalSearchModal'),
        closeGlobalSearch: () => modalManager.closeModal('globalSearchModal'),
        openBVAdd: () => modalManager.openModal('bvAddModal'),
        closeBVAdd: () => modalManager.closeModal('bvAddModal'),
        openFavoriteList: () => modalManager.openModal('playlistManagerModal'),
        closeFavoriteList: () => modalManager.closeModal('playlistManagerModal'),
        openCreateFavorite: () => modalManager.openModal('createFavModal'),
        closeCreateFavorite: () => modalManager.closeModal('createFavModal'),
        openAddToFavorite: () => modalManager.openModal('addFavoriteModal'),
        closeAddToFavorite: () => modalManager.closeModal('addFavoriteModal'),
        openDownloadManager: () => modalManager.openModal('downloadManagerModal'),
        closeDownloadManager: () => modalManager.closeModal('downloadManagerModal'),
        openDownloadTasks: () => modalManager.openModal('downloadTasksModal'),
        closeDownloadTasks: () => modalManager.closeModal('downloadTasksModal'),
        openSongDetail: (song) => modalManager.openModal('downloadModal'),
        closeSongDetail: () => modalManager.closeModal('downloadModal'),
    }), [modalManager]);

    // ========== 合并所有操作 ==========
    const allActions: AppActions = useMemo(() => ({
        ...playerActions,
        ...playlistActions,
        ...themeActions,
        ...uiActions,
        ...dataActions,
        ...modalActions,
    }), [playerActions, playlistActions, themeActions, uiActions, dataActions, modalActions]);

    // ========== 构建 Store 对象 ==========
    const store: AppStore = useMemo(() => ({
        player: {
            queue: playerQueue,
            currentIndex: playerCurrentIndex,
            currentSong: playerCurrentSong,
            isPlaying: playerIsPlaying,
            progress: playerProgress,
            duration: playerDuration,
            volume: playerVolume,
            playMode: playerPlayMode,
            skipStartTime: playerSkipStartTime,
            skipEndTime: playerSkipEndTime,
            skipEnabled: playerSkipEnabled,
        },
        playlist: {
            favorites: playlistFavorites,
            songs: playlistSongs,
            selectedFavId: playlistSelectedFavId,
            isLoadingFavorites: playlistIsLoadingFavorites,
            isLoadingSongs: playlistIsLoadingSongs,
        },
        theme: {
            themes: themeThemes,
            currentThemeId: themeCurrentThemeId,
            themeColor: themeThemeColor,
            colorScheme: themeColorScheme,
            backgroundColor: themeBackgroundColor,
            backgroundOpacity: themeBackgroundOpacity,
            backgroundImageUrl: themeBackgroundImageUrl,
            backgroundBlur: themeBackgroundBlur,
            panelColor: themePanelColor,
            panelOpacity: themePanelOpacity,
            panelBlur: themePanelBlur,
            panelRadius: themePanelRadius,
            controlColor: themeControlColor,
            controlOpacity: themeControlOpacity,
            controlBlur: themeControlBlur,
            textColorPrimary: themeTextColorPrimary,
            textColorSecondary: themeTextColorSecondary,
            favoriteCardColor: themeFavoriteCardColor,
            cardOpacity: themeCardOpacity,
            componentRadius: themeComponentRadius,
            modalRadius: themeModalRadius,
            notificationRadius: themeNotificationRadius,
            coverRadius: themeCoverRadius,
            modalColor: themeModalColor,
            modalOpacity: themeModalOpacity,
            modalBlur: themeModalBlur,
            windowControlsPos: themeWindowControlsPos,
        },
        modals: {
            loginOpen: modalManager.modals.loginModal,
            settingsOpen: modalManager.modals.settingsModal,
            playlistOpen: modalManager.modals.playlistModal,
            themeManagerOpen: modalManager.modals.themeManagerModal,
            themeEditorOpen: modalManager.modals.themeEditorModal,
            themeDetailOpen: modalManager.modals.themeDetailModal,
            themeDetailData: null,
            themeDetailReadonly: false,
            globalSearchOpen: modalManager.modals.globalSearchModal,
            bvAddOpen: modalManager.modals.bvAddModal,
            favoriteListOpen: modalManager.modals.playlistManagerModal,
            createFavoriteOpen: modalManager.modals.createFavModal,
            addToFavoriteOpen: modalManager.modals.addFavoriteModal,
            downloadManagerOpen: modalManager.modals.downloadManagerModal,
            downloadTasksOpen: modalManager.modals.downloadTasksModal,
            songDetailOpen: modalManager.modals.downloadModal,
            songDetailData: null,
        },
        ui: {
            status: uiStatus,
            userInfo: uiUserInfo,
            isLoading: uiIsLoading,
            errorMessage: uiErrorMessage,
            searchQuery: uiSearchQuery,
            globalSearchTerm: uiGlobalSearchTerm,
            globalSearchResults: uiGlobalSearchResults,
        },
        data: {
            setting: dataSetting,
            lyricMapping: dataLyricMapping,
            cachedSongs: dataCachedSongs,
            cachedCovers: dataCachedCovers,
        },
        download: {
            tasks: [],
            activeTaskId: null,
        },
        actions: allActions,
    }), [
        playerQueue, playerCurrentIndex, playerCurrentSong, playerIsPlaying, playerProgress, playerDuration, playerVolume,
        playerPlayMode, playerSkipStartTime, playerSkipEndTime, playerSkipEnabled,
        playlistFavorites, playlistSongs, playlistSelectedFavId, playlistIsLoadingFavorites, playlistIsLoadingSongs,
        themeThemes, themeCurrentThemeId, themeThemeColor, themeColorScheme, themeBackgroundColor, themeBackgroundOpacity,
        themeBackgroundImageUrl, themeBackgroundBlur, themePanelColor, themePanelOpacity, themePanelBlur, themePanelRadius,
        themeControlColor, themeControlOpacity, themeControlBlur, themeTextColorPrimary, themeTextColorSecondary,
        themeFavoriteCardColor, themeCardOpacity, themeComponentRadius, themeModalRadius, themeNotificationRadius,
        themeCoverRadius, themeModalColor, themeModalOpacity, themeModalBlur, themeWindowControlsPos,
        uiStatus, uiUserInfo, uiIsLoading, uiErrorMessage, uiSearchQuery, uiGlobalSearchTerm, uiGlobalSearchResults,
        dataSetting, dataLyricMapping, dataCachedSongs, dataCachedCovers,
        modalManager, allActions,
    ]);

    // ========== 清理旧的 localStorage ==========
    useEffect(() => {
        const oldKeys = ['customThemes', 'userInfo'];
        const fieldsToClean = [
            'themeColor', 'backgroundColor', 'backgroundOpacity', 'backgroundImageUrl',
            'panelColor', 'panelOpacity', 'currentThemeId', 'customThemes'
        ];

        oldKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
            }
        });

        fieldsToClean.forEach(field => {
            try {
                localStorage.removeItem(field);
            } catch (e) {
                // 忽略错误
            }
        });
    }, []);

    // ========== 应用主题时自动同步到 Mantine ==========
    useEffect(() => {
        if (themeColorScheme) {
            setMantineColorScheme(themeColorScheme);
        }
    }, [themeColorScheme]);

    // ========== Context Value ==========
    const contextValue: AppContextValue = {
        store,
    };

    return (
        <AppStoreContext.Provider value={contextValue}>
            {children}
        </AppStoreContext.Provider>
    );
};

// ========== Hook: 访问 Store ==========
export const useAppStore = (): [AppStore, AppActions] => {
    const context = useContext(AppStoreContext);
    if (!context) {
        throw new Error('useAppStore must be used within AppProvider');
    }
    return [context.store, context.store.actions];
};

// ========== 便捷 Hook：访问特定的状态域 ==========
export const usePlayerState = () => {
    const [store] = useAppStore();
    return store.player;
};

export const usePlaylistState = () => {
    const [store] = useAppStore();
    return store.playlist;
};

export const useThemeState = () => {
    const [store] = useAppStore();
    return store.theme;
};

export const useModalState = () => {
    const [store] = useAppStore();
    return store.modals;
};

export const useUIState = () => {
    const [store] = useAppStore();
    return store.ui;
};

export const useDataState = () => {
    const [store] = useAppStore();
    return store.data;
};

// ========== 类型导出 ==========
export type { AppStore, PlayerState, PlaylistState, ThemeState, ModalState, UIState, DataState, AppActions };
