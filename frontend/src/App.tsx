import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, useMantineColorScheme, MantineProvider, createTheme } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import * as Services from "../wailsjs/go/services/Service";
import { Favorite, LyricMapping, PlayerSetting, Song, Theme } from "./types";
import AppPanels from "./components/AppPanels";
import AppModals, { AppModalsProps } from "./components/AppModals";

// Hooks
import { useAudioPlayer, usePlaylist, useAudioInterval, usePlaylistActions, useSkipIntervalHandler, useDownloadManager, useAudioEvents, usePlaybackControls, usePlaylistPersistence, useAudioSourceManager, usePlaySong, usePlayModes } from "./hooks/player";
import { useSongs, useFavorites, useSongCache, useSettingsPersistence } from "./hooks/data";
import { useAuth, useBVResolver, useFavoriteActions, useThemeEditor, useSearchAndBV, useBVModal, useLyricManagement, useSongOperations, useLyricLoader, useGlobalSearch, useLoginHandlers } from "./hooks/features";
import { useHitokoto, useUiDerived, useAppLifecycle, useAppEffects, useAppHandlers } from "./hooks/ui";
import { useAppPanelsProps } from "./hooks/ui/useAppPanelsProps";
// Contexts
import { useThemeContext, useModalContext } from "./context";

// Utils
import { formatTime, formatTimeLabel, parseTimeLabel, formatTimeWithMs } from "./utils/time";
import { APP_VERSION, PLACEHOLDER_COVER, DEFAULT_THEMES } from "./utils/constants";

// Declare window.go for Wails runtime
declare global {
    interface Window {
        go?: any;
    }
}

