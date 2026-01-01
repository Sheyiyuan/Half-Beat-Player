/**
 * useAppModalsProps - 构建所有模态框的 Props
 * 避免在 App.tsx 中显式传递 80+ 个 Props
 */

import { useMemo } from 'react';

interface UseAppModalsPropsDeps {
    // 主题相关
    themes: any[];
    currentThemeId: string | null;
    themeColor: string;
    backgroundColor: string;
    backgroundOpacity: number;
    backgroundImageUrl: string;
    panelColor: string;
    panelOpacity: number;

    // 模态框状态
    showThemeManager: boolean;
    showThemeDetail: boolean;
    showThemeEditor: boolean;
    showLogin: boolean;
    showSettings: boolean;
    showPlaylist: boolean;
    showCreateFavorite: boolean;
    showAddToFavorite: boolean;
    showBVAdd: boolean;
    showGlobalSearch: boolean;
    showDownloadManager: boolean;
    showSongDetail: boolean;

    // 收藏夹相关
    favorites: any[];
    selectedFavId: string | null;
    songs: any[];
    editingFavId: string | null;
    createFavName: string;
    confirmDeleteFavId: string | null;

    // 下载相关
    downloadingState: any;
    confirmCancelDownloadId: string | null;

    // 搜索相关
    searchQuery: string;
    globalSearchTerm: string;
    globalSearchResults: any;

    // 主题编辑状态
    themeNameDraft: string;
    themeDraftState: any;

    // 处理函数
    closeAllModals: () => void;
    closeThemeManager: () => void;
    closeThemeDetail: () => void;
    closeThemeEditor: () => void;
    closeLogin: () => void;
    closeSettings: () => void;
    closePlaylist: () => void;
    closeCreateFavorite: () => void;
    closeAddToFavorite: () => void;
    closeBVAdd: () => void;
    closeGlobalSearch: () => void;
    closeDownloadManager: () => void;
    closeSongDetail: () => void;

    // 动作处理
    handleThemeSelect: (theme: any) => void;
    handleThemeChange: (field: string, value: any) => void;
    handleResetThemeDraft: () => void;
    handleSaveTheme: () => Promise<void>;
    handleDeleteTheme: (themeId: string) => Promise<void>;
    handleViewTheme: (theme: any) => void;

    handleCreateFavorite: (name: string) => Promise<void>;
    handleEditFavorite: (favId: string, newName: string) => Promise<void>;
    handleDeleteFavorite: (favId: string) => Promise<void>;
    handleAddToFavorite: (song: any, favId: string) => Promise<void>;
    handleRemoveFromFavorite: (songId: string, favId: string) => Promise<void>;

    handleDownload: (favId: string, format: string) => Promise<void>;
    handleCancelDownload: (downloadId: string) => void;

    handleBVAdd: (bvId: string) => Promise<void>;
    handleGlobalSearch: (query: string) => Promise<void>;

    handleLoginSuccess: (userInfo: any) => void;
    handleLogout: () => Promise<void>;

    handleRemoveSong: (songId: string) => Promise<void>;

    setEditingFavId: (id: string | null) => void;
    setCreateFavName: (name: string) => void;
    setConfirmDeleteFavId: (id: string | null) => void;
    setConfirmCancelDownloadId: (id: string | null) => void;
    setSearchQuery: (query: string) => void;
    setGlobalSearchTerm: (term: string) => void;
    setThemeNameDraft: (name: string) => void;
}

