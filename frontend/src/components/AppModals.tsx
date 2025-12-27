import React from "react";
import { Modal, Stack, TextInput, Group, Button } from "@mantine/core";
import ThemeManagerModal from "./ThemeManagerModal";
import ThemeEditorModal from "./ThemeEditorModal";
import AddToFavoriteModal from "./AddToFavoriteModal";
import PlaylistModal from "./PlaylistModal";
import LoginModal from "./LoginModal";
import SettingsModal from "./SettingsModal";
import DownloadManagerModal from "./DownloadManagerModal";
import CreateFavoriteModal from "./CreateFavoriteModal";
import GlobalSearchModal from "./GlobalSearchModal";
import BVAddModal from "./BVAddModal";
import { Favorite, Song, Theme } from "../types";
import { formatTime } from "../utils/time";

export interface AppModalsProps {
    // modal state flags
    modals: {
        themeModal: boolean;
        themeEditorModal: boolean;
        addFavoriteModal: boolean;
        playlistModal: boolean;
        editFavModal: boolean;
        loginModal: boolean;
        settingsModal: boolean;
        downloadModal: boolean;
        createFavModal: boolean;
        globalSearchModal: boolean;
    };

    // theme manager props
    themes: Theme[];
    currentThemeId: string | null;
    themeColor: string;
    themeColorLight: string;
    editingThemeId: string | null;
    newThemeName: string;
    colorSchemeDraft: "light" | "dark";
    themeColorDraft: string;
    backgroundColorDraft: string;
    backgroundOpacityDraft: number;
    backgroundImageUrlDraft: string;
    panelColorDraft: string;
    panelOpacityDraft: number;
    savingTheme: boolean;
    fileDraftInputRef: React.RefObject<HTMLInputElement>;

    // global data
    favorites: Favorite[];
    queue: Song[];
    currentIndex: number;
    currentSong: Song | null;

    // search / global
    globalSearchTerm: string;
    globalSearchResults: Song[];
    remoteResults: Song[];
    remoteLoading: boolean;
    resolvingBV: boolean;

    // bv modal
    bvModalOpen: boolean;
    bvPreview: any;
    bvTargetFavId: string | null;
    bvSongName: string;
    bvSinger: string;
    sliceStart: number;
    sliceEnd: number;
    newFavName: string;

    // download
    managingSong: Song | null;
    confirmDeleteDownloaded: boolean;

    // misc
    appVersion: string;
    cacheSize: number;
    createFavName: string;
    createFavMode: "blank" | "duplicate" | "importMine" | "importFid";
    duplicateSourceId: string | null;
    importFid: string;
    myCollections: any[];
    isLoadingCollections: boolean;
    selectedMyCollectionId: string | null;

    // handlers
    closeModal: (name: keyof AppModalsProps["modals"]) => void;
    onSelectTheme: (theme: Theme) => void;
    onEditTheme: (theme: Theme) => void;
    onDeleteTheme: (id: string) => void | Promise<void>;
    onCreateTheme: () => void;
    onThemeNameChange: (v: string) => void;
    onColorSchemeChange: (scheme: "light" | "dark") => void;
    onThemeColorChange: (v: string) => void;
    onBackgroundColorChange: (v: string) => void;
    onBackgroundOpacityChange: (v: number) => void;
    onBackgroundImageChange: (v: string) => void;
    onClearBackgroundImage: () => void;
    onPanelColorChange: (v: string) => void;
    onPanelOpacityChange: (v: number) => void;
    onSubmitTheme: () => void;
    onCancelThemeEdit: () => void;
    onBackgroundFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

    onAddToFavorite: (favId: string | null) => Promise<void> | void;
    onPlaylistSelect: (idx: number) => void;
    onPlaylistReorder: (from: number, to: number) => void;
    onPlaylistRemove: (idx: number) => void;

    editingFavName: string;
    onEditingFavNameChange: (v: string) => void;
    onSaveEditFavorite: () => void;

    onLoginSuccess: () => void;
    onClearLoginCache: () => void;
    onClearThemeCache: () => void;
    onOpenDownloadsFolder: () => void;
    onClearMusicCache: () => void;
    onClearAllCache: () => void;

