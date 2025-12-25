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
  seek: (pos: number) => void;
  playPrev: () => void;
  togglePlay: () => void;
  playNext: () => void;
  isPlaying: boolean;
  playMode: "single" | "repeat" | "random";
  onTogglePlayMode: () => void;
  onAddToFavorite: () => void;
  onShowPlaylist: () => void;
  onDownload: () => void;
  isDownloaded: boolean;
  volume: number;
  changeVolume: (value: number) => void;
  songsCount: number;
  panelBackground: string;
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
  seek,
  playPrev,
  togglePlay,
  playNext,
  isPlaying,
  playMode,
  onTogglePlayMode,
  onAddToFavorite,
  onShowPlaylist,
  onDownload,
  isDownloaded,
  volume,
  changeVolume,
  songsCount,
  panelBackground,
}) => {
  return (
    <Paper
      shadow="sm"
      radius="md"
      p="md"
      withBorder
      pos="sticky"
      bottom={0}
      style={{ zIndex: 5, backgroundColor: panelBackground }}
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
        seek={seek}
        playPrev={playPrev}
        togglePlay={togglePlay}
        playNext={playNext}
        isPlaying={isPlaying}
        playMode={playMode}
        onTogglePlayMode={onTogglePlayMode}
        onAddToFavorite={onAddToFavorite}
        onShowPlaylist={onShowPlaylist}
        onDownload={onDownload}
        isDownloaded={isDownloaded}
        volume={volume}
        changeVolume={changeVolume}
        songsCount={songsCount}
      />
    </Paper>
  );
};

export default ControlsPanel;
