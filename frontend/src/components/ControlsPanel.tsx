import React from "react";
import { Paper } from "@mantine/core";
import PlayerBar from "./PlayerBar";
import { Song } from "../types";

interface ControlsPanelProps {
    themeColor: string;
    computedColorScheme: "light" | "dark";
    currentSong: Song | null;
    cover: string | undefined;
    progressInInterval: number;
    intervalStart: number;
    intervalLength: number;
    duration: number;
    formatTime: (ms: number) => string;
    formatTimeWithMs: (ms: number) => string;
    seek: (pos: number) => void;
    playPrev: () => void;
    togglePlay: () => void;
    playNext: () => void;
    isPlaying: boolean;
    playMode: "loop" | "random" | "single";
    onTogglePlayMode: () => void;
    onAddToFavorite: () => void;
    onShowPlaylist: () => void;
    onDownloadSong: () => void;
    onManageDownload: () => void;
    downloadedSongIds: Set<string>;
    volume: number;
    changeVolume: (value: number) => void;
    songsCount: number;
    panelBackground: string;
    panelStyles: React.CSSProperties;
    componentRadius?: number;
    coverRadius?: number;
    controlBackground?: string;
    controlStyles?: React.CSSProperties;
    textColorPrimary?: string;
    textColorSecondary?: string;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({
    themeColor,
    computedColorScheme,
    currentSong,
    cover,
    progressInInterval,
    intervalStart,
    intervalLength,
    duration,
    formatTime,
    formatTimeWithMs,
    seek,
    playPrev,
    togglePlay,
    playNext,
    isPlaying,
    playMode,
    onTogglePlayMode,
    onAddToFavorite,
    onShowPlaylist,
    onDownloadSong,
    onManageDownload,
    downloadedSongIds,
    volume,
    changeVolume,
    songsCount,
    panelBackground,
    panelStyles,
    componentRadius,
    coverRadius,
    controlBackground,
    controlStyles,
    textColorPrimary,
    textColorSecondary,
}) => {
    return (
        <Paper
            shadow="sm"
            px="md"
            pb="md"
            pt="lg"
            withBorder
            pos="sticky"
            bottom={0}
            className="glass-panel"
            style={{ ...panelStyles, zIndex: 5, backgroundColor: panelBackground }}
        >
            <PlayerBar
                themeColor={themeColor}
                computedColorScheme={computedColorScheme}
                currentSong={currentSong}
                cover={cover}
                progressInInterval={progressInInterval}
                intervalStart={intervalStart}
                intervalLength={intervalLength}
                duration={duration}
                formatTime={formatTime}
                formatTimeWithMs={formatTimeWithMs}
                seek={seek}
                playPrev={playPrev}
                togglePlay={togglePlay}
                playNext={playNext}
                isPlaying={isPlaying}
                playMode={playMode}
                onTogglePlayMode={onTogglePlayMode}
                onAddToFavorite={onAddToFavorite}
                onShowPlaylist={onShowPlaylist}
                onDownloadSong={onDownloadSong}
                onManageDownload={onManageDownload}
                downloadedSongIds={downloadedSongIds}
                volume={volume}
                changeVolume={changeVolume}
                songsCount={songsCount}
                componentRadius={componentRadius}
                coverRadius={coverRadius}
                controlBackground={controlBackground}
                controlStyles={controlStyles}
                textColorPrimary={textColorPrimary}
                textColorSecondary={textColorSecondary}
            />
        </Paper>
    );
};

export default ControlsPanel;
