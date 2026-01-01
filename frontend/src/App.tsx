import React, { useRef, useState } from "react";
import { Box, MantineProvider } from "@mantine/core";
import * as Services from "../wailsjs/go/services/Service";

// Hooks - Core layers
import { useAudioPlayer, usePlaylist, useAudioInterval, usePlaylistActions, useSkipIntervalHandler, useDownloadManager, useAudioEvents, usePlaybackControls, usePlaylistPersistence, useAudioSourceManager, usePlaySong, usePlayModes } from "./hooks/player";
import { useSongs, useFavorites, useSongCache, useSettingsPersistence } from "./hooks/data";

// Hooks - Features
import { useAuth, useBVResolver, useFavoriteActions, useThemeEditor, useSearchAndBV, useBVModal, useLyricManagement, useSongOperations, useLyricLoader, useGlobalSearch, useLoginHandlers } from "./hooks/features";

// Hooks - UI aggregation
import { useHitokoto, useUiDerived, useAppLifecycle, useAppEffects, useAppHandlers, useAppPanelsProps, useThemeManagement, useFavoritesManager, useThemeDraftState, useAppSearchState, useAppComputedState } from "./hooks/ui";

// Contexts
import { useThemeContext, useModalContext } from "./context";

// Components
import AppModals from "./components/AppModals";
import { AppPanels } from "./components/layouts";

// Utils
import { formatTime, formatTimeLabel, parseTimeLabel, formatTimeWithMs } from "./utils/time";
import { APP_VERSION, PLACEHOLDER_COVER, DEFAULT_THEMES } from "./utils/constants";
import { LyricMapping, PlayerSetting } from "./types";

// Wails runtime
declare global {
    interface Window {
        go?: any;
    }
}

/**
 * App Component - 应用主组件
 * 
 * 重构后的架构：
 * 1. 聚合状态管理（5个 Hook）
 * 2. 核心业务逻辑（播放器、数据、功能）
 * 3. 派生值计算（UI 样式）
 * 4. Props 组装（使用 useAppModalsProps Hook）
 * 5. JSX 渲染（使用 AppRoot 组件）
 */
