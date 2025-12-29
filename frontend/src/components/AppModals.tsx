import React from "react";
import { Modal, Stack, TextInput, Group, Button } from "@mantine/core";
import ThemeManagerModal from "./ThemeManagerModal";
import ThemeDetailModal from "./ThemeDetailModal";
import AddToFavoriteModal from "./AddToFavoriteModal";
import PlaylistModal from "./PlaylistModal";
import LoginModal from "./LoginModal";
import SettingsModal from "./SettingsModal";
import DownloadManagerModal from "./DownloadManagerModal";
import CreateFavoriteModal from "./CreateFavoriteModal";
import GlobalSearchModal from "./GlobalSearchModal";
import BVAddModal from "./BVAddModal";
import { Favorite, Song, Theme } from "../types";
import { formatTime, formatTimeWithMs } from "../utils/time";

// 导入 GlobalSearchResult 类型
type GlobalSearchResult = { kind: "song"; song: Song } | { kind: "favorite"; favorite: Favorite };

export interface AppModalsProps {
    // modal state flags
    modals: {
        themeModal: boolean;
        themeEditorModal: boolean;
        themeDetailModal: boolean;
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
    modalRadiusDraft: number;
    notificationRadiusDraft: number;
    componentRadiusDraft: number;
    coverRadiusDraft: number;
    modalColorDraft: string;
    modalOpacityDraft: number;
    modalBlurDraft: number;
    windowControlsPosDraft: string;
    colorSchemeDraft: string;
    savingTheme: boolean;
    fileDraftInputRef: React.RefObject<HTMLInputElement>;

    // global data
    favorites: Favorite[];
    queue: Song[];
    currentIndex: number;
    currentSong: Song | null;

    // search / global
    globalSearchTerm: string;
    globalSearchResults: GlobalSearchResult[];
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
    selectedMyCollectionId: number | null;

    // handlers
    closeModal: (name: keyof AppModalsProps["modals"]) => void;
    onSelectTheme: (theme: Theme) => void;
    onViewTheme: (theme: Theme) => void;
    onEditTheme: (theme: Theme) => void;
    onDeleteTheme: (id: string) => void | Promise<void>;
    onCreateTheme: () => void;
    onThemeNameChange: (v: string) => void;
    onThemeColorChange: (v: string) => void;
    onBackgroundColorChange: (v: string) => void;
    onBackgroundOpacityChange: (v: number) => void;
    onBackgroundImageChange: (v: string) => void;
    onBackgroundBlurChange: (v: number) => void;
    onClearBackgroundImage: () => void;
    onPanelColorChange: (v: string) => void;
    onPanelOpacityChange: (v: number) => void;
    onPanelBlurChange: (v: number) => void;
    onPanelRadiusChange: (v: number) => void;
    onControlColorChange: (v: string) => void;
    onControlOpacityChange: (v: number) => void;
    onControlBlurChange: (v: number) => void;
    onTextColorPrimaryChange: (v: string) => void;
    onTextColorSecondaryChange: (v: string) => void;
    onFavoriteCardColorChange: (v: string) => void;
    onCardOpacityChange: (v: number) => void;
    onModalRadiusChange: (v: number) => void;
    onNotificationRadiusChange: (v: number) => void;
    onComponentRadiusChange: (v: number) => void;
    onCoverRadiusChange: (v: number) => void;
    onModalColorChange: (v: string) => void;
    onModalOpacityChange: (v: number) => void;
    onModalBlurChange: (v: number) => void;
    onWindowControlsPosChange: (v: string) => void;
    onColorSchemeChange: (v: string) => void;
    onSubmitTheme: () => Promise<void>;
    onCancelThemeEdit: () => void;
    onBackgroundFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

    onAddToFavorite: (fav: Favorite) => Promise<void> | void;
    onPlaylistSelect: (song: Song, index: number) => void;
    onPlaylistReorder: (from: number, to: number) => void;
    onPlaylistRemove: (idx: number) => void;

    editingFavName: string;
    onEditingFavNameChange: (v: string) => void;
    onSaveEditFavorite: () => void;

    onLoginSuccess: () => void;
    onClearLoginCache: () => void;
    onClearThemeCache: () => void;
    onOpenDownloadsFolder: () => void;
    onOpenDatabaseFile: () => void;
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
    onMyCollectionSelect: (id: number | null) => void;
    onFetchMyCollections: () => void;

    onGlobalTermChange: (v: string) => void;
    onResolveBVAndAdd: () => void | Promise<void>;
    onRemoteSearch: () => void | Promise<void>;
    onResultClick: (result: GlobalSearchResult) => void;
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
    formatTime: (v: number) => string;
    formatTimeWithMs: (v: number) => string;

    // theme derived
    panelStyles?: React.CSSProperties;
    derived?: any;
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
        colorSchemeDraft,
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
        onViewTheme,
        onEditTheme,
        onDeleteTheme,
        onCreateTheme,
        onThemeNameChange,
        onThemeColorChange,
        onBackgroundColorChange,
        onBackgroundOpacityChange,
        onBackgroundImageChange,
        onBackgroundBlurChange,
        onClearBackgroundImage,
        onPanelColorChange,
        onPanelOpacityChange,
        onPanelBlurChange,
        onPanelRadiusChange,
        onControlColorChange,
        onControlOpacityChange,
        onControlBlurChange,
        onTextColorPrimaryChange,
        onTextColorSecondaryChange,
        onFavoriteCardColorChange,
        onCardOpacityChange,
        onModalRadiusChange,
        onNotificationRadiusChange,
        onComponentRadiusChange,
        onCoverRadiusChange,
        onModalColorChange,
        onModalOpacityChange,
        onModalBlurChange,
        onWindowControlsPosChange,
        onColorSchemeChange,
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
        onOpenDatabaseFile,
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
        formatTime,
        formatTimeWithMs,
        panelStyles,
        derived,
    } = props;