    onDownloadModalClose: () => void;
    onOpenDownloadedFile: () => void;
    onDeleteDownloadedFile: () => void;
    onToggleConfirmDelete: (v: boolean) => void;

    onCreateFavoriteSubmit: () => void;
    onCreateFavModeChange: (mode: "blank" | "duplicate" | "importMine" | "importFid") => void;
    onDuplicateSourceChange: (id: string | null) => void;
    onImportFidChange: (v: string) => void;
    onCreateFavNameChange: (v: string) => void;
    onMyCollectionSelect: (id: string | null) => void;
    onFetchMyCollections: () => void;

    onGlobalTermChange: (v: string) => void;
    onResolveBVAndAdd: () => void | Promise<void>;
    onRemoteSearch: () => void | Promise<void>;
    onResultClick: (song: Song) => void;
    onAddFromRemote: (song: Song) => void;

    onSliceRangeChange: (start: number, end: number) => void;
    onSliceStartChange: (v: number | string) => void;
    onSliceEndChange: (v: number | string) => void;
    onSelectFavorite: (id: string | null) => void;
    onCreateFavoriteInBV: () => Promise<void> | void;
    onFavNameChange: (v: string) => void;
    onSongNameChange: (v: string) => void;
    onSingerChange: (v: string) => void;
    onConfirmBVAdd: () => Promise<void> | void;
    onBvModalClose: () => void;
}

