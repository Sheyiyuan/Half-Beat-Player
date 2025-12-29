import React from "react";
import { Favorite } from "../../types";
import { notifications } from "@mantine/notifications";
import * as Services from "../../../wailsjs/go/services/Service";
import { loadBackgroundFile } from "../../utils/image";

/**
 * useAppHandlers: 聚合应用级别的事件处理函数
 * 大幅减少 App.tsx 中的 handler 定义数量
 */
export const useAppHandlers = (config: {
    // 主题编辑器
    themeEditor: any;
    editingThemeId: string | null;
    newThemeName: string;
    themeColorDraft: string;
    backgroundColorDraft: string;
    backgroundOpacityDraft: number;
    backgroundImageUrlDraft: string;
    backgroundBlurDraft: number;
    panelColorDraft: string;
    panelOpacityDraft: number;
    panelBlurDraft: number;
    panelRadiusDraft: number;
    controlColorDraft: string;
    controlOpacityDraft: number;
    controlBlurDraft: number;
    textColorPrimaryDraft: string;
    textColorSecondaryDraft: string;
    favoriteCardColorDraft: string;
    cardOpacityDraft: number;
    componentRadiusDraft: number;
    windowControlsPosDraft: string;
    setBackgroundImageUrlDraftSafe: (url: string) => void;
    setBackgroundBlurDraft?: (blur: number) => void;
    setPanelBlurDraft?: (blur: number) => void;
    setPanelRadiusDraft?: (radius: number) => void;
    setComponentRadiusDraft?: (radius: number) => void;
    setWindowControlsPosDraft?: (pos: string) => void;

    // 收藏夹操作
    favoriteActions: any;
    editingFavId: string | null;
    editingFavName: string;
    setEditingFavId: (id: string | null) => void;
    setEditingFavName: (name: string) => void;
    createFavName: string;
    setCreateFavName: (name: string) => void;
    createFavMode: "blank" | "duplicate" | "importMine" | "importFid";
    setCreateFavMode: (mode: "blank" | "duplicate" | "importMine" | "importFid") => void;
    duplicateSourceId: string | null;
    setDuplicateSourceId: (id: string | null) => void;
    importFid: string;
    setImportFid: (fid: string) => void;
    openModal: (name: any) => void;
    setConfirmDeleteFavId: (id: string | null) => void;

    // 我的收藏导入
    myFavoriteImport?: { clearCollections?: () => void };

    // 跳过区间处理
    skipIntervalHandler: any;

    // 歌曲更新
    updateStreamUrl: (url: string) => void;

    // 播放模式
    playMode: "loop" | "random" | "single";
    setPlayMode: (mode: "loop" | "random" | "single") => void;

    // 下载管理
    downloadManager: any;
    setConfirmDeleteDownloaded: (confirm: boolean) => void;
    setManagingSong: (song: any) => void;
    closeModal: (name: any) => void;

    // 播放列表动作
    playlistActions: any;

    // 搜索与 BV
    searchAndBV: any;
    newFavName: string;
    setNewFavName: (name: string) => void;
    setFavorites: (favs: any[]) => void;
    setBvTargetFavId: (id: string | null) => void;
    bvPreview: any;
    sliceStart: number;
    sliceEnd: number;
    setSliceStart: (start: number) => void;
    setSliceEnd: (end: number) => void;

    // 设置相关
    setUserInfo: (info: any) => void;
    saveCachedCustomThemes: (themes: any[]) => void;
    setCacheSize: (size: number) => void;

    // BV 模态
    bvModal: any;
}) => {
    const {
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
        setBackgroundImageUrlDraftSafe,
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
        skipIntervalHandler,
        updateStreamUrl,
        playMode,
        setPlayMode,
        downloadManager,
        setConfirmDeleteDownloaded,
        setManagingSong,
        closeModal,
        playlistActions,
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
        setUserInfo,
        saveCachedCustomThemes,
        setCacheSize,
        bvModal,
    } = config;

    // ========== 主题处理 ==========
    const handleSelectTheme = themeEditor.selectTheme;
    const handleViewTheme = themeEditor.viewTheme;
    const handleEditTheme = themeEditor.editTheme;
    const handleDeleteTheme = themeEditor.deleteTheme;
    const handleCreateThemeClick = themeEditor.createThemeClick;
    const handleSubmitTheme = () => themeEditor.submitTheme();
    const handleCloseThemeEditor = themeEditor.closeThemeEditor;
    const handleClearBackgroundImageDraft = () => setBackgroundImageUrlDraftSafe("");
    const handleBackgroundFileDraft = (e: React.ChangeEvent<HTMLInputElement>) => {
        void loadBackgroundFile(e, setBackgroundImageUrlDraftSafe);
    };

    // ========== 收藏夹处理 ==========
    const handleDeleteFavorite = (id: string) =>
        favoriteActions.deleteFavorite(id, setConfirmDeleteFavId);
    const handleEditFavorite = (fav: Favorite) =>
        favoriteActions.editFavorite(fav, setEditingFavId, setEditingFavName);
    const handleSaveEditFavorite = () =>
        favoriteActions.saveEditFavorite(editingFavId, editingFavName);
    const handleSubmitCreateFavorite = () =>
        favoriteActions.createFavorite({
            name: createFavName,
            mode: createFavMode,
            duplicateSourceId,
            importFid,
            selectedMyFavId: favoriteActions.myFavoriteImport.selectedCollectionId,
        });

    const createFavorite = () => {
        setCreateFavName("新歌单");
        setCreateFavMode("blank");
        setDuplicateSourceId(null);
        setImportFid("");
        openModal("createFavModal");
    };

    // ========== 播放区间处理 ==========
    const handleIntervalChange = skipIntervalHandler.handleIntervalChange;
    const handleSkipStartChange = skipIntervalHandler.handleSkipStartChange;
    const handleSkipEndChange = skipIntervalHandler.handleSkipEndChange;

    const handleStreamUrlChange = (value: string) => {
        updateStreamUrl(value);
    };

    // ========== 播放模式 ==========
    const handlePlayModeToggle = () => {
        const newMode =
            playMode === "loop" ? "random" : playMode === "random" ? "single" : "loop";
        setPlayMode(newMode);
    };

    // ========== 下载管理 ==========
    const handleDownload = downloadManager.handleDownload;
    const handleDownloadCurrentSong = downloadManager.handleDownloadCurrentSong;
    const handleManageDownload = downloadManager.handleManageDownload;
    const handleDownloadSong = downloadManager.handleDownloadSong;
    const handleDownloadAllFavorite = downloadManager.handleDownloadAllFavorite;
    const handleOpenDownloadedFile = downloadManager.handleOpenDownloadedFile;
    const handleDeleteDownloadedFile = downloadManager.handleDeleteDownloadedFile;

    const handleDownloadModalClose = () => {
        closeModal("downloadModal");
        setConfirmDeleteDownloaded(false);
        setManagingSong(null);
    };

    // ========== 播放列表处理 ==========
    const handleAddSongToFavorite = playlistActions.addSongToFavorite;
    const handleRemoveSongFromPlaylist = playlistActions.removeSongFromPlaylist;
    const handleAddToFavoriteFromModal = playlistActions.addToFavoriteFromModal;
    const handlePlaylistSelect = playlistActions.playlistSelect;
    const handlePlaylistReorder = playlistActions.playlistReorder;
    const handlePlaylistRemove = playlistActions.playlistRemove;

    // ========== 搜索与 BV ==========
    const handleSearchResultClick = searchAndBV.searchResultClick;
    const handleRemoteSearch = searchAndBV.remoteSearch;
    const handleAddFromRemote = searchAndBV.addFromRemote;
    const handleResolveBVAndAdd = searchAndBV.resolveBVAndAdd;

    // ========== BV 切片处理 ==========
    const handleSliceRangeChange = (startVal: number, endVal: number) => {
        const limit =
            bvPreview?.duration && bvPreview.duration > 0
                ? bvPreview.duration
                : Math.max(endVal, startVal);
        const roundedStart = Math.round(startVal * 20) / 20;
        const roundedEnd = Math.round(endVal * 20) / 20;
        const safeStart = Math.max(0, Math.min(roundedStart, roundedEnd, limit));
        const safeEnd = Math.max(safeStart, Math.min(roundedEnd, limit));
        setSliceStart(safeStart);
        setSliceEnd(safeEnd);
    };

    const handleSliceStartChange = (value: number | string) => {
        const v = Math.round((Number(value) || 0) * 20) / 20;
        const limit =
            bvPreview?.duration && bvPreview.duration > 0
                ? bvPreview.duration
                : Math.max(sliceEnd, v);
        const safeStart = Math.max(0, Math.min(v, limit));
        const safeEnd = Math.max(safeStart, Math.min(sliceEnd, limit));
        setSliceStart(safeStart);
        setSliceEnd(safeEnd);
    };

    const handleSliceEndChange = (value: number | string) => {
        const v = Math.round((Number(value) || 0) * 20) / 20;
        const limit =
            bvPreview?.duration && bvPreview.duration > 0
                ? bvPreview.duration
                : Math.max(v, sliceStart);
        const safeEnd = Math.max(sliceStart, Math.min(v, limit));
        setSliceEnd(safeEnd);
    };

    const handleCreateFavoriteInModal = async () => {
        const name = newFavName.trim();
        if (!name) return;
        try {
            await Services.SaveFavorite({ id: "", title: name, songIds: [] } as any);
            const refreshedFavs = await Services.ListFavorites();
            setFavorites(refreshedFavs);
            const targetId =
                refreshedFavs.find((f) => f.title === name)?.id ||
                refreshedFavs[refreshedFavs.length - 1]?.id ||
                null;
            setBvTargetFavId(targetId);
            notifications.show({
                title: "已创建歌单",
                message: name,
                color: "green",
            });
            setNewFavName("");
        } catch (error) {
            notifications.show({
                title: "创建歌单失败",
                message: String(error),
                color: "red",
            });
        }
    };

    // ========== 设置弹窗 ==========
    const handleClearLoginCache = async () => {
        try {
            await Services.Logout();
        } catch { }
        try {
            localStorage.removeItem("half-beat.userInfo");
        } catch { }
        // 清空我的收藏夹列表缓存
        config.myFavoriteImport?.clearCollections?.();
        setUserInfo(null);
        notifications.show({
            title: "已清除登录缓存",
            message: "需要重新扫码登录",
            color: "green",
        });
    };

    const handleClearThemeCache = () => {
        try {
            localStorage.removeItem("half-beat.customThemes");
            saveCachedCustomThemes([]);
        } catch { }
        notifications.show({
            title: "已清除主题缓存",
            message: "已重置到默认主题",
            color: "green",
        });
    };

    const handleOpenDownloadsFolder = async () => {
        try {
            await Services.OpenDownloadsFolder();
        } catch (e: any) {
            notifications.show({
                title: "打开失败",
                message: e?.message ?? String(e),
                color: "red",
            });
        }
    };

    const handleOpenDatabaseFile = async () => {
        try {
            await Services.OpenDatabaseFile();
        } catch (e: any) {
            notifications.show({
                title: "打开失败",
                message: e?.message ?? String(e),
                color: "red",
            });
        }
    };

    const handleClearMusicCache = async () => {
        try {
            await Services.ClearAudioCache();
            setCacheSize(0);
            notifications.show({
                title: "已清除音乐缓存",
                message: "已删除所有离线音乐文件",
                color: "green",
            });
        } catch (e) {
            notifications.show({
                title: "清除缓存失败",
                message: e instanceof Error ? e.message : "未知错误",
                color: "red",
            });
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
        notifications.show({
            title: "已清除所有缓存",
            message: "请重新配置与登录",
            color: "green",
        });
    };

    // ========== BV 模态 ==========
    const handleConfirmBVAdd = bvModal.handleConfirmBVAdd;

    return {
        // 主题
        handleSelectTheme,
        handleViewTheme,
        handleEditTheme,
        handleDeleteTheme,
        handleCreateThemeClick,
        handleSubmitTheme,
        handleCloseThemeEditor,
        handleClearBackgroundImageDraft,
        handleBackgroundFileDraft,
        // 收藏夹
        handleDeleteFavorite,
        handleEditFavorite,
        handleSaveEditFavorite,
        handleSubmitCreateFavorite,
        createFavorite,
        // 播放区间
        handleIntervalChange,
        handleSkipStartChange,
        handleSkipEndChange,
        handleStreamUrlChange,
        // 播放模式
        handlePlayModeToggle,
        // 下载
        handleDownload,
        handleDownloadCurrentSong,
        handleManageDownload,
        handleDownloadSong,
        handleDownloadAllFavorite,
        handleOpenDownloadedFile,
        handleDeleteDownloadedFile,
        handleDownloadModalClose,
        // 播放列表
        handleAddSongToFavorite,
        handleRemoveSongFromPlaylist,
        handleAddToFavoriteFromModal,
        handlePlaylistSelect,
        handlePlaylistReorder,
        handlePlaylistRemove,
        // 搜索与 BV
        handleSearchResultClick,
        handleRemoteSearch,
        handleAddFromRemote,
        handleResolveBVAndAdd,
        // BV 切片
        handleSliceRangeChange,
        handleSliceStartChange,
        handleSliceEndChange,
        handleCreateFavoriteInModal,
        // 设置
        handleClearLoginCache,
        handleClearThemeCache,
        handleOpenDownloadsFolder,
        handleOpenDatabaseFile,
        handleClearMusicCache,
        handleClearAllCache,
        // BV 模态
        handleConfirmBVAdd,
    };
};