const App: React.FC = () => {
    // ========== Hooks ==========
    // 播放器相关
    const playlist = usePlaylist();
    const { queue, currentIndex, currentSong, playMode, setQueue, setCurrentIndex, setCurrentSong, setPlayMode } = playlist;

    const audioPlayer = useAudioPlayer(currentSong);
    const { audioRef, state: audioState, actions: audioActions, setIsPlaying, setProgress, setDuration } = audioPlayer;
    const { isPlaying, progress, duration, volume } = audioState;
    const { play, pause, seek, setVolume } = audioActions;

    const interval = useAudioInterval(currentSong, duration, progress);
    const { intervalRef, intervalStart, intervalEnd, intervalLength, progressInInterval } = interval;

    // 数据管理
    const songsHook = useSongs();
    const { songs, setSongs, loadSongs, refreshSongs } = songsHook;

    const favoritesHook = useFavorites();
    const { favorites, setFavorites, loadFavorites, refreshFavorites } = favoritesHook;

    const songCache = useSongCache();
    const { updateSongWithCache } = songCache;

    // 功能模块
    const { state: themeState, actions: themeActions } = useThemeContext();
    const {
        themes, currentThemeId, themeColor, backgroundColor, backgroundOpacity,
        backgroundImageUrl, backgroundBlur, panelColor, panelOpacity, panelBlur, panelRadius,
        controlColor, controlOpacity, controlBlur, textColorPrimary, textColorSecondary, favoriteCardColor, cardOpacity,
        modalRadius, notificationRadius, componentRadius, coverRadius, modalColor, modalOpacity, modalBlur, windowControlsPos, computedColorScheme,
    } = themeState;
    const {
        setThemes, setCurrentThemeId, setThemeColor, setBackgroundColor,
        setBackgroundOpacity, setBackgroundImageUrl, setBackgroundBlur, setPanelColor, setPanelOpacity, setPanelBlur, setPanelRadius,
        setControlColor, setControlOpacity, setControlBlur, setTextColorPrimary, setTextColorSecondary, setFavoriteCardColor, setCardOpacity,
        setModalRadius, setNotificationRadius, setComponentRadius, setCoverRadius, setModalColor, setModalOpacity, setModalBlur, setWindowControlsPos,
        applyTheme, setBackgroundImageUrlSafe,
    } = themeActions;

    const auth = useAuth();
    const { isLoggedIn, userInfo, loginModalOpened, setIsLoggedIn, setUserInfo, setLoginModalOpened, checkLoginStatus, getUserInfo } = auth;

    const bvResolver = useBVResolver();
    const {
        bvPreview, bvModalOpen, bvSongName, bvSinger, bvTargetFavId, resolvingBV,
        sliceStart, sliceEnd,
        setBvPreview, setBvModalOpen, setBvSongName, setBvSinger, setBvTargetFavId,
        setResolvingBV, setSliceStart, setSliceEnd,
        resolveBV, resetBVState
    } = bvResolver;

    const hitokoto = useHitokoto();

    // ========== Refs ==========
    const playingRef = useRef<string | null>(null);
    const playbackRetryRef = useRef<Map<string, number>>(new Map());
    const isHandlingErrorRef = useRef<Set<string>>(new Set());
    const prevSongIdRef = useRef<string | null>(null);

    // 启动期间先阻止持久化，待设置加载完成后再打开
    const skipPersistRef = useRef(true);
    const fileDraftInputRef = useRef<HTMLInputElement | null>(null);
    // 定时保存防抖器（key -> timerId）
    const saveTimerRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

    // ========== 模态框管理 ==========
    const { modals, openModal, closeModal } = useModalContext();

    // ========== 核心应用状态 ==========
    const [setting, setSetting] = useState<PlayerSetting | null>(null);
    const [lyric, setLyric] = useState<LyricMapping | null>(null);
    const [status, setStatus] = useState<string>("加载中...");

    // 搜索相关
    const [searchQuery, setSearchQuery] = useState("");
    const [globalSearchTerm, setGlobalSearchTerm] = useState("");
    const [selectedFavId, setSelectedFavId] = useState<string | null>(null);
    const [remoteResults, setRemoteResults] = useState<Song[]>([]);
    const [remoteLoading, setRemoteLoading] = useState(false);

    // BV 模态创建歌单名称
    const [newFavName, setNewFavName] = useState("");

    // 设置相关
    const [cacheSize, setCacheSize] = useState(0);

    // ========== 收藏夹管理状态 ==========
    // 创建收藏夹
    const [createFavName, setCreateFavName] = useState("新歌单");
    const [createFavMode, setCreateFavMode] = useState<"blank" | "duplicate" | "importMine" | "importFid">("blank");
    const [duplicateSourceId, setDuplicateSourceId] = useState<string | null>(null);
    const [importFid, setImportFid] = useState("");
    const [confirmDeleteFavId, setConfirmDeleteFavId] = useState<string | null>(null);

    // 编辑收藏夹
    const [editingFavId, setEditingFavId] = useState<string | null>(null);
    const [editingFavName, setEditingFavName] = useState("");

    // ========== 下载管理状态 ==========
    const [isDownloaded, setIsDownloaded] = useState<boolean>(false);
    const [confirmDeleteDownloaded, setConfirmDeleteDownloaded] = useState<boolean>(false);
    const [downloadedSongIds, setDownloadedSongIds] = useState<Set<string>>(new Set());
    const [managingSong, setManagingSong] = useState<Song | null>(null);
    const [confirmRemoveSongId, setConfirmRemoveSongId] = useState<string | null>(null);

    // ========== 主题编辑器状态 ==========
    const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
    const [newThemeName, setNewThemeName] = useState<string>("");
    const [themeColorDraft, setThemeColorDraft] = useState<string>("#228be6");
    const [backgroundColorDraft, setBackgroundColorDraft] = useState<string>("#f8fafc");
    const [backgroundOpacityDraft, setBackgroundOpacityDraft] = useState<number>(1);
    const [backgroundImageUrlDraft, setBackgroundImageUrlDraft] = useState<string>("");
    const [backgroundBlurDraft, setBackgroundBlurDraft] = useState<number>(0);
    const [panelOpacityDraft, setPanelOpacityDraft] = useState<number>(0.92);
    const [panelColorDraft, setPanelColorDraft] = useState<string>("#ffffff");
    const [panelBlurDraft, setPanelBlurDraft] = useState<number>(0);
    const [panelRadiusDraft, setPanelRadiusDraft] = useState<number>(8);
    const [controlColorDraft, setControlColorDraft] = useState<string>("#ffffff");
    const [controlOpacityDraft, setControlOpacityDraft] = useState<number>(1);
    const [controlBlurDraft, setControlBlurDraft] = useState<number>(0);
    const [textColorPrimaryDraft, setTextColorPrimaryDraft] = useState<string>("#1a1b1e");
    const [textColorSecondaryDraft, setTextColorSecondaryDraft] = useState<string>("#909296");
    const [favoriteCardColorDraft, setFavoriteCardColorDraft] = useState<string>("#ffffff");
    const [cardOpacityDraft, setCardOpacityDraft] = useState<number>(1);
    const [modalRadiusDraft, setModalRadiusDraft] = useState<number>(8);
    const [notificationRadiusDraft, setNotificationRadiusDraft] = useState<number>(8);
    const [componentRadiusDraft, setComponentRadiusDraft] = useState<number>(8);
    const [coverRadiusDraft, setCoverRadiusDraft] = useState<number>(8);
    const [modalColorDraft, setModalColorDraft] = useState<string>("#ffffff");
    const [modalOpacityDraft, setModalOpacityDraft] = useState<number>(1);
    const [modalBlurDraft, setModalBlurDraft] = useState<number>(0);
    const [windowControlsPosDraft, setWindowControlsPosDraft] = useState<string>("right");
    const [colorSchemeDraft, setColorSchemeDraft] = useState<string>("dark");
    const [savingTheme, setSavingTheme] = useState(false);

    // ========== 提前定义的辅助函数 ==========
    // Mantine 颜色方案切换
    const { setColorScheme } = useMantineColorScheme();
    const setBackgroundImageUrlDraftSafe = useCallback((url: string) => {
        setBackgroundImageUrlDraft(url);
    }, []);

    // 从状态中提取自定义主题（非默认）
    const getCustomThemesFromState = useCallback((all: Theme[]) => {
        return all.filter((t) => !t.isDefault);
    }, []);

    // 应用主题到 UI（并跳过一次持久化防抖）
    const applyThemeToUi = useCallback((theme: Theme) => {
        const backgroundBlurValue = theme.backgroundBlur ?? 0;
        const panelBlurValue = theme.panelBlur ?? 0;
        const panelRadiusValue = theme.panelRadius ?? 8;
        const modalRadiusValue = theme.modalRadius ?? 8;
        const notificationRadiusValue = theme.notificationRadius ?? 8;
        const windowControlsPosValue = theme.windowControlsPos ?? 'right';

        setCurrentThemeId(theme.id);
        skipPersistRef.current = true;
        setThemeColor(theme.themeColor || '#1f77f0');
        setBackgroundColor(theme.backgroundColor || '#0a0e27');
        setBackgroundOpacity(theme.backgroundOpacity ?? 1);
        setBackgroundImageUrlSafe(theme.backgroundImage || '');
        setBackgroundBlur(backgroundBlurValue);
        setPanelColor(theme.panelColor || '#1a1f3a');
        setPanelOpacity(theme.panelOpacity ?? 0.6);
        setPanelBlur(panelBlurValue);
        setPanelRadius(panelRadiusValue);
        setControlColor(theme.controlColor || theme.panelColor || '#2a2f4a');
        setControlOpacity(theme.controlOpacity ?? 1);
        setControlBlur(theme.controlBlur ?? 0);
        setTextColorPrimary(theme.textColorPrimary || '#ffffff');
        setTextColorSecondary(theme.textColorSecondary || '#909296');
        setFavoriteCardColor(theme.favoriteCardColor || theme.panelColor || '#2a2f4a');
        setCardOpacity(theme.cardOpacity ?? 0.5);
        setModalRadius(modalRadiusValue);
        setNotificationRadius(notificationRadiusValue);
        setComponentRadius(theme.componentRadius ?? 6);
        setCoverRadius(theme.coverRadius ?? 4);
        setModalColor(theme.modalColor || theme.panelColor || '#1a1f3a');
        setModalOpacity(theme.modalOpacity ?? 0.95);
        setModalBlur(theme.modalBlur ?? 10);
        setWindowControlsPos(windowControlsPosValue);
        setColorSchemeDraft(theme.colorScheme || 'dark');

        // 使用主题的 colorScheme 字段设置 Mantine 颜色方案
        const colorScheme = theme.colorScheme || 'dark';
        if (colorScheme === 'light' || colorScheme === 'dark') {
            setColorScheme(colorScheme as any);
        }
    }, [setCurrentThemeId, setColorScheme, setThemeColor, setBackgroundColor, setBackgroundOpacity, setBackgroundImageUrlSafe, setPanelColor, setPanelOpacity, setBackgroundBlur, setPanelBlur, setPanelRadius, setControlColor, setControlOpacity, setControlBlur, setTextColorPrimary, setTextColorSecondary, setFavoriteCardColor, setCardOpacity, setModalRadius, setNotificationRadius, setComponentRadius, setCoverRadius, setModalColor, setModalOpacity, setModalBlur, setWindowControlsPos, setColorSchemeDraft]);

    // 主题缓存辅助函数（提前定义，避免 TDZ）
    const saveCachedCustomThemes = useCallback((themesToCache: Theme[]) => {
        try {
            localStorage.setItem('half-beat.customThemes', JSON.stringify(themesToCache));
        } catch (e) {
            console.warn('保存自定义主题缓存失败', e);
        }
    }, []);

    // ========== Hook 实例（依赖上述状态） ==========
    const favoriteActions = useFavoriteActions({
        favorites,
        setFavorites,
        songs,
        setSongs,
        selectedFavId,
        setSelectedFavId,
        setStatus,
        isLoggedIn,
        themeColor,
        openModal,
        closeModal,
    });

    const currentFav = selectedFavId ? (favorites.find((f: Favorite) => f.id === selectedFavId) ?? null) : null;

    // 当前歌单的歌曲列表需在下方 hooks 使用前定义，避免 TDZ
    const currentFavSongs = currentFav
        ? songs.filter((s) => currentFav.songIds.some((ref: any) => ref.songId === s.id))
        : [];

    // 核心播放函数需在使用前定义，避免 TDZ
    const { playSong } = usePlaySong({
        queue,
        selectedFavId,
        setQueue,
        setCurrentIndex,
        setCurrentSong,
        setIsPlaying,
        setStatus,
        setSongs,
        playbackRetryRef,
    });

    const playlistActions = usePlaylistActions({
        queue,
        setQueue,
        currentIndex,
        setCurrentIndex,
        setCurrentSong,
        setIsPlaying,
        currentFav,
        favorites,
        setFavorites,
        setStatus,
        setConfirmRemoveSongId,
        openModal,
        closeModal,
        playSong,
    });

    const themeEditor = useThemeEditor({
        themes,
        setThemes,
        defaultThemes: DEFAULT_THEMES,
        currentThemeId,
        computedColorScheme,
        saveCachedCustomThemes,
        applyThemeToUi,
        getCustomThemesFromState,
        editingThemeId,
        setEditingThemeId,
        newThemeName,
        setNewThemeName,
        themeColorDraft,
        setThemeColorDraft,
        backgroundColorDraft,
        setBackgroundColorDraft,
        backgroundOpacityDraft,
        setBackgroundOpacityDraft,
        backgroundImageUrlDraft,
        setBackgroundImageUrlDraftSafe,
        backgroundBlurDraft,
        setBackgroundBlurDraft,
        panelColorDraft,
        setPanelColorDraft,
        panelOpacityDraft,
        setPanelOpacityDraft,
        panelBlurDraft,
        setPanelBlurDraft,
        panelRadiusDraft,
        setPanelRadiusDraft,
        controlColorDraft,
        setControlColorDraft,
        controlOpacityDraft,
        setControlOpacityDraft,
        controlBlurDraft,
        setControlBlurDraft,
        textColorPrimaryDraft,
        setTextColorPrimaryDraft,
        textColorSecondaryDraft,
        setTextColorSecondaryDraft,
        favoriteCardColorDraft,
        setFavoriteCardColorDraft,
        cardOpacityDraft,
        setCardOpacityDraft,
        modalRadiusDraft,
        setModalRadiusDraft,
        notificationRadiusDraft,
        setNotificationRadiusDraft,
        componentRadiusDraft,
        setComponentRadiusDraft,
        coverRadiusDraft,
        setCoverRadiusDraft,
        modalColorDraft,
        setModalColorDraft,
        modalOpacityDraft,
        setModalOpacityDraft,
        modalBlurDraft,
        setModalBlurDraft,
        windowControlsPosDraft,
        setWindowControlsPosDraft,
        colorSchemeDraft,
        setColorSchemeDraft,
        setSavingTheme,
        openModal,
        closeModal,
    });

    const bvModal = useBVModal({
        bvPreview,
        sliceStart,
        sliceEnd,
        bvSongName,
        bvSinger,
        bvTargetFavId,
        selectedFavId,
        favorites,
        songs,
        currentSong,
        themeColor,
        setBvModalOpen,
        setBvPreview,
        setBvSongName,
        setBvSinger,
        setSliceStart,
        setSliceEnd,
        setSongs,
        setFavorites,
        setSelectedFavId,
    });

    // 依赖 currentFav 的派生值需在使用前定义，避免 TDZ
    // 已前移至 hook 使用前定义

    const skipIntervalHandler = useSkipIntervalHandler({
        currentSong,
        setCurrentSong,
        setSongs,
        setQueue,
        saveTimerRef,
        intervalStart,
        intervalEnd,
        intervalLength,
    });

    const downloadManager = useDownloadManager({
        currentSong,
        currentFavSongs,
        downloadedSongIds,
        managingSong,
        setStatus,
        setDownloadedSongIds,
        setManagingSong,
        setConfirmDeleteDownloaded,
        openModal,
        closeModal,
    });

    // 播放模式（单曲/歌单）依赖 playSong
    const { playSingleSong, playFavorite } = usePlayModes({
        songs,
        queue,
        currentIndex,
        setQueue,
        setCurrentIndex,
        setCurrentSong,
        setIsPlaying,
        playSong,
    });

    // 音频源管理
    useAudioSourceManager({
        audioRef,
        currentSong,
        playingRef,
        playbackRetryRef,
        isPlaying,
        setIsPlaying,
    });

    // 搜索与 BV 解析（统一入口）
    const searchAndBV = useSearchAndBV({
        themeColor,
        selectedFavId,
        favorites,
        globalSearchTerm,
        setGlobalSearchTerm,
        setRemoteResults,
        setRemoteLoading,
        setBvPreview,
        setBvSongName,
        setBvSinger,
        setBvTargetFavId,
        setBvModalOpen,
        setResolvingBV,
        setIsLoggedIn,
        playSingleSong,
        playFavorite,
        setSelectedFavId,
        openModal,
        closeModal,
    });

    // 歌词管理
    const lyricManagement = useLyricManagement({
        currentSong,
        lyric,
        setLyric,
    });
    const { saveLyric, saveLyricOffset } = lyricManagement;

    // 播放控制
    const playbackControls = usePlaybackControls({
        audioRef,
        currentSong,
        currentIndex,
        queue,
        playMode,
        intervalStart,
        intervalEnd,
        setIsPlaying,
        setCurrentIndex,
        setCurrentSong,
        setVolume,
        playSong,
        playbackRetryRef,
        isHandlingErrorRef,
    });
    const { playNext, playPrev, togglePlay, changeVolume } = playbackControls;

    // 设置持久化
    const settingsPersistence = useSettingsPersistence({
        setting,
        playMode,
        volume,
        currentThemeId: currentThemeId || "",
        themeColor,
        backgroundColor,
        backgroundOpacity,
        backgroundImageUrl,
        panelColor,
        panelOpacity,
        panelBlur,
        panelRadius,
        controlColor,
        controlOpacity,
        textColorPrimary,
        textColorSecondary,
        favoriteCardColor,
        componentRadius,
        modalRadius,
        notificationRadius,
        coverRadius,
        windowControlsPos,
        setSetting,
        skipPersistRef,
    });
    const { persistSettings, settingsLoadedRef } = settingsPersistence;

    // 歌曲操作
    const songOperations = useSongOperations({
        currentSong,
        songs,
        favorites,
        setSongs,
        setCurrentSong,
        setFavorites,
        playSong,
    });
    const { addSong, updateStreamUrl, addCurrentToFavorite, updateSongInfo } = songOperations;

    // 播放列表自动保存
    usePlaylistPersistence({ queue, currentIndex });

    // 歌词自动加载
    useLyricLoader({ currentSong, setLyric });

    // 全局搜索
    const { globalSearchResults } = useGlobalSearch({
        globalSearchTerm,
        songs,
        favorites,
    });

    const { handleLoginSuccess } = useLoginHandlers({
        closeModal,
        setUserInfo: setUserInfo as any,
        setStatus,
    });

    // ========== 派生值和其他辅助函数 ==========
    // 播放区间相关派生值（从 useAudioInterval hook 获取）
    const maxSkipLimit = duration > 0 ? duration : 1;

    // Effect: 当主题改变时同步 Mantine 颜色方案
    useEffect(() => {
        if (!themes.length || !currentThemeId) return;
        // Mantine color scheme will be managed by the computedColorScheme
    }, [currentThemeId, themes]);

    useAppLifecycle({
        userInfo,
        setUserInfo,
        setIsLoggedIn,
        saveCachedCustomThemes,
        setSetting,
        setVolume,
        setPlayMode,
        setThemes,
        setCurrentThemeId,
        setThemeColor,
        setBackgroundColor,
        setBackgroundOpacity,
        setBackgroundImageUrlSafe,
        setPanelColor,
        setPanelOpacity,
        skipPersistRef,
        settingsLoadedRef,
        modalsSettingsModal: modals.settingsModal,
        setCacheSize,
        openModal,
        setStatus,
        setSongs,
        setFavorites,
        setQueue,
        setCurrentIndex,
        setCurrentSong,
        setSelectedFavId,
        setting,
    });

    useAppEffects({
        intervalStart,
        intervalEnd,
        intervalLength,
        intervalRef,
        currentSong,
        songs,
        setIsDownloaded,
        downloadedSongIds,
        setDownloadedSongIds,
        audioRef,
        prevSongIdRef,
    });

    // toRgba 已移至 useUiDerived

    const {
        backgroundWithOpacity, panelBackground, controlBackground, favoriteCardBackground, modalBackground, themeColorLight, panelStyles,
        controlStyles, modalStyles,
        componentRadius: derivedComponentRadius,
        coverRadius: derivedCoverRadius,
        modalRadius: derivedModalRadius,
        notificationRadius: derivedNotificationRadius,
        textColorPrimary: derivedTextColorPrimary,
        textColorSecondary: derivedTextColorSecondary,
    } = useUiDerived({
        themeColor,
        backgroundColor,
        backgroundOpacity,
        backgroundImageUrl,
        panelColor,
        panelOpacity,
        panelBlur,
        panelRadius,
        controlColor,
        controlOpacity,
        controlBlur,
        textColorPrimary,
        textColorSecondary,
        favoriteCardColor,
        cardOpacity,
        modalRadius,
        notificationRadius,
        componentRadius,
        coverRadius,
        modalColor,
        modalOpacity,
        modalBlur,
    });

    // 音频事件处理由 useAudioEvents Hook 统一管理
    useAudioEvents({
        audioRef,
        currentSong,
        queue,
        currentIndex,
        volume,
        playMode,
        isPlaying,
        intervalRef: intervalRef as React.MutableRefObject<{ start: number; end: number; length: number }>,
        setIsPlaying,
        setProgress,
        setDuration,
        setCurrentIndex,
        setCurrentSong,
        setStatus,
        playbackRetryRef,
        isHandlingErrorRef,
        upsertSongs: async (arg1: any[]) => {
            // Convert from frontend Song type to backend
            return Services.UpsertSongs(arg1);
        },
        playSong,
        playNext,
    });

    // ========== 提前定义 myFavoriteImport，避免 TDZ ==========
    const myFavoriteImport = favoriteActions.myFavoriteImport;

    // ========== 应用级 Handler 聚合（来自 useAppHandlers Hook）==========
    const handlers = useAppHandlers({
        // 主题编辑器
        themeEditor,
        editingThemeId,
        newThemeName,
        themeColorDraft,
        backgroundColorDraft,
        backgroundOpacityDraft,
        backgroundImageUrlDraft,
        backgroundBlurDraft,
        panelColorDraft,
        panelOpacityDraft,
        panelBlurDraft,
        panelRadiusDraft,
        controlColorDraft,
        controlOpacityDraft,
        controlBlurDraft,
        textColorPrimaryDraft,
        textColorSecondaryDraft,
        favoriteCardColorDraft,
        cardOpacityDraft,
        componentRadiusDraft,
        windowControlsPosDraft,
        colorSchemeDraft,
        setBackgroundImageUrlDraftSafe,
        // 收藏夹操作
        favoriteActions,
        editingFavId,
        editingFavName,
        setEditingFavId,
        setEditingFavName,
        createFavName,
        setCreateFavName,
        createFavMode,
        setCreateFavMode,
        duplicateSourceId,
        setDuplicateSourceId,
        importFid,
        setImportFid,
        openModal,
        setConfirmDeleteFavId,
        // 我的收藏导入
        myFavoriteImport,
        // 跳过区间处理
        skipIntervalHandler,
        // 歌曲更新
        updateStreamUrl,
        // 播放模式
        playMode,
        setPlayMode,
        // 下载管理
        downloadManager,
        setConfirmDeleteDownloaded,
        setManagingSong,
        closeModal,
        // 播放列表动作
        playlistActions,
        // 搜索与 BV
        searchAndBV,
        newFavName,
        setNewFavName,
        setFavorites,
        setBvTargetFavId,
        bvPreview,
        sliceStart,
        sliceEnd,
        setSliceStart,
        setSliceEnd,
        // 设置相关
        setUserInfo,
        saveCachedCustomThemes,
        setCacheSize,
        // BV 模态
        bvModal,
    });

    const {
        handleSelectTheme,
        handleViewTheme,
        handleEditTheme,
        handleDeleteTheme,
        handleCreateThemeClick,
        handleSubmitTheme,
        handleCloseThemeEditor,
        handleClearBackgroundImageDraft,
        handleBackgroundFileDraft,
        handleDeleteFavorite,
        handleEditFavorite,
        handleSaveEditFavorite,
        handleSubmitCreateFavorite,
        createFavorite,
        handleIntervalChange,
        handleSkipStartChange,
        handleSkipEndChange,
        handleStreamUrlChange,
        handlePlayModeToggle,
        handleDownload,
        handleDownloadCurrentSong,
        handleManageDownload,
        handleDownloadSong,
        handleDownloadAllFavorite,
        handleOpenDownloadedFile,
        handleDeleteDownloadedFile,
        handleDownloadModalClose,
        handleAddSongToFavorite,
        handleRemoveSongFromPlaylist,
        handleAddToFavoriteFromModal,
        handlePlaylistSelect,
        handlePlaylistReorder,
        handlePlaylistRemove,
        handleSearchResultClick,
        handleRemoteSearch,
        handleAddFromRemote,
        handleResolveBVAndAdd,
        handleSliceRangeChange,
        handleSliceStartChange,
        handleSliceEndChange,
        handleCreateFavoriteInModal,
        handleClearLoginCache,
        handleClearThemeCache,
        handleOpenDownloadsFolder,
        handleOpenDatabaseFile,
        handleClearMusicCache,
        handleClearAllCache,
        handleConfirmBVAdd,
    } = handlers;

    // 包装 handleLoginSuccess，在登陆成功后也清空收藏夹列表
    const onLoginSuccess = async () => {
        myFavoriteImport.clearCollections?.();
        await handleLoginSuccess();
    };

    const { topBarProps, mainLayoutProps, controlsPanelProps } = useAppPanelsProps({
        userInfo,
        hitokoto,
        setGlobalSearchTerm,
        openModal,
        setThemeColorDraft,
        setBackgroundColorDraft,
        setBackgroundOpacityDraft,
        setBackgroundImageUrlDraftSafe,
        setPanelColorDraft,
        setPanelOpacityDraft,
        themeColor,
        backgroundColor,
        backgroundOpacity,
        backgroundImageUrl,
        panelColor,
        panelOpacity,
        setUserInfo,
        setStatus,
        windowControlsPos,
        currentSong,
        panelBackground,
        panelStyles,
        controlBackground,
        controlStyles,
        favoriteCardBackground,
        textColorPrimary: derivedTextColorPrimary,
        textColorSecondary: derivedTextColorSecondary,
        componentRadius: derivedComponentRadius,
        coverRadius: derivedCoverRadius,
        computedColorScheme: (computedColorScheme === "auto" ? "light" : computedColorScheme) as "light" | "dark",
        placeholderCover: PLACEHOLDER_COVER,
        maxSkipLimit,
        formatTime,
        formatTimeWithMs,
        formatTimeLabel,
        parseTimeLabel,
        handleIntervalChange,
        handleSkipStartChange,
        handleSkipEndChange,
        handleStreamUrlChange,
        handleSongInfoUpdate: updateSongInfo,
        currentFav,
        currentFavSongs,
        searchQuery,
        setSearchQuery,
        playSong,
        addSong,
        downloadedSongIds,
        handleDownloadSong,
        handleAddSongToFavorite,
        handleRemoveSongFromPlaylist,
        confirmRemoveSongId,
        setConfirmRemoveSongId,
        playFavorite,
        handleDownloadAllFavorite,
        favorites,
        selectedFavId,
        setSelectedFavId,
        setConfirmDeleteFavId,
        playSingleSong,
        addCurrentToFavorite,
        createFavorite,
        handleEditFavorite,
        handleDeleteFavorite,
        confirmDeleteFavId,
        progressInInterval,
        intervalStart,
        intervalLength,
        duration,
        seek,
        playPrev,
        togglePlay,
        playNext,
        isPlaying,
        playMode,
        handlePlayModeToggle,
        handleDownloadCurrentSong,
        handleManageDownload,
        volume,
        changeVolume,
        songsCount: songs.length,
    });

    const filteredSongs = songs.filter((s) =>
        searchQuery === "" || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.singer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const backgroundStyle = useMemo(() => {
        return {
            backgroundColor: backgroundWithOpacity,
            backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "fixed" as const,
            filter: backgroundBlur > 0 ? `blur(${backgroundBlur}px)` : undefined,
            transform: "none", // 移除缩放，避免错位
        };
    }, [backgroundWithOpacity, backgroundImageUrl, backgroundBlur]);

    // 动态生成 Mantine 主题以支持圆角调整
    const mantineTheme = useMemo(() => createTheme({
        defaultRadius: derivedComponentRadius,
        black: derivedTextColorPrimary,
        white: "#ffffff",
        components: {
            Text: {
                defaultProps: {
                    color: derivedTextColorPrimary,
                },
            },
            Title: {
                defaultProps: {
                    color: derivedTextColorPrimary,
                },
            },
            Modal: {
                defaultProps: {
                    radius: derivedModalRadius,
                },
            },
            Menu: {
                defaultProps: {
                    radius: derivedModalRadius,
                },
            },
            Notification: {
                defaultProps: {
                    radius: derivedNotificationRadius,
                },
            },
        },
    }), [derivedComponentRadius, derivedModalRadius, derivedNotificationRadius, derivedTextColorPrimary]);

    // ========== 设置弹窗动作 ==========

    const appModalsProps: AppModalsProps = {
        modals,
        themes,
        currentThemeId,
        themeColor,
        themeColorLight,
        editingThemeId,
        newThemeName,
        themeColorDraft,
        backgroundColorDraft,
        backgroundOpacityDraft,
        backgroundImageUrlDraft,
        backgroundBlurDraft,
        panelColorDraft,
        panelOpacityDraft,
        panelBlurDraft,
        panelRadiusDraft,
        controlColorDraft,
        controlOpacityDraft,
        controlBlurDraft,
        textColorPrimaryDraft,
        textColorSecondaryDraft,
        favoriteCardColorDraft,
        cardOpacityDraft,
        modalRadiusDraft,
        notificationRadiusDraft,
        componentRadiusDraft,
        coverRadiusDraft,
        modalColorDraft,
        modalOpacityDraft,
        modalBlurDraft,
        windowControlsPosDraft,
        savingTheme,
        fileDraftInputRef,
        favorites,
        queue,
        currentIndex,
        currentSong,
        globalSearchTerm,
        globalSearchResults,
        remoteResults,
        remoteLoading,
        resolvingBV,
        bvModalOpen,
        bvPreview,
        bvTargetFavId,
        bvSongName,
        bvSinger,
        sliceStart,
        sliceEnd,
        newFavName,
        managingSong,
        confirmDeleteDownloaded,
        appVersion: APP_VERSION,
        cacheSize,
        createFavName,
        createFavMode,
        duplicateSourceId,
        importFid,
        myCollections: myFavoriteImport.myCollections,
        isLoadingCollections: myFavoriteImport.isLoading,
        selectedMyCollectionId: myFavoriteImport.selectedCollectionId,
        closeModal,
        onSelectTheme: handleSelectTheme,
        onViewTheme: handleViewTheme,
        onEditTheme: handleEditTheme,
        onDeleteTheme: handleDeleteTheme,
        onCreateTheme: handleCreateThemeClick,
        onThemeNameChange: setNewThemeName,
        onThemeColorChange: setThemeColorDraft,
        onBackgroundColorChange: setBackgroundColorDraft,
        onBackgroundOpacityChange: setBackgroundOpacityDraft,
        onBackgroundImageChange: setBackgroundImageUrlDraftSafe,
        onBackgroundBlurChange: setBackgroundBlurDraft,
        onClearBackgroundImage: handleClearBackgroundImageDraft,
        onPanelColorChange: setPanelColorDraft,
        onPanelOpacityChange: setPanelOpacityDraft,
        onPanelBlurChange: setPanelBlurDraft,
        onPanelRadiusChange: setPanelRadiusDraft,
        onControlColorChange: setControlColorDraft,
        onControlOpacityChange: setControlOpacityDraft,
        onControlBlurChange: setControlBlurDraft,
        onTextColorPrimaryChange: setTextColorPrimaryDraft,
        onTextColorSecondaryChange: setTextColorSecondaryDraft,
        onFavoriteCardColorChange: setFavoriteCardColorDraft,
        onCardOpacityChange: setCardOpacityDraft,
        onModalRadiusChange: setModalRadiusDraft,
        onNotificationRadiusChange: setNotificationRadiusDraft,
        onComponentRadiusChange: setComponentRadiusDraft,
        onCoverRadiusChange: setCoverRadiusDraft,
        onModalColorChange: setModalColorDraft,
        onModalOpacityChange: setModalOpacityDraft,
        onModalBlurChange: setModalBlurDraft,
        onWindowControlsPosChange: setWindowControlsPosDraft,
        colorSchemeDraft,
        onColorSchemeChange: setColorSchemeDraft,
        onSubmitTheme: handleSubmitTheme,
        onCancelThemeEdit: handleCloseThemeEditor,
        onBackgroundFileChange: handleBackgroundFileDraft,
        onAddToFavorite: handleAddToFavoriteFromModal,
        onPlaylistSelect: handlePlaylistSelect,
        onPlaylistReorder: handlePlaylistReorder,
        onPlaylistRemove: handlePlaylistRemove,
        editingFavName,
        onEditingFavNameChange: setEditingFavName,
        onSaveEditFavorite: handleSaveEditFavorite,
        onLoginSuccess: onLoginSuccess,
        onClearLoginCache: handleClearLoginCache,
        onClearThemeCache: handleClearThemeCache,
        onOpenDownloadsFolder: handleOpenDownloadsFolder,
        onOpenDatabaseFile: handleOpenDatabaseFile,
        onClearMusicCache: handleClearMusicCache,
        onClearAllCache: handleClearAllCache,
        onDownloadModalClose: handleDownloadModalClose,
        onOpenDownloadedFile: handleOpenDownloadedFile,
        onDeleteDownloadedFile: handleDeleteDownloadedFile,
        onToggleConfirmDelete: setConfirmDeleteDownloaded,
        onCreateFavoriteSubmit: handleSubmitCreateFavorite,
        onCreateFavModeChange: setCreateFavMode,
        onDuplicateSourceChange: setDuplicateSourceId,
        onImportFidChange: setImportFid,
        onCreateFavNameChange: setCreateFavName,
        onMyCollectionSelect: myFavoriteImport.setSelectedCollectionId,
        onFetchMyCollections: myFavoriteImport.fetchMyCollections,
        onGlobalTermChange: setGlobalSearchTerm,
        onResolveBVAndAdd: handleResolveBVAndAdd,
        onRemoteSearch: handleRemoteSearch,
        onResultClick: handleSearchResultClick,
        onAddFromRemote: handleAddFromRemote,
        onSliceRangeChange: handleSliceRangeChange,
        onSliceStartChange: handleSliceStartChange,
        onSliceEndChange: handleSliceEndChange,
        onSelectFavorite: setBvTargetFavId,
        onCreateFavoriteInBV: handleCreateFavoriteInModal,
        onFavNameChange: setNewFavName,
        onSongNameChange: setBvSongName,
        onSingerChange: setBvSinger,
        onConfirmBVAdd: handleConfirmBVAdd,
        onBvModalClose: () => setBvModalOpen(false),
        formatTime,
        formatTimeWithMs,
        panelStyles,
        derived: {
            panelBackground,
            controlBackground,
            favoriteCardBackground,
            textColorPrimary: derivedTextColorPrimary,
            textColorSecondary: derivedTextColorSecondary,
        }
    };

    return (
        <MantineProvider theme={mantineTheme}>
            <Box h="100vh" w="100vw" style={{ position: "relative", overflow: "hidden", backgroundColor: "transparent" }}>
                {/* 背景层 */}
                <Box
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: -1,
                        ...backgroundStyle,
                    }}
                />

                <AppModals {...appModalsProps} />

                <AppPanels
                    topBarProps={topBarProps}
                    mainLayoutProps={mainLayoutProps as any}
                    controlsPanelProps={controlsPanelProps as any}
                />
            </Box>
        </MantineProvider>
    );
};

export default App;