const AppModals: React.FC<AppModalsProps> = (props) => {
    const {
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
        appVersion,
        cacheSize,
        createFavName,
        createFavMode,
        duplicateSourceId,
        importFid,
        myCollections,
        isLoadingCollections,
        selectedMyCollectionId,
        closeModal,
        onSelectTheme,
        onEditTheme,
        onDeleteTheme,
        onCreateTheme,
        onThemeNameChange,
        onColorSchemeChange,
        onThemeColorChange,
        onBackgroundColorChange,
        onBackgroundOpacityChange,
        onBackgroundImageChange,
        onClearBackgroundImage,
        onPanelColorChange,
        onPanelOpacityChange,
        onSubmitTheme,
        onCancelThemeEdit,
        onBackgroundFileChange,
        onAddToFavorite,
        onPlaylistSelect,
        onPlaylistReorder,
        onPlaylistRemove,
        editingFavName,
        onEditingFavNameChange,
        onSaveEditFavorite,
        onLoginSuccess,
        onClearLoginCache,
        onClearThemeCache,
        onOpenDownloadsFolder,
        onClearMusicCache,
        onClearAllCache,
        onDownloadModalClose,
        onOpenDownloadedFile,
        onDeleteDownloadedFile,
        onToggleConfirmDelete,
        onCreateFavoriteSubmit,
        onCreateFavModeChange,
        onDuplicateSourceChange,
        onImportFidChange,
        onCreateFavNameChange,
        onMyCollectionSelect,
        onFetchMyCollections,
        onGlobalTermChange,
        onResolveBVAndAdd,
        onRemoteSearch,
        onResultClick,
        onAddFromRemote,
        onSliceRangeChange,
        onSliceStartChange,
        onSliceEndChange,
        onSelectFavorite,
        onCreateFavoriteInBV,
        onFavNameChange,
        onSongNameChange,
        onSingerChange,
        onConfirmBVAdd,
        onBvModalClose,
    } = props;

    return (
        <>
            <ThemeManagerModal
                opened={modals.themeModal}
                onClose={() => closeModal("themeModal")}
                themes={themes}
                currentThemeId={currentThemeId}
                onSelectTheme={onSelectTheme}
                onEditTheme={onEditTheme}
                onDeleteTheme={onDeleteTheme}
                onCreateTheme={onCreateTheme}
                accentColor={themeColor}
            />

            <ThemeEditorModal
                opened={modals.themeEditorModal}
                onClose={onCancelThemeEdit}
                onCancel={onCancelThemeEdit}
                editingThemeId={editingThemeId}
                newThemeName={newThemeName}
                onNameChange={onThemeNameChange}
                colorSchemeDraft={colorSchemeDraft}
                onColorSchemeChange={onColorSchemeChange}
                themeColorDraft={themeColorDraft}
                onThemeColorChange={onThemeColorChange}
                backgroundColorDraft={backgroundColorDraft}
                onBackgroundColorChange={onBackgroundColorChange}
                backgroundOpacityDraft={backgroundOpacityDraft}
                onBackgroundOpacityChange={onBackgroundOpacityChange}
                backgroundImageUrlDraft={backgroundImageUrlDraft}
                onBackgroundImageChange={onBackgroundImageChange}
                onClearBackgroundImage={onClearBackgroundImage}
                panelColorDraft={panelColorDraft}
                onPanelColorChange={onPanelColorChange}
                panelOpacityDraft={panelOpacityDraft}
                onPanelOpacityChange={onPanelOpacityChange}
                onSubmit={onSubmitTheme}
                savingTheme={savingTheme}
                fileInputRef={fileDraftInputRef}
                onBackgroundFileChange={onBackgroundFileChange}
            />

            <AddToFavoriteModal
                opened={modals.addFavoriteModal}
                onClose={() => closeModal("addFavoriteModal")}
                favorites={favorites}
                currentSong={currentSong}
                themeColor={themeColor}
                onAdd={onAddToFavorite}
            />

            <PlaylistModal
                opened={modals.playlistModal}
                onClose={() => closeModal("playlistModal")}
                queue={queue}
                currentIndex={currentIndex}
                themeColorHighlight={themeColorLight}
                onSelect={onPlaylistSelect}
                onReorder={onPlaylistReorder}
                onRemove={onPlaylistRemove}
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
                        onChange={(e) => onEditingFavNameChange(e.currentTarget.value)}
                        placeholder="输入歌单名称"
                    />
                    <Group justify="flex-end" gap="sm">
                        <Button variant="subtle" color={themeColor} onClick={() => closeModal("editFavModal")}>
                            取消
                        </Button>
                        <Button color={themeColor} onClick={onSaveEditFavorite}>
                            保存
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <LoginModal
                opened={modals.loginModal}
                onClose={() => closeModal("loginModal")}
                onLoginSuccess={onLoginSuccess}
            />

            <SettingsModal
                opened={modals.settingsModal}
                onClose={() => closeModal("settingsModal")}
                themeColor={themeColor}
                appVersion={appVersion}
                cacheSize={cacheSize}
                onClearLoginCache={onClearLoginCache}
                onClearThemeCache={onClearThemeCache}
                onOpenDownloadsFolder={onOpenDownloadsFolder}
                onClearMusicCache={onClearMusicCache}
                onClearAllCache={onClearAllCache}
            />

            <DownloadManagerModal
                opened={modals.downloadModal}
                managingSong={managingSong}
                confirmDeleteDownloaded={confirmDeleteDownloaded}
                onClose={onDownloadModalClose}
                onOpenFile={onOpenDownloadedFile}
                onDeleteFile={onDeleteDownloadedFile}
                onToggleConfirmDelete={onToggleConfirmDelete}
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
                myCollections={myCollections}
                isLoadingCollections={isLoadingCollections}
                selectedMyCollectionId={selectedMyCollectionId}
                onNameChange={onCreateFavNameChange}
                onModeChange={onCreateFavModeChange}
                onDuplicateSourceChange={onDuplicateSourceChange}
                onImportFidChange={onImportFidChange}
                onMyCollectionSelect={onMyCollectionSelect}
                onFetchMyCollections={onFetchMyCollections}
                onSubmit={onCreateFavoriteSubmit}
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
                onTermChange={onGlobalTermChange}
                onResolveBVAndAdd={onResolveBVAndAdd}
                onRemoteSearch={onRemoteSearch}
                onResultClick={onResultClick}
                onAddFromRemote={onAddFromRemote}
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
                onClose={onBvModalClose}
                onSliceRangeChange={onSliceRangeChange}
                onSliceStartChange={onSliceStartChange}
                onSliceEndChange={onSliceEndChange}
                onSelectFavorite={onSelectFavorite}
                onCreateFavorite={onCreateFavoriteInBV}
                onFavNameChange={onFavNameChange}
                onSongNameChange={onSongNameChange}
                onSingerChange={onSingerChange}
                onConfirmAdd={onConfirmBVAdd}
                formatTime={formatTime}
            />
        </>
    );
};

export default AppModals;
