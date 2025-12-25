import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Palette, Settings as SettingsIcon } from "lucide-react";
import { ActionIcon, AspectRatio, Badge, Box, Button, Group, Image, Modal, NumberInput, Paper, RangeSlider, ScrollArea, Select, Slider, Stack, Text, TextInput, useMantineColorScheme } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import * as Services from "../wailsjs/go/services/Service";
import { Favorite, LyricMapping, PlayerSetting, Song, Theme, SongClass } from "./types";
import ThemeManagerModal from "./components/ThemeManagerModal";
import ThemeEditorModal from "./components/ThemeEditorModal";
import SongDetailCard from "./components/SongDetailCard";
import CurrentPlaylistCard from "./components/CurrentPlaylistCard";
import FavoriteListCard from "./components/FavoriteListCard";
import PlayerBar from "./components/PlayerBar";
import AddToFavoriteModal from "./components/AddToFavoriteModal";
import PlaylistModal from "./components/PlaylistModal";
import LoginModal from "./components/LoginModal";
import { TopBar } from "./components/TopBar";
import MainLayout from "./components/MainLayout";
import ControlsPanel from "./components/ControlsPanel";
import CreateFavoriteModal from "./components/CreateFavoriteModal";
import GlobalSearchModal from "./components/GlobalSearchModal";
import SettingsModal from "./components/SettingsModal";
import DownloadManagerModal from "./components/DownloadManagerModal";
import BVAddModal from "./components/BVAddModal";
import AppPanels from "./components/AppPanels";

// Hooks
import { useAudioPlayer, usePlaylist, useAudioInterval, usePlaylistActions, useSkipIntervalHandler, useDownloadManager, useAudioEvents, usePlaybackControls, usePlaylistPersistence, useAudioSourceManager, usePlaySong, usePlayModes } from "./hooks/player";
import { useSongs, useFavorites, useSongCache, useSettingsPersistence } from "./hooks/data";
import { useAuth, useBVResolver, useFavoriteActions, useThemeEditor, useSearchAndBV, useBVModal, useLyricManagement, useSongOperations, useLyricLoader, useGlobalSearch, useLoginHandlers } from "./hooks/features";
import { useHitokoto, useUiDerived, useAppLifecycle, useAppEffects } from "./hooks/ui";
import { useAppPanelsProps } from "./hooks/ui/useAppPanelsProps";
// Contexts
import { useThemeContext, useModalContext } from "./context";