    return (
        <>
            <ThemeManagerModal
                opened={modals.themeModal}
                onClose={() => closeModal("themeModal")}
                themes={themes}
                currentThemeId={currentThemeId}
                onSelectTheme={onSelectTheme}
                onViewTheme={onViewTheme}
                onEditTheme={onEditTheme}
                onDeleteTheme={onDeleteTheme}
                onCreateTheme={onCreateTheme}
                accentColor={themeColor}
                panelStyles={panelStyles}
                derived={derived}
            />

            <ThemeDetailModal
                opened={modals.themeEditorModal}
                onClose={onCancelThemeEdit}
                onCancel={onCancelThemeEdit}
                editingThemeId={editingThemeId}
                newThemeName={newThemeName}
                onNameChange={onThemeNameChange}
                themeColorDraft={themeColorDraft}
                onThemeColorChange={onThemeColorChange}
                backgroundColorDraft={backgroundColorDraft}
                onBackgroundColorChange={onBackgroundColorChange}
                backgroundOpacityDraft={backgroundOpacityDraft}
                onBackgroundOpacityChange={onBackgroundOpacityChange}
                backgroundImageUrlDraft={backgroundImageUrlDraft}
                onBackgroundImageChange={onBackgroundImageChange}
                backgroundBlurDraft={backgroundBlurDraft}
                onBackgroundBlurChange={onBackgroundBlurChange}
                onClearBackgroundImage={onClearBackgroundImage}
                panelColorDraft={panelColorDraft}
                onPanelColorChange={onPanelColorChange}
                panelOpacityDraft={panelOpacityDraft}
                onPanelOpacityChange={onPanelOpacityChange}
                panelBlurDraft={panelBlurDraft}
                onPanelBlurChange={onPanelBlurChange}
                panelRadiusDraft={panelRadiusDraft}
                onPanelRadiusChange={onPanelRadiusChange}
                controlColorDraft={controlColorDraft}
                onControlColorChange={onControlColorChange}
                controlOpacityDraft={controlOpacityDraft}
                onControlOpacityChange={onControlOpacityChange}
                controlBlurDraft={controlBlurDraft}
                onControlBlurChange={onControlBlurChange}
                textColorPrimaryDraft={textColorPrimaryDraft}
                onTextColorPrimaryChange={onTextColorPrimaryChange}
                textColorSecondaryDraft={textColorSecondaryDraft}
                onTextColorSecondaryChange={onTextColorSecondaryChange}
                favoriteCardColorDraft={favoriteCardColorDraft}
                onFavoriteCardColorChange={onFavoriteCardColorChange}
                cardOpacityDraft={cardOpacityDraft}
                onCardOpacityChange={onCardOpacityChange}
                modalRadiusDraft={modalRadiusDraft}
                onModalRadiusChange={onModalRadiusChange}
                notificationRadiusDraft={notificationRadiusDraft}
                onNotificationRadiusChange={onNotificationRadiusChange}
                componentRadiusDraft={componentRadiusDraft}
                onComponentRadiusChange={onComponentRadiusChange}
                coverRadiusDraft={coverRadiusDraft}
                onCoverRadiusChange={onCoverRadiusChange}
                modalColorDraft={modalColorDraft}
                onModalColorChange={onModalColorChange}
                modalOpacityDraft={modalOpacityDraft}
                onModalOpacityChange={onModalOpacityChange}
                modalBlurDraft={modalBlurDraft}
                onModalBlurChange={onModalBlurChange}
                windowControlsPosDraft={windowControlsPosDraft}
                onWindowControlsPosChange={onWindowControlsPosChange}
                colorSchemeDraft={colorSchemeDraft}
                onColorSchemeChange={onColorSchemeChange}
                onSubmit={onSubmitTheme}
                savingTheme={savingTheme}
                fileInputRef={fileDraftInputRef}
                onBackgroundFileChange={onBackgroundFileChange}
                isReadOnly={false}
            />

            <ThemeDetailModal
                opened={modals.themeDetailModal}
                onClose={() => closeModal("themeDetailModal")}
                onCancel={() => closeModal("themeDetailModal")}
                editingThemeId={editingThemeId}
                newThemeName={newThemeName}
                onNameChange={onThemeNameChange}
                themeColorDraft={themeColorDraft}
                onThemeColorChange={onThemeColorChange}
                backgroundColorDraft={backgroundColorDraft}
                onBackgroundColorChange={onBackgroundColorChange}
                backgroundOpacityDraft={backgroundOpacityDraft}
                onBackgroundOpacityChange={onBackgroundOpacityChange}
                backgroundImageUrlDraft={backgroundImageUrlDraft}
                onBackgroundImageChange={onBackgroundImageChange}
                backgroundBlurDraft={backgroundBlurDraft}
                onBackgroundBlurChange={onBackgroundBlurChange}
                onClearBackgroundImage={onClearBackgroundImage}
                panelColorDraft={panelColorDraft}
                onPanelColorChange={onPanelColorChange}
                panelOpacityDraft={panelOpacityDraft}
                onPanelOpacityChange={onPanelOpacityChange}
                panelBlurDraft={panelBlurDraft}
                onPanelBlurChange={onPanelBlurChange}
                panelRadiusDraft={panelRadiusDraft}
                onPanelRadiusChange={onPanelRadiusChange}
                controlColorDraft={controlColorDraft}
                onControlColorChange={onControlColorChange}
                controlOpacityDraft={controlOpacityDraft}
                onControlOpacityChange={onControlOpacityChange}
                controlBlurDraft={controlBlurDraft}
                onControlBlurChange={onControlBlurChange}
                textColorPrimaryDraft={textColorPrimaryDraft}
                onTextColorPrimaryChange={onTextColorPrimaryChange}
                textColorSecondaryDraft={textColorSecondaryDraft}
                onTextColorSecondaryChange={onTextColorSecondaryChange}
                favoriteCardColorDraft={favoriteCardColorDraft}
                onFavoriteCardColorChange={onFavoriteCardColorChange}
                cardOpacityDraft={cardOpacityDraft}
                onCardOpacityChange={onCardOpacityChange}
                modalRadiusDraft={modalRadiusDraft}
                onModalRadiusChange={onModalRadiusChange}
                notificationRadiusDraft={notificationRadiusDraft}
                onNotificationRadiusChange={onNotificationRadiusChange}
                componentRadiusDraft={componentRadiusDraft}
                onComponentRadiusChange={onComponentRadiusChange}
                coverRadiusDraft={coverRadiusDraft}
                onCoverRadiusChange={onCoverRadiusChange}
                modalColorDraft={modalColorDraft}
                onModalColorChange={onModalColorChange}
                modalOpacityDraft={modalOpacityDraft}
                onModalOpacityChange={onModalOpacityChange}
                modalBlurDraft={modalBlurDraft}
                onModalBlurChange={onModalBlurChange}
                windowControlsPosDraft={windowControlsPosDraft}
                onWindowControlsPosChange={onWindowControlsPosChange}
                colorSchemeDraft={colorSchemeDraft}
                onColorSchemeChange={onColorSchemeChange}
                onSubmit={onSubmitTheme}
                savingTheme={savingTheme}
                fileInputRef={fileDraftInputRef}
                onBackgroundFileChange={onBackgroundFileChange}
                isReadOnly={true}
            />

            <AddToFavoriteModal
                opened={modals.addFavoriteModal}
                onClose={() => closeModal("addFavoriteModal")}
                favorites={favorites}
                currentSong={currentSong}
                themeColor={themeColor}
                onAdd={onAddToFavorite}
                panelStyles={panelStyles}
                derived={derived}
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
                derived={derived}
            />

            <Modal
                opened={modals.editFavModal}
                onClose={() => closeModal("editFavModal")}
                title="编辑歌单"
                centered
                size="sm"
                styles={{
                    content: {
                        ...panelStyles,
                        backgroundColor: derived?.panelBackground,
                        color: derived?.textColorPrimary,
                    },
                    header: {
                        backgroundColor: "transparent",
                        color: derived?.textColorPrimary,
                    },
                    title: {
                        fontWeight: 600,
                    }
                }}
                className="normal-panel"
            >
                <Stack gap="md">
                    <TextInput
                        label="歌单名称"
                        value={editingFavName}
                        onChange={(e) => onEditingFavNameChange(e.currentTarget.value)}
                        placeholder="输入歌单名称"
                        styles={{
                            input: {
                                backgroundColor: derived?.controlBackground,
                                color: derived?.textColorPrimary,
                                borderColor: "transparent",
                            },
                            label: {
                                color: derived?.textColorPrimary,
                            }
                        }}
                    />
                    <Group justify="flex-end" gap="sm">
                        <Button variant="subtle" color={themeColor} onClick={() => closeModal("editFavModal")} style={{ color: derived?.textColorPrimary }}>
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
                panelStyles={panelStyles}
                derived={derived}
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
                onOpenDatabaseFile={onOpenDatabaseFile}
                onClearMusicCache={onClearMusicCache}
                onClearAllCache={onClearAllCache}
                panelStyles={panelStyles}
                derived={derived}
            />

            <DownloadManagerModal
                opened={modals.downloadModal}
                managingSong={managingSong}
                confirmDeleteDownloaded={confirmDeleteDownloaded}
                onClose={onDownloadModalClose}
                onOpenFile={onOpenDownloadedFile}
                onDeleteFile={onDeleteDownloadedFile}
                onToggleConfirmDelete={onToggleConfirmDelete}
                panelStyles={panelStyles}
                derived={derived}
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
                panelStyles={panelStyles}
                derived={derived}
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
                panelStyles={panelStyles}
                derived={derived}
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
                formatTimeWithMs={formatTimeWithMs}
                panelStyles={panelStyles}
                derived={derived}
            />
        </>
    );
};

export default AppModals;
