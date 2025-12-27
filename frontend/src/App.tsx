import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, useMantineColorScheme } from "@mantine/core";
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
import { formatTime, formatTimeLabel, parseTimeLabel } from "./utils/time";
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
        backgroundImageUrl, panelColor, panelOpacity, computedColorScheme,
    } = themeState;
    const {
        setThemes, setCurrentThemeId, setThemeColor, setBackgroundColor,
        setBackgroundOpacity, setBackgroundImageUrl, setPanelColor, setPanelOpacity,
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

    const skipPersistRef = useRef(false);
    const fileDraftInputRef = useRef<HTMLInputElement | null>(null);
    // 定时保存防抖器（key -> timerId）
    const saveTimerRef = useRef<Map<string, number>>(new Map());

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
    const [colorSchemeDraft, setColorSchemeDraft] = useState<"light" | "dark">("light");
    const [themeColorDraft, setThemeColorDraft] = useState<string>("#228be6");
    const [backgroundColorDraft, setBackgroundColorDraft] = useState<string>(computedColorScheme === "dark" ? "#0b1021" : "#f8fafc");
    const [backgroundOpacityDraft, setBackgroundOpacityDraft] = useState<number>(1);
    const [backgroundImageUrlDraft, setBackgroundImageUrlDraft] = useState<string>("");
    const [panelOpacityDraft, setPanelOpacityDraft] = useState<number>(0.92);
    const [panelColorDraft, setPanelColorDraft] = useState<string>("#ffffff");
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
        setCurrentThemeId(theme.id);
        if (theme.colorScheme) {
            setColorScheme(theme.colorScheme as "light" | "dark");
        }
        skipPersistRef.current = true;
        setThemeColor(theme.themeColor);
        setBackgroundColor(theme.backgroundColor);
        setBackgroundOpacity(theme.backgroundOpacity);
        setBackgroundImageUrlSafe(theme.backgroundImage);
        setPanelColor(theme.panelColor);
        setPanelOpacity(theme.panelOpacity);
    }, [setCurrentThemeId, setColorScheme, setThemeColor, setBackgroundColor, setBackgroundOpacity, setBackgroundImageUrlSafe, setPanelColor, setPanelOpacity]);

    // 主题缓存辅助函数（提前定义，避免 TDZ）
    const saveCachedCustomThemes = useCallback((themesToCache: Theme[]) => {
        try {
            localStorage.setItem('customThemes', JSON.stringify(themesToCache));
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
        themeColorDraft,
        computedColorScheme,
        saveCachedCustomThemes,
        applyThemeToUi,
        getCustomThemesFromState,
        setEditingThemeId,
        setNewThemeName,
        setColorSchemeDraft,
        setThemeColorDraft,
        setBackgroundColorDraft,
        setBackgroundOpacityDraft,
        setBackgroundImageUrlDraftSafe,
        setPanelColorDraft,
        setPanelOpacityDraft,
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
        queue,
        playingRef,
        playbackRetryRef,
        isPlaying,
        setIsPlaying,
        setStatus,
        playSong,
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
        currentThemeId,
        themeColor,
        backgroundColor,
        backgroundOpacity,
        backgroundImageUrl,
        panelOpacity,
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
        setUserInfo,
        setStatus,
    });

    // ========== 派生值和其他辅助函数 ==========
    // 播放区间相关派生值（从 useAudioInterval hook 获取）
    const maxSkipLimit = duration > 0 ? duration : 1;

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

    const { backgroundWithOpacity, panelBackground, themeColorLight } = useUiDerived({
        themeColor,
        backgroundColor,
        backgroundOpacity,
        panelColor,
        panelOpacity,
    });

    // 音频事件处理由 useAudioEvents Hook 统一管理
    useAudioEvents({
        audioRef,
        currentSong,
        queue,
        currentIndex,
        volume,
        playMode,
        intervalRef,
        setIsPlaying,
        setProgress,
        setDuration,
        setCurrentIndex,
        setCurrentSong,
        setStatus,
        playbackRetryRef,
        isHandlingErrorRef,
        upsertSongs: Services.UpsertSongs,
        playSong,
        playNext,
    });

    // ========== 应用级 Handler 聚合（来自 useAppHandlers Hook）==========
    const handlers = useAppHandlers({
        // 主题编辑器
        themeEditor,
        editingThemeId,
        newThemeName,
        colorSchemeDraft,
        themeColorDraft,
        backgroundColorDraft,
        backgroundOpacityDraft,
        backgroundImageUrlDraft,
        panelColorDraft,
        panelOpacityDraft,
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
        handleClearMusicCache,
        handleClearAllCache,
        handleConfirmBVAdd,
    } = handlers;

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
        currentSong,
        panelBackground,
        computedColorScheme: (computedColorScheme === "auto" ? "light" : computedColorScheme) as "light" | "dark",
        placeholderCover: PLACEHOLDER_COVER,
        maxSkipLimit,
        formatTime,
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
            overflow: "hidden",
            backgroundColor: backgroundWithOpacity,
            backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
        };
    }, [backgroundWithOpacity, backgroundImageUrl]);

    // ========== 设置弹窗动作 ==========

    const myFavoriteImport = favoriteActions.myFavoriteImport;

    const appModalsProps: AppModalsProps = {
        modals,
        themes,
        currentThemeId,
        themeColor,
        themeColorLight,
        editingThemeId,
        newThemeName,
        colorSchemeDraft,
        themeColorDraft,
        backgroundColorDraft,
        backgroundOpacityDraft,
        backgroundImageUrlDraft,
        panelColorDraft,
        panelOpacityDraft,
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
        onEditTheme: handleEditTheme,
        onDeleteTheme: handleDeleteTheme,
        onCreateTheme: handleCreateThemeClick,
        onThemeNameChange: setNewThemeName,
        onColorSchemeChange: setColorSchemeDraft,
        onThemeColorChange: setThemeColorDraft,
        onBackgroundColorChange: setBackgroundColorDraft,
        onBackgroundOpacityChange: setBackgroundOpacityDraft,
        onBackgroundImageChange: setBackgroundImageUrlDraftSafe,
        onClearBackgroundImage: handleClearBackgroundImageDraft,
        onPanelColorChange: setPanelColorDraft,
        onPanelOpacityChange: setPanelOpacityDraft,
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
        onLoginSuccess: handleLoginSuccess,
        onClearLoginCache: handleClearLoginCache,
        onClearThemeCache: handleClearThemeCache,
        onOpenDownloadsFolder: handleOpenDownloadsFolder,
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
    };

    return (
        <Box
            h="100vh"
            w="100vw"
            style={{
                ...backgroundStyle,
                backgroundAttachment: 'fixed',  // 固定背景不滚动
            }}
        >
            <AppModals {...appModalsProps} />

            <AppPanels
                topBarProps={topBarProps}
                mainLayoutProps={mainLayoutProps}
                controlsPanelProps={controlsPanelProps}
            />
        </Box>
    );
};

export default App;