const App: React.FC = () => {
    // ========== 聚合状态管理 ==========
    const themeDraft = useThemeDraftState();
    const favoritesState = useFavoritesManager();
    const searchState = useAppSearchState();

    // ========== 播放器层 ==========
    const playlist = usePlaylist();
    const { queue, currentIndex, currentSong, playMode, setQueue, setCurrentIndex, setCurrentSong, setPlayMode } = playlist;

    const audioPlayer = useAudioPlayer(currentSong);
    const { audioRef, state: audioState, actions: audioActions, setIsPlaying, setProgress, setDuration } = audioPlayer;
    const { isPlaying, progress, duration, volume } = audioState;
    const { play, pause, seek, setVolume } = audioActions;

    const interval = useAudioInterval(currentSong, duration, progress);
    const { intervalRef, intervalStart, intervalEnd, intervalLength, progressInInterval } = interval;

    // ========== 数据层 ==========
    const { songs, setSongs } = useSongs();
    const { favorites, setFavorites } = useFavorites();
    const { updateSongWithCache } = useSongCache();

    // ========== 上下文 ==========
    const { state: themeState, actions: themeActions } = useThemeContext();
    const { themes, currentThemeId, themeColor, backgroundColor, backgroundOpacity, backgroundImageUrl, backgroundBlur, panelColor, panelOpacity, panelBlur, panelRadius, controlColor, controlOpacity, controlBlur, textColorPrimary, textColorSecondary, favoriteCardColor, cardOpacity, modalRadius, notificationRadius, componentRadius, coverRadius, modalColor, modalOpacity, modalBlur, windowControlsPos, computedColorScheme } = themeState;
    const { setThemes, setCurrentThemeId, setThemeColor, setBackgroundColor, setBackgroundOpacity, setBackgroundImageUrl, setBackgroundBlur, setPanelColor, setPanelOpacity, setPanelBlur, setPanelRadius, setControlColor, setControlOpacity, setControlBlur, setTextColorPrimary, setTextColorSecondary, setFavoriteCardColor, setCardOpacity, setModalRadius, setNotificationRadius, setComponentRadius, setCoverRadius, setModalColor, setModalOpacity, setModalBlur, setWindowControlsPos } = themeActions;

    const auth = useAuth();
    const { isLoggedIn, userInfo, setIsLoggedIn, setUserInfo } = auth;

    const bvResolver = useBVResolver();
    const { bvPreview, bvModalOpen, bvSongName, bvSinger, bvTargetFavId, resolvingBV, sliceStart, sliceEnd, setBvPreview, setBvModalOpen, setBvSongName, setBvSinger, setBvTargetFavId, setResolvingBV, setSliceStart, setSliceEnd } = bvResolver;

    const hitokoto = useHitokoto();
    const { modals, openModal, closeModal } = useModalContext();

    // ========== 内部状态 ==========
    const [setting, setSetting] = useState<PlayerSetting | null>(null);
    const [lyric, setLyric] = useState<LyricMapping | null>(null);

    // ========== Refs ==========
    const playingRef = useRef<string | null>(null);
    const playbackRetryRef = useRef<Map<string, number>>(new Map());
    const isHandlingErrorRef = useRef<Set<string>>(new Set());
    const prevSongIdRef = useRef<string | null>(null);
    const skipPersistRef = useRef(true);
    const fileDraftInputRef = useRef<HTMLInputElement | null>(null);
    const saveTimerRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

    // ========== 导出聚合状态 ==========
    const { searchQuery, setSearchQuery, globalSearchTerm, setGlobalSearchTerm, selectedFavId, setSelectedFavId, remoteResults, setRemoteResults, remoteLoading, setRemoteLoading, newFavName, setNewFavName, cacheSize, setCacheSize, status, setStatus } = searchState;
    const { createFavName, setCreateFavName, createFavMode, setCreateFavMode, duplicateSourceId, setDuplicateSourceId, importFid, setImportFid, confirmDeleteFavId, setConfirmDeleteFavId, editingFavId, setEditingFavId, editingFavName, setEditingFavName, isDownloaded, setIsDownloaded, confirmDeleteDownloaded, setConfirmDeleteDownloaded, downloadedSongIds, setDownloadedSongIds, managingSong, setManagingSong, confirmRemoveSongId, setConfirmRemoveSongId } = favoritesState;
    const { editingThemeId, setEditingThemeId, newThemeName, setNewThemeName, themeColorDraft, setThemeColorDraft, backgroundColorDraft, setBackgroundColorDraft, backgroundOpacityDraft, setBackgroundOpacityDraft, backgroundImageUrlDraft, setBackgroundImageUrlDraft, backgroundBlurDraft, setBackgroundBlurDraft, panelOpacityDraft, setPanelOpacityDraft, panelColorDraft, setPanelColorDraft, panelBlurDraft, setPanelBlurDraft, panelRadiusDraft, setPanelRadiusDraft, controlColorDraft, setControlColorDraft, controlOpacityDraft, setControlOpacityDraft, controlBlurDraft, setControlBlurDraft, textColorPrimaryDraft, setTextColorPrimaryDraft, textColorSecondaryDraft, setTextColorSecondaryDraft, favoriteCardColorDraft, setFavoriteCardColorDraft, cardOpacityDraft, setCardOpacityDraft, modalRadiusDraft, setModalRadiusDraft, notificationRadiusDraft, setNotificationRadiusDraft, componentRadiusDraft, setComponentRadiusDraft, coverRadiusDraft, setCoverRadiusDraft, modalColorDraft, setModalColorDraft, modalOpacityDraft, setModalOpacityDraft, modalBlurDraft, setModalBlurDraft, windowControlsPosDraft, setWindowControlsPosDraft, colorSchemeDraft, setColorSchemeDraft, savingTheme, setSavingTheme } = themeDraft;

    // ========== 主题管理 ==========
    const themeManagement = useThemeManagement({
        themes, setThemes, currentThemeId, setCurrentThemeId,
        setters: { setThemeColor, setBackgroundColor, setBackgroundOpacity, setBackgroundImageUrl, setBackgroundBlur, setPanelColor, setPanelOpacity, setPanelBlur, setPanelRadius, setControlColor, setControlOpacity, setControlBlur, setTextColorPrimary, setTextColorSecondary, setFavoriteCardColor, setCardOpacity, setModalRadius, setNotificationRadius, setComponentRadius, setCoverRadius, setModalColor, setModalOpacity, setModalBlur, setWindowControlsPos },
        skipPersistRef,
    });
    const { applyTheme, saveCachedCustomThemes, getCustomThemes } = themeManagement;

    // ========== 业务逻辑 Hooks ==========
    const setBackgroundImageUrlDraftSafe = (url: string) => setBackgroundImageUrlDraft(url);

    const favoriteActions = useFavoriteActions({ favorites, setFavorites, songs, setSongs, selectedFavId, setSelectedFavId, setStatus, isLoggedIn, themeColor, openModal, closeModal });
    const currentFav = selectedFavId ? (favorites.find((f: any) => f.id === selectedFavId) ?? null) : null;
    const currentFavSongs = currentFav ? songs.filter((s: any) => currentFav.songIds.some((ref: any) => ref.songId === s.id)) : [];

    const { playSong } = usePlaySong({ queue, selectedFavId, setQueue, setCurrentIndex, setCurrentSong, setIsPlaying, setStatus, setSongs, playbackRetryRef });

    const playlistActions = usePlaylistActions({ queue, setQueue, currentIndex, setCurrentIndex, setCurrentSong, setIsPlaying, currentFav, favorites, setFavorites, setStatus, setConfirmRemoveSongId, openModal, closeModal, playSong });

    const themeEditor = useThemeEditor({ themes, setThemes, defaultThemes: DEFAULT_THEMES, currentThemeId, computedColorScheme, saveCachedCustomThemes, applyThemeToUi: applyTheme, getCustomThemesFromState: getCustomThemes, editingThemeId, setEditingThemeId, newThemeName, setNewThemeName, themeColorDraft, setThemeColorDraft, backgroundColorDraft, setBackgroundColorDraft, backgroundOpacityDraft, setBackgroundOpacityDraft, backgroundImageUrlDraft, setBackgroundImageUrlDraftSafe, backgroundBlurDraft, setBackgroundBlurDraft, panelColorDraft, setPanelColorDraft, panelOpacityDraft, setPanelOpacityDraft, panelBlurDraft, setPanelBlurDraft, panelRadiusDraft, setPanelRadiusDraft, controlColorDraft, setControlColorDraft, controlOpacityDraft, setControlOpacityDraft, controlBlurDraft, setControlBlurDraft, textColorPrimaryDraft, setTextColorPrimaryDraft, textColorSecondaryDraft, setTextColorSecondaryDraft, favoriteCardColorDraft, setFavoriteCardColorDraft, cardOpacityDraft, setCardOpacityDraft, modalRadiusDraft, setModalRadiusDraft, notificationRadiusDraft, setNotificationRadiusDraft, componentRadiusDraft, setComponentRadiusDraft, coverRadiusDraft, setCoverRadiusDraft, modalColorDraft, setModalColorDraft, modalOpacityDraft, setModalOpacityDraft, modalBlurDraft, setModalBlurDraft, windowControlsPosDraft, setWindowControlsPosDraft, colorSchemeDraft, setColorSchemeDraft, setSavingTheme, openModal, closeModal });

    const bvModal = useBVModal({ bvPreview, sliceStart, sliceEnd, bvSongName, bvSinger, bvTargetFavId, selectedFavId, favorites, songs, currentSong, themeColor, setBvModalOpen, setBvPreview, setBvSongName, setBvSinger, setSliceStart, setSliceEnd, setSongs, setFavorites, setSelectedFavId });

    const skipIntervalHandler = useSkipIntervalHandler({ currentSong, setCurrentSong, setSongs, setQueue, saveTimerRef, intervalStart, intervalEnd, intervalLength });

    const downloadManager = useDownloadManager({ currentSong, currentFavSongs, downloadedSongIds, managingSong, setStatus, setDownloadedSongIds, setManagingSong, setConfirmDeleteDownloaded, openModal, closeModal });

    const { playSingleSong, playFavorite } = usePlayModes({ songs, queue, currentIndex, setQueue, setCurrentIndex, setCurrentSong, setIsPlaying, playSong });

    useAudioSourceManager({ audioRef, currentSong, playingRef, playbackRetryRef, isPlaying, setIsPlaying });

    const searchAndBV = useSearchAndBV({ themeColor, selectedFavId, favorites, globalSearchTerm, setGlobalSearchTerm, setRemoteResults, setRemoteLoading, setBvPreview, setBvSongName, setBvSinger, setBvTargetFavId, setBvModalOpen, setResolvingBV, setIsLoggedIn, playSingleSong, playFavorite, setSelectedFavId, openModal, closeModal });

    const lyricManagement = useLyricManagement({ currentSong, lyric, setLyric });
    const { saveLyric, saveLyricOffset } = lyricManagement;

    const playbackControls = usePlaybackControls({ audioRef, currentSong, currentIndex, queue, playMode, intervalStart, intervalEnd, setIsPlaying, setCurrentIndex, setCurrentSong, setVolume, playSong, playbackRetryRef, isHandlingErrorRef });
    const { playNext, playPrev, togglePlay, changeVolume } = playbackControls;

    const settingsPersistence = useSettingsPersistence({ setting, playMode, volume, currentThemeId: currentThemeId || "", themeColor, backgroundColor, backgroundOpacity, backgroundImageUrl, panelColor, panelOpacity, panelBlur, panelRadius, controlColor, controlOpacity, textColorPrimary, textColorSecondary, favoriteCardColor, componentRadius, modalRadius, notificationRadius, coverRadius, windowControlsPos, setSetting, skipPersistRef });
    const { persistSettings, settingsLoadedRef } = settingsPersistence;

    const songOperations = useSongOperations({ currentSong, songs, favorites, setSongs, setCurrentSong, setFavorites, playSong });
    const { addSong, updateStreamUrl, addCurrentToFavorite, updateSongInfo } = songOperations;

    usePlaylistPersistence({ queue, currentIndex });
    useLyricLoader({ currentSong, setLyric });

    const { globalSearchResults } = useGlobalSearch({ globalSearchTerm, songs, favorites });
    const { handleLoginSuccess } = useLoginHandlers({ closeModal, setUserInfo: setUserInfo as any, setStatus });

    // ========== UI 派生值 ==========
    const { backgroundWithOpacity, panelBackground, controlBackground, favoriteCardBackground, themeColorLight, panelStyles, controlStyles, componentRadius: derivedComponentRadius, coverRadius: derivedCoverRadius, modalRadius: derivedModalRadius, notificationRadius: derivedNotificationRadius, textColorPrimary: derivedTextColorPrimary, textColorSecondary: derivedTextColorSecondary } = useUiDerived({
        themeColor, backgroundColor, backgroundOpacity, backgroundImageUrl, panelColor, panelOpacity, panelBlur, panelRadius, controlColor, controlOpacity, controlBlur, textColorPrimary, textColorSecondary, favoriteCardColor, cardOpacity, modalRadius, notificationRadius, componentRadius, coverRadius, modalColor, modalOpacity, modalBlur,
    });

    const { maxSkipLimit, backgroundStyle, mantineTheme, filteredSongs } = useAppComputedState({
        duration, backgroundImageUrl, backgroundBlur, backgroundWithOpacity, derivedComponentRadius, derivedModalRadius, derivedNotificationRadius, derivedTextColorPrimary, themeColorLight, songs, searchQuery,
    });

    // ========== 应用生命周期 ==========
    useAppLifecycle({ userInfo, setUserInfo, setIsLoggedIn, saveCachedCustomThemes, setSetting, setVolume, setPlayMode, setThemes, setCurrentThemeId, setThemeColor, setBackgroundColor, setBackgroundOpacity, setBackgroundImageUrlSafe: setBackgroundImageUrlDraftSafe, setPanelColor, setPanelOpacity, skipPersistRef, settingsLoadedRef, modalsSettingsModal: modals.settingsModal, setCacheSize, openModal, setStatus, setSongs, setFavorites, setQueue, setCurrentIndex, setCurrentSong, setSelectedFavId, setting });

    useAppEffects({ intervalStart, intervalEnd, intervalLength, intervalRef, currentSong, songs, setIsDownloaded, downloadedSongIds, setDownloadedSongIds, audioRef, prevSongIdRef });

    useAudioEvents({ audioRef, currentSong, queue, currentIndex, volume, playMode, isPlaying, intervalRef: intervalRef as React.MutableRefObject<{ start: number; end: number; length: number }>, setIsPlaying, setProgress, setDuration, setCurrentIndex, setCurrentSong, setStatus, playbackRetryRef, isHandlingErrorRef, upsertSongs: async (arg1: any[]) => Services.UpsertSongs(arg1), playSong, playNext });

    // ========== Handlers ==========
    const myFavoriteImport = favoriteActions.myFavoriteImport;

    const handlers = useAppHandlers({ themeEditor, editingThemeId, newThemeName, themeColorDraft, backgroundColorDraft, backgroundOpacityDraft, backgroundImageUrlDraft, backgroundBlurDraft, panelColorDraft, panelOpacityDraft, panelBlurDraft, panelRadiusDraft, controlColorDraft, controlOpacityDraft, controlBlurDraft, textColorPrimaryDraft, textColorSecondaryDraft, favoriteCardColorDraft, cardOpacityDraft, componentRadiusDraft, windowControlsPosDraft, colorSchemeDraft, setBackgroundImageUrlDraftSafe, favoriteActions, editingFavId, editingFavName, setEditingFavId, setEditingFavName, createFavName, setCreateFavName, createFavMode, setCreateFavMode, duplicateSourceId, setDuplicateSourceId, importFid, setImportFid, openModal, setConfirmDeleteFavId, myFavoriteImport, skipIntervalHandler, updateStreamUrl, playMode, setPlayMode, downloadManager, setConfirmDeleteDownloaded, setManagingSong, closeModal, playlistActions, searchAndBV, newFavName, setNewFavName, setFavorites, setBvTargetFavId, bvPreview, sliceStart, sliceEnd, setSliceStart, setSliceEnd, setUserInfo, saveCachedCustomThemes, setCacheSize, bvModal });

    const { handleSelectTheme, handleViewTheme, handleEditTheme, handleDeleteTheme, handleCreateThemeClick, handleSubmitTheme, handleCloseThemeEditor, handleClearBackgroundImageDraft, handleBackgroundFileDraft, handleDeleteFavorite, handleEditFavorite, handleSaveEditFavorite, handleSubmitCreateFavorite, createFavorite, handleIntervalChange, handleSkipStartChange, handleSkipEndChange, handleStreamUrlChange, handlePlayModeToggle, handleDownload, handleDownloadCurrentSong, handleManageDownload, handleDownloadSong, handleDownloadAllFavorite, handleOpenDownloadedFile, handleDeleteDownloadedFile, handleDownloadModalClose, handleAddSongToFavorite, handleRemoveSongFromPlaylist, handleAddToFavoriteFromModal, handlePlaylistSelect, handlePlaylistReorder, handlePlaylistRemove, handleSearchResultClick, handleRemoteSearch, handleAddFromRemote, handleResolveBVAndAdd, handleSliceRangeChange, handleSliceStartChange, handleSliceEndChange, handleCreateFavoriteInModal, handleClearLoginCache, handleClearThemeCache, handleOpenDownloadsFolder, handleOpenDatabaseFile, handleClearMusicCache, handleClearAllCache, handleConfirmBVAdd } = handlers;

    const onLoginSuccess = async () => {
        myFavoriteImport.clearCollections?.();
        await handleLoginSuccess();
    };

    // ========== 构建 Props ==========
    const { topBarProps, mainLayoutProps, controlsPanelProps } = useAppPanelsProps({ userInfo, hitokoto, setGlobalSearchTerm, openModal, setThemeColorDraft, setBackgroundColorDraft, setBackgroundOpacityDraft, setBackgroundImageUrlDraftSafe, setPanelColorDraft, setPanelOpacityDraft, themeColor, backgroundColor, backgroundOpacity, backgroundImageUrl, panelColor, panelOpacity, setUserInfo, setStatus, windowControlsPos, currentSong, panelBackground, panelStyles, controlBackground, controlStyles, favoriteCardBackground, textColorPrimary: derivedTextColorPrimary, textColorSecondary: derivedTextColorSecondary, componentRadius: derivedComponentRadius, coverRadius: derivedCoverRadius, computedColorScheme: (computedColorScheme === "auto" ? "light" : computedColorScheme) as "light" | "dark", placeholderCover: PLACEHOLDER_COVER, maxSkipLimit, formatTime, formatTimeWithMs, formatTimeLabel, parseTimeLabel, handleIntervalChange, handleSkipStartChange, handleSkipEndChange, handleStreamUrlChange, handleSongInfoUpdate: updateSongInfo, currentFav, currentFavSongs, searchQuery, setSearchQuery, playSong, addSong, downloadedSongIds, handleDownloadSong, handleAddSongToFavorite, handleRemoveSongFromPlaylist, confirmRemoveSongId, setConfirmRemoveSongId, playFavorite, handleDownloadAllFavorite, favorites, selectedFavId, setSelectedFavId, setConfirmDeleteFavId, playSingleSong, addCurrentToFavorite, createFavorite, handleEditFavorite, handleDeleteFavorite, confirmDeleteFavId, progressInInterval, intervalStart, intervalLength, duration, seek, playPrev, togglePlay, playNext, isPlaying, playMode, handlePlayModeToggle, handleDownloadCurrentSong, handleManageDownload, volume, changeVolume, songsCount: songs.length });

    // ========== 渲染 ==========
    return (
        <MantineProvider theme={mantineTheme}>
            <Box h="100vh" w="100vw" style={{ position: "relative", overflow: "hidden", backgroundColor: "transparent" }}>
                <Box style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: -1, ...backgroundStyle }} />
                <AppModals
                    modals={modals}
                    themes={themes}
                    currentThemeId={currentThemeId}
                    themeColor={themeColor}
                    themeColorLight={themeColorLight}
                    editingThemeId={editingThemeId}
                    newThemeName={newThemeName}
                    themeColorDraft={themeColorDraft}
                    backgroundColorDraft={backgroundColorDraft}
                    backgroundOpacityDraft={backgroundOpacityDraft}
                    backgroundImageUrlDraft={backgroundImageUrlDraft}
                    backgroundBlurDraft={backgroundBlurDraft}
                    panelColorDraft={panelColorDraft}
                    panelOpacityDraft={panelOpacityDraft}
                    panelBlurDraft={panelBlurDraft}
                    panelRadiusDraft={panelRadiusDraft}
                    controlColorDraft={controlColorDraft}
                    controlOpacityDraft={controlOpacityDraft}
                    controlBlurDraft={controlBlurDraft}
                    textColorPrimaryDraft={textColorPrimaryDraft}
                    textColorSecondaryDraft={textColorSecondaryDraft}
                    favoriteCardColorDraft={favoriteCardColorDraft}
                    cardOpacityDraft={cardOpacityDraft}
                    modalRadiusDraft={modalRadiusDraft}
                    notificationRadiusDraft={notificationRadiusDraft}
                    componentRadiusDraft={componentRadiusDraft}
                    coverRadiusDraft={coverRadiusDraft}
                    modalColorDraft={modalColorDraft}
                    modalOpacityDraft={modalOpacityDraft}
                    modalBlurDraft={modalBlurDraft}
                    windowControlsPosDraft={windowControlsPosDraft}
                    colorSchemeDraft={colorSchemeDraft}
                    savingTheme={savingTheme}
                    fileDraftInputRef={fileDraftInputRef}
                    favorites={favorites}
                    queue={queue}
                    currentIndex={currentIndex}
                    currentSong={currentSong}
                    globalSearchTerm={globalSearchTerm}
                    globalSearchResults={globalSearchResults}
                    remoteResults={remoteResults}
                    remoteLoading={remoteLoading}
                    resolvingBV={resolvingBV}
                    bvModalOpen={bvModalOpen}
                    bvPreview={bvPreview}
                    bvTargetFavId={bvTargetFavId}
                    bvSongName={bvSongName}
                    bvSinger={bvSinger}
                    sliceStart={sliceStart}
                    sliceEnd={sliceEnd}
                    newFavName={newFavName}
                    managingSong={managingSong}
                    confirmDeleteDownloaded={confirmDeleteDownloaded}
                    appVersion={APP_VERSION}
                    cacheSize={cacheSize}
                    createFavName={createFavName}
                    createFavMode={createFavMode as any}
                    duplicateSourceId={duplicateSourceId}
                    importFid={importFid}
                    myCollections={myFavoriteImport.myCollections}
                    isLoadingCollections={myFavoriteImport.isLoading}
                    selectedMyCollectionId={myFavoriteImport.selectedCollectionId}
                    closeModal={closeModal}
                    onSelectTheme={handleSelectTheme}
                    onViewTheme={handleViewTheme}
                    onEditTheme={handleEditTheme}
                    onDeleteTheme={handleDeleteTheme}
                    onCreateTheme={handleCreateThemeClick}
                    onThemeNameChange={setNewThemeName}
                    onThemeColorChange={setThemeColorDraft}
                    onBackgroundColorChange={setBackgroundColorDraft}
                    onBackgroundOpacityChange={setBackgroundOpacityDraft}
                    onBackgroundImageChange={setBackgroundImageUrlDraftSafe}
                    onBackgroundBlurChange={setBackgroundBlurDraft}
                    onClearBackgroundImage={handleClearBackgroundImageDraft}
                    onPanelColorChange={setPanelColorDraft}
                    onPanelOpacityChange={setPanelOpacityDraft}
                    onPanelBlurChange={setPanelBlurDraft}
                    onPanelRadiusChange={setPanelRadiusDraft}
                    onControlColorChange={setControlColorDraft}
                    onControlOpacityChange={setControlOpacityDraft}
                    onControlBlurChange={setControlBlurDraft}
                    onTextColorPrimaryChange={setTextColorPrimaryDraft}
                    onTextColorSecondaryChange={setTextColorSecondaryDraft}
                    onFavoriteCardColorChange={setFavoriteCardColorDraft}
                    onCardOpacityChange={setCardOpacityDraft}
                    onModalRadiusChange={setModalRadiusDraft}
                    onNotificationRadiusChange={setNotificationRadiusDraft}
                    onComponentRadiusChange={setComponentRadiusDraft}
                    onCoverRadiusChange={setCoverRadiusDraft}
                    onModalColorChange={setModalColorDraft}
                    onModalOpacityChange={setModalOpacityDraft}
                    onModalBlurChange={setModalBlurDraft}
                    onWindowControlsPosChange={setWindowControlsPosDraft}
                    onColorSchemeChange={setColorSchemeDraft}
                    onSubmitTheme={handleSubmitTheme}
                    onCancelThemeEdit={handleCloseThemeEditor}
                    onBackgroundFileChange={handleBackgroundFileDraft}
                    onAddToFavorite={handleAddToFavoriteFromModal}
                    onPlaylistSelect={handlePlaylistSelect}
                    onPlaylistReorder={handlePlaylistReorder}
                    onPlaylistRemove={handlePlaylistRemove}
                    editingFavName={editingFavName}
                    onEditingFavNameChange={setEditingFavName}
                    onSaveEditFavorite={handleSaveEditFavorite}
                    onLoginSuccess={onLoginSuccess}
                    onClearLoginCache={handleClearLoginCache}
                    onClearThemeCache={handleClearThemeCache}
                    onOpenDownloadsFolder={handleOpenDownloadsFolder}
                    onOpenDatabaseFile={handleOpenDatabaseFile}
                    onClearMusicCache={handleClearMusicCache}
                    onClearAllCache={handleClearAllCache}
                    onDownloadModalClose={handleDownloadModalClose}
                    onOpenDownloadedFile={handleOpenDownloadedFile}
                    onDeleteDownloadedFile={handleDeleteDownloadedFile}
                    onToggleConfirmDelete={setConfirmDeleteDownloaded}
                    onCreateFavoriteSubmit={handleSubmitCreateFavorite}
                    onCreateFavModeChange={setCreateFavMode}
                    onDuplicateSourceChange={setDuplicateSourceId}
                    onImportFidChange={setImportFid}
                    onCreateFavNameChange={setCreateFavName}
                    onMyCollectionSelect={myFavoriteImport.setSelectedCollectionId}
                    onFetchMyCollections={myFavoriteImport.fetchMyCollections}
                    onGlobalTermChange={setGlobalSearchTerm}
                    onResolveBVAndAdd={handleResolveBVAndAdd}
                    onRemoteSearch={handleRemoteSearch}
                    onResultClick={handleSearchResultClick}
                    onAddFromRemote={handleAddFromRemote}
                    onSliceRangeChange={handleSliceRangeChange}
                    onSliceStartChange={handleSliceStartChange}
                    onSliceEndChange={handleSliceEndChange}
                    onSelectFavorite={setBvTargetFavId}
                    onCreateFavoriteInBV={handleCreateFavoriteInModal}
                    onFavNameChange={setNewFavName}
                    onSongNameChange={setBvSongName}
                    onSingerChange={setBvSinger}
                    onConfirmBVAdd={handleConfirmBVAdd}
                    onBvModalClose={() => setBvModalOpen(false)}
                    formatTime={formatTime}
                    formatTimeWithMs={formatTimeWithMs}
                    panelStyles={panelStyles}
                    derived={{
                        panelBackground,
                        controlBackground,
                        favoriteCardBackground,
                        textColorPrimary: derivedTextColorPrimary,
                        textColorSecondary: derivedTextColorSecondary,
                    }}
                />
                <AppPanels topBarProps={topBarProps} mainLayoutProps={mainLayoutProps as any} controlsPanelProps={controlsPanelProps as any} />
            </Box>
        </MantineProvider>
    );
};

export default App;