// Utils
import { formatTime, formatTimeLabel, parseTimeLabel } from "./utils/time";
import { APP_VERSION, PLACEHOLDER_COVER, DEFAULT_THEMES } from "./utils/constants";
import { compressImageToWebp, loadBackgroundFile } from "./utils/image";

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
        sliceStart, sliceEnd, isSlicePreviewing, slicePreviewPosition,
        setBvPreview, setBvModalOpen, setBvSongName, setBvSinger, setBvTargetFavId,
        setSliceStart, setSliceEnd, setIsSlicePreviewing, setSlicePreviewPosition,
        resolveBV, resetBVState
    } = bvResolver;

    const hitokoto = useHitokoto();

    // ========== Refs ==========
    const playingRef = useRef<string | null>(null);
    const playbackRetryRef = useRef<Map<string, number>>(new Map());
    const prevSongIdRef = useRef<string | null>(null);
    const sliceAudioRef = useRef<HTMLAudioElement | null>(null);
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
        setBackgroundImageUrlDraft(prev => (prev === url ? prev : url));
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
        isSlicePreviewing,
        bvSongName,
        bvSinger,
        bvTargetFavId,
        selectedFavId,
        favorites,
        songs,
        currentSong,
        themeColor,
        sliceAudioRef,
        setBvModalOpen,
        setBvPreview,
        setBvSongName,
        setBvSinger,
        setSliceStart,
        setSliceEnd,
        setIsSlicePreviewing,
        setSlicePreviewPosition,
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
        setIsDownloaded,
        setManagingSong,
        setConfirmDeleteDownloaded,
        openModal,
        closeModal,
    });

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

    // 音频事件处理（统一入口）
    useAudioEvents({
        audioRef,
        currentSong,
        queue,
        currentIndex,
        volume,
        intervalRef,
        setIsPlaying,
        setProgress,
        setDuration,
        setCurrentIndex,
        setCurrentSong,
        setStatus,
        playbackRetryRef,
        upsertSongs: Services.UpsertSongs,
        playSong,
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
    const { addSong, updateStreamUrl, addCurrentToFavorite } = songOperations;

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
        setDownloadedSongIds,
        audioRef,
        isPlaying,
        setIsPlaying,
        setStatus,
        playbackRetryRef,
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
        intervalRef,
        setIsPlaying,
        setProgress,
        setDuration,
        setCurrentIndex,
        setCurrentSong,
        setStatus,
        playbackRetryRef,
        upsertSongs: Services.UpsertSongs,
        playSong,
    });

    const handleBackgroundFileDraft = (e: React.ChangeEvent<HTMLInputElement>) => {
        void loadBackgroundFile(e, setBackgroundImageUrlDraftSafe);
    };

    const createFavorite = () => {
        setCreateFavName("新歌单");
        setCreateFavMode("blank");
        setDuplicateSourceId(null);
        setImportFid("");
        openModal("createFavModal");
    };

    const handleDeleteFavorite = (id: string) => favoriteActions.deleteFavorite(id, setConfirmDeleteFavId);

    const handleEditFavorite = (fav: Favorite) => favoriteActions.editFavorite(fav, setEditingFavId, setEditingFavName);

    const handleSaveEditFavorite = () => favoriteActions.saveEditFavorite(editingFavId, editingFavName);

    const handleSubmitCreateFavorite = () => favoriteActions.createFavorite({
        name: createFavName,
        mode: createFavMode,
        duplicateSourceId,
        importFid,
        selectedMyFavId: null, // TODO: 需要添加这个状态
    });



    const filteredSongs = songs.filter((s) =>
        searchQuery === "" || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.singer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const currentFavSongs = currentFav
        ? songs.filter((s) => currentFav.songIds.some((ref: any) => ref.songId === s.id))
        : [];



    const backgroundStyle = useMemo(() => ({
        overflow: "hidden",
        backgroundColor: backgroundWithOpacity,
        backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
    }), [backgroundWithOpacity, backgroundImageUrl]);
    // 已上移到前文并改为 useCallback 版本

    // ========== 主题管理函数（来自 useThemeEditor Hook）==========
    const handleSelectTheme = themeEditor.selectTheme;
    const handleEditTheme = themeEditor.editTheme;
    const handleDeleteTheme = themeEditor.deleteTheme;
    const handleCreateThemeClick = themeEditor.createThemeClick;
    const handleSubmitTheme = () => themeEditor.submitTheme(
        editingThemeId,
        newThemeName,
        colorSchemeDraft,
        themeColorDraft,
        backgroundColorDraft,
        backgroundOpacityDraft,
        backgroundImageUrlDraft,
        panelColorDraft,
        panelOpacityDraft
    );
    const handleCloseThemeEditor = themeEditor.closeThemeEditor;

    const handleClearBackgroundImageDraft = () => {
        console.log('handleClearBackgroundImageDraft 被调用，URL长度:', backgroundImageUrlDraft?.length || 0);
        // 注意：在 Wails 中 window.confirm 可能不工作，直接清除背景图
        console.log('开始清除背景图');
        setBackgroundImageUrlDraft("");
        console.log('背景图已设置为空字符串');
    };

    // ========== 播放区间处理函数（来自 useSkipIntervalHandler Hook）==========
    const handleIntervalChange = skipIntervalHandler.handleIntervalChange;
    const handleSkipStartChange = skipIntervalHandler.handleSkipStartChange;
    const handleSkipEndChange = skipIntervalHandler.handleSkipEndChange;

    const handleStreamUrlChange = (value: string) => {
        updateStreamUrl(value);
    };

    const handlePlayModeToggle = () => setPlayMode(playMode === "order" ? "random" : playMode === "random" ? "single" : "order");

    // ========== 下载管理函数（来自 useDownloadManager Hook）==========
    const handleDownload = downloadManager.handleDownload;
    const handleDownloadSong = downloadManager.handleDownloadSong;
    const handleDownloadAllFavorite = downloadManager.handleDownloadAllFavorite;
    const handleOpenDownloadedFile = downloadManager.handleOpenDownloadedFile;
    const handleDeleteDownloadedFile = downloadManager.handleDeleteDownloadedFile;

    const handleAddSongToFavorite = playlistActions.addSongToFavorite;

    const handleRemoveSongFromPlaylist = playlistActions.removeSongFromPlaylist;

    const handleAddToFavoriteFromModal = playlistActions.addToFavoriteFromModal;

    const handlePlaylistSelect = playlistActions.playlistSelect;

    const handlePlaylistReorder = playlistActions.playlistReorder;

    const handlePlaylistRemove = playlistActions.playlistRemove;

    // 来自 useSearchAndBV 的统一搜索/解析处理函数
    const handleSearchResultClick = searchAndBV.searchResultClick;
    const handleRemoteSearch = searchAndBV.remoteSearch;
    const handleAddFromRemote = searchAndBV.addFromRemote;
    const handleResolveBVAndAdd = searchAndBV.resolveBVAndAdd;

    const handleDownloadModalClose = () => {
        closeModal("downloadModal");
        setConfirmDeleteDownloaded(false);
        setManagingSong(null);
    };

    // ========== BV 添加弹窗动作 ==========
    const handleSliceRangeChange = (startVal: number, endVal: number) => {
        const limit = bvPreview?.duration && bvPreview.duration > 0 ? bvPreview.duration : Math.max(endVal, startVal);
        const safeStart = Math.max(0, Math.min(startVal, endVal, limit));
        const safeEnd = Math.max(safeStart, Math.min(endVal, limit));
        setSliceStart(safeStart);
        setSliceEnd(safeEnd);
        const nextPos = Math.min(Math.max(slicePreviewPosition, safeStart), safeEnd || safeStart);
        setSlicePreviewPosition(nextPos);
        if (isSlicePreviewing && sliceAudioRef.current) {
            sliceAudioRef.current.currentTime = nextPos;
        }
    };

    const handleSliceSliderChange = (value: number) => {
        const safe = Math.min(Math.max(value, sliceStart), Math.max(sliceEnd || sliceStart, sliceStart));
        setSlicePreviewPosition(safe);
        if (sliceAudioRef.current) {
            sliceAudioRef.current.currentTime = safe;
        }
    };

    const handleSliceStartChange = (value: number | string) => {
        const v = Number(value) || 0;
        const limit = bvPreview?.duration && bvPreview.duration > 0 ? bvPreview.duration : Math.max(sliceEnd, v);
        const safeStart = Math.max(0, Math.min(v, limit));
        const safeEnd = Math.max(safeStart, Math.min(sliceEnd, limit));
        setSliceStart(safeStart);
        setSliceEnd(safeEnd);
        const nextPos = Math.min(Math.max(slicePreviewPosition, safeStart), safeEnd || safeStart);
        setSlicePreviewPosition(nextPos);
        if (isSlicePreviewing && sliceAudioRef.current) {
            sliceAudioRef.current.currentTime = nextPos;
        }
    };

    const handleSliceEndChange = (value: number | string) => {
        const v = Number(value) || 0;
        const limit = bvPreview?.duration && bvPreview.duration > 0 ? bvPreview.duration : Math.max(v, sliceStart);
        const safeEnd = Math.max(sliceStart, Math.min(v, limit));
        setSliceEnd(safeEnd);
        const nextPos = Math.min(Math.max(slicePreviewPosition, sliceStart), safeEnd || sliceStart);
        setSlicePreviewPosition(nextPos);
        if (isSlicePreviewing && sliceAudioRef.current) {
            sliceAudioRef.current.currentTime = nextPos;
        }
    };

    const handleCreateFavoriteInModal = async () => {
        const name = newFavName.trim();
        if (!name) return;
        try {
            await Services.SaveFavorite({ id: '', title: name, songIds: [] } as any);
            const refreshedFavs = await Services.ListFavorites();
            setFavorites(refreshedFavs);
            const targetId = refreshedFavs.find((f) => f.title === name)?.id || refreshedFavs[refreshedFavs.length - 1]?.id || null;
            setBvTargetFavId(targetId);
            notifications.show({ title: '已创建歌单', message: name, color: 'green' });
            setNewFavName('');
        } catch (error) {
            notifications.show({ title: '创建歌单失败', message: String(error), color: 'red' });
        }
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
        currentSong,
        panelBackground,
        computedColorScheme,
        placeholderCover: PLACEHOLDER_COVER,
        maxSkipLimit,
        formatTime,
        formatTimeLabel,
        parseTimeLabel,
        handleIntervalChange,
        handleSkipStartChange,
        handleSkipEndChange,
        handleStreamUrlChange,
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
        handleDownload,
        isDownloaded,
        volume,
        changeVolume,
        songsCount: songs.length,
    });

    // ========== 设置弹窗动作 ==========
    const handleClearLoginCache = async () => {
        try {
            await Services.Logout();
        } catch { }
        try {
            localStorage.removeItem("tomorin.userInfo");
        } catch { }
        setUserInfo(null);
        notifications.show({ title: "已清除登录缓存", message: "需要重新扫码登录", color: "green" });
    };

    const handleClearThemeCache = () => {
        try {
            // 置空主题缓存，促使下次加载走远端
            localStorage.removeItem("tomorin.customThemes");
            saveCachedCustomThemes([]);
        } catch { }
        notifications.show({ title: "已清除主题缓存", message: "已重置到默认主题", color: "green" });
    };

    const handleOpenDownloadsFolder = async () => {
        try {
            await Services.OpenDownloadsFolder();
        } catch (e: any) {
            notifications.show({ title: "打开失败", message: e?.message ?? String(e), color: "red" });
        }
    };

    const handleClearMusicCache = async () => {
        try {
            await Services.ClearAudioCache();
            setCacheSize(0);
            notifications.show({ title: "已清除音乐缓存", message: "已删除所有离线音乐文件", color: "green" });
        } catch (e) {
            notifications.show({ title: "清除缓存失败", message: e instanceof Error ? e.message : "未知错误", color: "red" });
        }
    };

    const handleClearAllCache = async () => {
        try {
            await Services.Logout();
        } catch { }
        try {
            localStorage.clear();
        } catch { }
        setCacheSize(0);
        setUserInfo(null);
        notifications.show({ title: "已清除所有缓存", message: "请重新配置与登录", color: "green" });
    };

    // ========== BV 模态框相关函数（来自 useBVModal Hook）==========
    const handleSlicePreviewPlay = bvModal.handleSlicePreviewPlay;
    const handleConfirmBVAdd = bvModal.handleConfirmBVAdd;

    useEffect(() => {
        if (!bvPreview) return;
        const duration = bvPreview.duration && bvPreview.duration > 0 ? bvPreview.duration : 0;
        setSliceStart(0);
        setSliceEnd(duration || 0);
        setSlicePreviewPosition(0);
        if (sliceAudioRef.current && bvPreview.url) {
            sliceAudioRef.current.src = bvPreview.url;
        }
    }, [bvPreview]);

    useEffect(() => {
        const audio = sliceAudioRef.current;
        if (!audio) return;
        const onTime = () => {
            if (isSlicePreviewing && sliceEnd > 0 && audio.currentTime >= sliceEnd - 0.05) {
                audio.pause();
                setIsSlicePreviewing(false);
            }
            setSlicePreviewPosition(audio.currentTime || 0);
        };
        audio.addEventListener("timeupdate", onTime);
        return () => {
            audio.removeEventListener("timeupdate", onTime);
        };
    }, [isSlicePreviewing, sliceEnd]);

    useEffect(() => {
        if (!isSlicePreviewing) return;
        const audio = sliceAudioRef.current;
        if (audio) {
            audio.currentTime = Math.max(0, sliceStart);
        }
    }, [sliceStart, isSlicePreviewing]);

    useEffect(() => {
        if (bvModalOpen) return;
        const audio = sliceAudioRef.current;
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
        setIsSlicePreviewing(false);
        setSlicePreviewPosition(0);
    }, [bvModalOpen]);

    return (
        <Box h="100vh" w="100vw" style={backgroundStyle}>
            {/* 顶部右侧设置按钮移动到工具栏，避免与主题按钮重叠 */}
            <ThemeManagerModal
                opened={modals.themeModal}
                onClose={() => closeModal("themeModal")}
                themes={themes}
                currentThemeId={currentThemeId}
                onSelectTheme={handleSelectTheme}
                onEditTheme={handleEditTheme}
                onDeleteTheme={handleDeleteTheme}
                onCreateTheme={handleCreateThemeClick}
                accentColor={themeColor}
            />

            <ThemeEditorModal
                opened={modals.themeEditorModal}
                onClose={handleCloseThemeEditor}
                onCancel={handleCloseThemeEditor}
                editingThemeId={editingThemeId}
                newThemeName={newThemeName}
                onNameChange={setNewThemeName}
                colorSchemeDraft={colorSchemeDraft}
                onColorSchemeChange={setColorSchemeDraft}
                themeColorDraft={themeColorDraft}
                onThemeColorChange={setThemeColorDraft}
                backgroundColorDraft={backgroundColorDraft}
                onBackgroundColorChange={setBackgroundColorDraft}
                backgroundOpacityDraft={backgroundOpacityDraft}
                onBackgroundOpacityChange={setBackgroundOpacityDraft}
                backgroundImageUrlDraft={backgroundImageUrlDraft}
                onBackgroundImageChange={setBackgroundImageUrlDraftSafe}
                onClearBackgroundImage={handleClearBackgroundImageDraft}
                panelColorDraft={panelColorDraft}
                onPanelColorChange={setPanelColorDraft}
                panelOpacityDraft={panelOpacityDraft}
                onPanelOpacityChange={setPanelOpacityDraft}
                onSubmit={handleSubmitTheme}
                savingTheme={savingTheme}
                fileInputRef={fileDraftInputRef}
                onBackgroundFileChange={handleBackgroundFileDraft}
            />

            <AddToFavoriteModal
                opened={modals.addFavoriteModal}
                onClose={() => closeModal("addFavoriteModal")}
                favorites={favorites}
                currentSong={currentSong}
                themeColor={themeColor}
                onAdd={handleAddToFavoriteFromModal}
            />

            <PlaylistModal
                opened={modals.playlistModal}
                onClose={() => closeModal("playlistModal")}
                queue={queue}
                currentIndex={currentIndex}
                themeColorHighlight={themeColorLight}
                onSelect={handlePlaylistSelect}
                onReorder={handlePlaylistReorder}
                onRemove={handlePlaylistRemove}
            />

            <Modal
                opened={modals.editFavModal}
                onClose={() => closeModal("editFavModal")}
                title="编辑歌单"
                centered
                size="sm"
            >
                <Stack gap="md">
                    <TextInput
                        label="歌单名称"
                        value={editingFavName}
                        onChange={(e) => setEditingFavName(e.currentTarget.value)}
                        placeholder="输入歌单名称"
                    />
                    <Group justify="flex-end" gap="sm">
                        <Button variant="subtle" color={themeColor} onClick={() => closeModal("editFavModal")}>
                            取消
                        </Button>
                        <Button color={themeColor} onClick={handleSaveEditFavorite}>
                            保存
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <LoginModal
                opened={modals.loginModal}
                onClose={() => closeModal("loginModal")}
                onLoginSuccess={handleLoginSuccess}
            />

            <SettingsModal
                opened={modals.settingsModal}
                onClose={() => closeModal("settingsModal")}
                themeColor={themeColor}
                appVersion={APP_VERSION}
                cacheSize={cacheSize}
                onClearLoginCache={handleClearLoginCache}
                onClearThemeCache={handleClearThemeCache}
                onOpenDownloadsFolder={handleOpenDownloadsFolder}
                onClearMusicCache={handleClearMusicCache}
                onClearAllCache={handleClearAllCache}
            />

            <DownloadManagerModal
                opened={modals.downloadModal}
                managingSong={managingSong}
                confirmDeleteDownloaded={confirmDeleteDownloaded}
                onClose={handleDownloadModalClose}
                onOpenFile={handleOpenDownloadedFile}
                onDeleteFile={handleDeleteDownloadedFile}
                onToggleConfirmDelete={setConfirmDeleteDownloaded}
            />

            <CreateFavoriteModal
                opened={modals.createFavModal}
                onClose={() => closeModal("createFavModal")}
                themeColor={themeColor}
                favorites={favorites}
                createFavName={createFavName}
                createFavMode={createFavMode}
                duplicateSourceId={duplicateSourceId}
                importFid={importFid}
                onNameChange={setCreateFavName}
                onModeChange={(mode) => setCreateFavMode(mode)}
                onDuplicateSourceChange={setDuplicateSourceId}
                onImportFidChange={setImportFid}
                onSubmit={handleSubmitCreateFavorite}
            />

            <GlobalSearchModal
                opened={modals.globalSearchModal}
                onClose={() => closeModal("globalSearchModal")}
                themeColor={themeColor}
                globalSearchTerm={globalSearchTerm}
                globalSearchResults={globalSearchResults}
                remoteResults={remoteResults}
                remoteLoading={remoteLoading}
                resolvingBV={resolvingBV}
                onTermChange={setGlobalSearchTerm}
                onResolveBVAndAdd={handleResolveBVAndAdd}
                onRemoteSearch={handleRemoteSearch}
                onResultClick={handleSearchResultClick}
                onAddFromRemote={handleAddFromRemote}
            />

            <BVAddModal
                opened={bvModalOpen}
                themeColor={themeColor}
                bvPreview={bvPreview}
                favorites={favorites}
                bvTargetFavId={bvTargetFavId}
                newFavName={newFavName}
                bvSongName={bvSongName}
                bvSinger={bvSinger}
                sliceStart={sliceStart}
                sliceEnd={sliceEnd}
                slicePreviewPosition={slicePreviewPosition}
                isSlicePreviewing={isSlicePreviewing}
                sliceAudioRef={sliceAudioRef}
                onClose={() => setBvModalOpen(false)}
                onSliceRangeChange={handleSliceRangeChange}
                onSliceSliderChange={handleSliceSliderChange}
                onSliceStartChange={handleSliceStartChange}
                onSliceEndChange={handleSliceEndChange}
                onSlicePreviewPlay={handleSlicePreviewPlay}
                onSelectFavorite={setBvTargetFavId}
                onCreateFavorite={handleCreateFavoriteInModal}
                onFavNameChange={setNewFavName}
                onSongNameChange={setBvSongName}
                onSingerChange={setBvSinger}
                onConfirmAdd={handleConfirmBVAdd}
                formatTime={formatTime}
            />

            <AppPanels
                topBarProps={topBarProps}
                mainLayoutProps={mainLayoutProps}
                controlsPanelProps={controlsPanelProps}
            />
        </Box>
    );
};

export default App;