export const useAppModalsProps = (deps: UseAppModalsPropsDeps) => {
    const appModalsProps = useMemo(
        () => ({
            // 主题管理
            themeManagerProps: {
                opened: deps.showThemeManager,
                onClose: deps.closeThemeManager,
                themes: deps.themes,
                currentThemeId: deps.currentThemeId,
                onSelectTheme: deps.handleThemeSelect,
                onViewTheme: deps.handleViewTheme,
                onDeleteTheme: deps.handleDeleteTheme,
            },

            // 主题详情/编辑
            themeDetailProps: {
                opened: deps.showThemeDetail,
                onClose: deps.closeThemeDetail,
                theme: deps.themes.find((t: any) => t.id === deps.currentThemeId),
                isReadOnly: true,
            },

            themeEditorProps: {
                opened: deps.showThemeEditor,
                onClose: deps.closeThemeEditor,
                themeName: deps.themeNameDraft,
                onThemeNameChange: deps.setThemeNameDraft,
                themeColor: deps.themeColor,
                backgroundColor: deps.backgroundColor,
                backgroundOpacity: deps.backgroundOpacity,
                backgroundImageUrl: deps.backgroundImageUrl,
                panelColor: deps.panelColor,
                panelOpacity: deps.panelOpacity,
                onThemeChange: deps.handleThemeChange,
                onReset: deps.handleResetThemeDraft,
                onSave: deps.handleSaveTheme,
            },

            // 登录
            loginProps: {
                opened: deps.showLogin,
                onClose: deps.closeLogin,
                onLoginSuccess: deps.handleLoginSuccess,
            },

            // 设置
            settingsProps: {
                opened: deps.showSettings,
                onClose: deps.closeSettings,
                onLogout: deps.handleLogout,
            },

            // 播放列表
            playlistProps: {
                opened: deps.showPlaylist,
                onClose: deps.closePlaylist,
            },

            // 创建收藏夹
            createFavoriteProps: {
                opened: deps.showCreateFavorite,
                onClose: deps.closeCreateFavorite,
                favName: deps.createFavName,
                onFavNameChange: deps.setCreateFavName,
                onCreate: deps.handleCreateFavorite,
            },

            // 添加到收藏夹
            addToFavoriteProps: {
                opened: deps.showAddToFavorite,
                onClose: deps.closeAddToFavorite,
                favorites: deps.favorites,
                onAdd: deps.handleAddToFavorite,
            },

            // BV 添加
            bvAddProps: {
                opened: deps.showBVAdd,
                onClose: deps.closeBVAdd,
                onAdd: deps.handleBVAdd,
            },

            // 全局搜索
            globalSearchProps: {
                opened: deps.showGlobalSearch,
                onClose: deps.closeGlobalSearch,
                searchTerm: deps.globalSearchTerm,
                onSearchTermChange: deps.setGlobalSearchTerm,
                results: deps.globalSearchResults,
                onSearch: deps.handleGlobalSearch,
            },

            // 下载管理器
            downloadManagerProps: {
                opened: deps.showDownloadManager,
                onClose: deps.closeDownloadManager,
                downloading: deps.downloadingState,
                onCancel: deps.handleCancelDownload,
            },

            // 歌曲详情
            songDetailProps: {
                opened: deps.showSongDetail,
                onClose: deps.closeSongDetail,
                onRemove: deps.handleRemoveSong,
            },
        }),
        [
            deps.showThemeManager,
            deps.showThemeDetail,
            deps.showThemeEditor,
            deps.showLogin,
            deps.showSettings,
            deps.showPlaylist,
            deps.showCreateFavorite,
            deps.showAddToFavorite,
            deps.showBVAdd,
            deps.showGlobalSearch,
            deps.showDownloadManager,
            deps.showSongDetail,
            deps.themes,
            deps.currentThemeId,
            deps.favorites,
            deps.selectedFavId,
            deps.songs,
            deps.downloadingState,
            deps.globalSearchResults,
            deps.handleThemeSelect,
            deps.handleThemeChange,
            deps.handleResetThemeDraft,
            deps.handleSaveTheme,
            deps.handleDeleteTheme,
            deps.handleViewTheme,
            deps.handleCreateFavorite,
            deps.handleEditFavorite,
            deps.handleDeleteFavorite,
            deps.handleAddToFavorite,
            deps.handleRemoveFromFavorite,
            deps.handleDownload,
            deps.handleCancelDownload,
            deps.handleBVAdd,
            deps.handleGlobalSearch,
            deps.handleLoginSuccess,
            deps.handleLogout,
            deps.handleRemoveSong,
        ]
    );

    return appModalsProps;
};
