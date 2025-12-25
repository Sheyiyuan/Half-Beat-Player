import { useMemo } from "react";
import type { Favorite, Song } from "../../types";

interface UseAppPanelsPropsParams {
    // TopBar deps
    userInfo: any;
    hitokoto: string;
    setGlobalSearchTerm: (val: string) => void;
    openModal: (name: string) => void;
    setThemeColorDraft: (val: string) => void;
    setBackgroundColorDraft: (val: string) => void;
    setBackgroundOpacityDraft: (val: number) => void;
    setBackgroundImageUrlDraftSafe: (val: string) => void;
    setPanelColorDraft: (val: string) => void;
    setPanelOpacityDraft: (val: number) => void;
    themeColor: string;
    backgroundColor: string;
    backgroundOpacity: number;
    backgroundImageUrl: string;
    panelColor: string;
    panelOpacity: number;
    setUserInfo: (val: any) => void;
    setStatus: (val: string) => void;

    // MainLayout deps
    currentSong: Song | null;
    panelBackground: string;
    computedColorScheme: "light" | "dark";
    placeholderCover: string;
    maxSkipLimit: number;
    formatTime: (v: number) => string;
    formatTimeLabel: (v: number) => string;
    parseTimeLabel: (v: string) => number;
    handleIntervalChange: (start: number, end: number) => void;
    handleSkipStartChange: (val: number) => void;
    handleSkipEndChange: (val: number) => void;
    handleStreamUrlChange: (val: string) => void;
    currentFav: Favorite | null;
    currentFavSongs: Song[];
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    playSong: (song: Song, list?: Song[]) => void;
    addSong: (song: Song, targetFavId?: string | null) => Promise<void>;
    downloadedSongIds: Set<string>;
    handleDownloadSong: (song: Song) => Promise<void>;
    handleAddSongToFavorite: (song: Song, favId: string | null) => Promise<void>;
    handleRemoveSongFromPlaylist: (songId: string) => void;
    confirmRemoveSongId: string | null;
    setConfirmRemoveSongId: (id: string | null) => void;
    playFavorite: (fav: Favorite) => void;
    handleDownloadAllFavorite: (fav: Favorite) => Promise<void>;
    favorites: Favorite[];
    selectedFavId: string | null;
    setSelectedFavId: (id: string | null) => void;
    setConfirmDeleteFavId: (id: string | null) => void;
    playSingleSong: (song: Song, fav?: Favorite | null) => Promise<void>;
    addCurrentToFavorite: () => Promise<void>;
    createFavorite: () => void;
    handleEditFavorite: (fav: Favorite) => void;
    handleDeleteFavorite: (id: string) => void;
    confirmDeleteFavId: string | null;

    // ControlsPanel deps
    progressInInterval: number;
    intervalStart: number;
    intervalLength: number;
    duration: number;
    seek: (val: number) => void;
    playPrev: () => void;
    togglePlay: () => void;
    playNext: () => void;
    isPlaying: boolean;
    playMode: string;
    handlePlayModeToggle: () => void;
    handleDownload: () => void;
    isDownloaded: boolean;
    volume: number;
    changeVolume: (val: number) => void;
    songsCount: number;
}

export const useAppPanelsProps = (params: UseAppPanelsPropsParams) => {
    return useMemo(() => {
        const {
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
            placeholderCover,
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
            songsCount,
        } = params;

        const topBarProps = {
            userInfo,
            hitokoto,
            onSearchClick: () => {
                setGlobalSearchTerm("");
                openModal("globalSearchModal");
            },
            onThemeClick: () => {
                setThemeColorDraft(themeColor);
                setBackgroundColorDraft(backgroundColor);
                setBackgroundOpacityDraft(backgroundOpacity);
                setBackgroundImageUrlDraftSafe(backgroundImageUrl);
                setPanelColorDraft(panelColor);
                setPanelOpacityDraft(panelOpacity);
                openModal("themeModal");
            },
            onSettingsClick: () => openModal("settingsModal"),
            onLoginClick: () => openModal("loginModal"),
            onLogout: () => {
                setUserInfo(null);
                setStatus("已退出登录");
            },
        } as const;

        const mainLayoutProps = {
            currentSong,
            panelBackground,
            themeColor,
            computedColorScheme,
            placeholderCover,
            maxSkipLimit,
            formatTime,
            formatTimeLabel,
            parseTimeLabel,
            onIntervalChange: handleIntervalChange,
            onSkipStartChange: handleSkipStartChange,
            onSkipEndChange: handleSkipEndChange,
            onStreamUrlChange: handleStreamUrlChange,
            currentFav,
            currentFavSongs,
            searchQuery,
            onSearchChange: setSearchQuery,
            onPlaySong: playSong,
            onAddSong: addSong,
            downloadedSongIds,
            onDownloadSong: handleDownloadSong,
            onAddSongToFavorite: handleAddSongToFavorite,
            onRemoveSongFromPlaylist: handleRemoveSongFromPlaylist,
            confirmRemoveSongId,
            onToggleConfirmRemove: setConfirmRemoveSongId,
            onPlayAll: () => {
                if (currentFav) {
                    playFavorite(currentFav);
                }
            },
            onDownloadAll: () => {
                if (currentFav) {
                    handleDownloadAllFavorite(currentFav);
                }
            },
            favorites,
            selectedFavId,
            onSelectFavorite: (id: string | null) => {
                setSelectedFavId(id);
                setConfirmDeleteFavId(null);
            },
            onPlayFavorite: playFavorite,
            onPlaySongInFavorite: (song: Song) => {
                const fav = currentFav || favorites.find(f => f.songIds.some(ref => ref.songId === song.id));
                playSingleSong(song, fav);
            },
            onAddCurrentToFavorite: addCurrentToFavorite,
            onCreateFavorite: createFavorite,
            onEditFavorite: handleEditFavorite,
            onDeleteFavorite: handleDeleteFavorite,
            onToggleConfirmDelete: setConfirmDeleteFavId,
            confirmDeleteFavId,
        } as const;

        const controlsPanelProps = {
            themeColor,
            computedColorScheme,
            currentSong,
            cover: currentSong?.cover,
            progressInInterval,
            intervalStart,
            intervalLength,
            duration,
            formatTime,
            seek,
            playPrev,
            togglePlay,
            playNext,
            isPlaying,
            playMode,
            onTogglePlayMode: handlePlayModeToggle,
            onAddToFavorite: () => openModal("addFavoriteModal"),
            onShowPlaylist: () => openModal("playlistModal"),
            onDownload: handleDownload,
            isDownloaded,
            volume,
            changeVolume,
            songsCount,
            panelBackground,
        } as const;

        return { topBarProps, mainLayoutProps, controlsPanelProps } as const;
    }, [params]);
};
