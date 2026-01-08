import React, { useState } from "react";
import { ActionIcon, Box, Group, Image, Slider, Stack, Text } from "@mantine/core";
import { Download, ListMusic, Music, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, SquarePlus, Volume, Volume1, Volume2, VolumeX } from "lucide-react";
import { Song } from "../../types";
import { useImageProxy } from "../../hooks/ui/useImageProxy";

export type PlayerBarProps = {
    themeColor: string;
    computedColorScheme: string;
    currentSong: Song | null;
    cover?: string;
    progressInInterval: number;
    intervalStart: number;
    intervalLength: number;
    duration: number;
    formatTime: (seconds: number) => string;
    formatTimeWithMs: (seconds: number) => string;
    seek: (value: number) => void;
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
    componentRadius?: number;
    coverRadius?: number;
    controlBackground?: string;
    controlStyles?: React.CSSProperties;
    textColorPrimary?: string;
    textColorSecondary?: string;
};

const PlayerBar: React.FC<PlayerBarProps> = ({
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
    onDownloadSong,
    onManageDownload,
    downloadedSongIds,
    volume,
    changeVolume,
    songsCount,
    componentRadius = 8,
    coverRadius = 8,
    controlBackground,
    controlStyles,
    textColorPrimary,
    textColorSecondary,
}) => {
    const { getProxiedImageUrlSync } = useImageProxy();
    const isDownloaded = currentSong ? downloadedSongIds.has(currentSong.id) : false;
    const iconStyle = { color: textColorPrimary };
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [previousVolume, setPreviousVolume] = useState<number>(volume || 0.5);

    const handleMuteToggle = () => {
        if (isMuted) {
            // 取消静音，恢复到之前的音量
            setIsMuted(false);
            changeVolume(previousVolume > 0 ? previousVolume : 0.5);
        } else {
            // 进入静音状态
            setPreviousVolume(volume);
            setIsMuted(true);
            changeVolume(0);
        }
    };

    const handleVolumeChange = (value: number) => {
        // 当用户调节音量滑块时，自动取消静音状态
        if (isMuted) {
            setIsMuted(false);
        }
        changeVolume(value);
    };

    const getVolumeIcon = () => {
        if (isMuted) return <VolumeX size={16} />;
        if (volume === 0) return <Volume size={16} />;
        if (volume < 0.5) return <Volume1 size={16} />;
        return <Volume2 size={16} />;
    };

    return (
        <Group align="flex-start" gap="md">
            {cover ? (
                <Image
                    src={getProxiedImageUrlSync(cover)}
                    w={100}
                    h={100}
                    radius={coverRadius}
                    fit="cover"
                    style={{ flexShrink: 0, minWidth: 100, minHeight: 100, maxWidth: 100, maxHeight: 100 }}
                />
            ) : (
                <Box
                    w={100}
                    h={100}
                    bg={controlBackground || (computedColorScheme === "dark" ? "dark.6" : "gray.2")}
                    style={{
                        borderRadius: coverRadius,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        minWidth: 100,
                        minHeight: 100,
                        maxWidth: 100,
                        maxHeight: 100,
                        ...controlStyles,
                    }}
                >
                    <Music size={48} color={textColorSecondary || "currentColor"} />
                </Box>
            )}

            <Stack gap="sm" style={{ flex: 1 }}>
                <Stack gap="xs">
                    <Slider
                        value={progressInInterval}
                        onChange={(v) => seek(intervalStart + v)}
                        min={0}
                        max={intervalLength || 1}
                        step={0.05}
                        w="100%"
                        radius={componentRadius}
                        label={(value) => formatTime(intervalStart + value)}
                        style={{ '--slider-color': themeColor, marginTop: '12px' } as any}
                    />
                    <Group justify="space-between" align="center">
                        <Text size="xs" style={{ color: textColorSecondary }}>
                            {formatTime(progressInInterval)}
                        </Text>
                        <Text size="xs" style={{ color: textColorSecondary }}>
                            {formatTime(intervalLength || duration)}
                        </Text>
                    </Group>
                </Stack>

                <Group justify="space-between" align="center" gap="md">
                    <Stack gap={0} style={{ flex: 1, minWidth: 0, maxWidth: 300 }}>
                        <Box style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
                            <Text
                                size="lg"
                                fw={600}
                                style={{
                                    color: textColorPrimary,
                                    whiteSpace: "nowrap",
                                    animation: currentSong?.name && currentSong.name.length > 20 ? "scroll 10s linear infinite" : "none",
                                }}
                                title={currentSong?.name}
                            >
                                {currentSong?.name || "未选择歌曲"}
                            </Text>
                        </Box>
                        <Text
                            size="sm"
                            style={{
                                color: textColorSecondary,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                            title={currentSong?.singer}
                        >
                            {currentSong?.singer || "未知艺术家"}
                        </Text>
                    </Stack>

                    <Group gap="xs">
                        <ActionIcon
                            variant="subtle"
                            color={themeColor}
                            radius={componentRadius}
                            size="lg"
                            onClick={playPrev}
                            title="上一首"
                            style={{ ...controlStyles, color: textColorPrimary }}
                        >
                            <SkipBack size={16} />
                        </ActionIcon>
                        <ActionIcon
                            variant="filled"
                            radius={componentRadius}
                            size="xl"
                            color={themeColor}
                            onClick={togglePlay}
                            disabled={!currentSong?.streamUrl}
                            title={isPlaying ? "暂停" : "播放"}
                        >
                            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                        </ActionIcon>
                        <ActionIcon
                            variant="subtle"
                            color={themeColor}
                            radius={componentRadius}
                            size="lg"
                            onClick={playNext}
                            title="下一首"
                            style={{ ...controlStyles, color: textColorPrimary }}
                        >
                            <SkipForward size={16} />
                        </ActionIcon>
                    </Group>

                    <Group gap="xs" align="center">
                        <ActionIcon
                            variant="default"
                            size="lg"
                            radius={componentRadius}
                            onClick={onAddToFavorite}
                            title="添加到收藏"
                            disabled={!currentSong}
                            style={{ ...controlStyles, borderColor: "transparent", color: textColorPrimary }}
                        >
                            <SquarePlus size={16} />
                        </ActionIcon>
                        <ActionIcon
                            variant="default"
                            size="lg"
                            radius={componentRadius}
                            onClick={onShowPlaylist}
                            title="打开播放列表"
                            disabled={songsCount === 0}
                            style={{ ...controlStyles, borderColor: "transparent", color: textColorPrimary }}
                        >
                            <ListMusic size={16} />
                        </ActionIcon>
                        {!isDownloaded && (
                            <ActionIcon
                                variant="default"
                                size="lg"
                                radius={componentRadius}
                                onClick={onDownloadSong}
                                title="下载当前歌曲"
                                disabled={!currentSong}
                                style={{ ...controlStyles, borderColor: "transparent", color: textColorPrimary }}
                            >
                                <Download size={16} />
                            </ActionIcon>
                        )}
                        {isDownloaded && (
                            <ActionIcon
                                variant="filled"
                                color={themeColor}
                                size="lg"
                                radius={componentRadius}
                                onClick={onManageDownload}
                                title="管理下载文件"
                                disabled={!currentSong}
                            >
                                <Download size={16} />
                            </ActionIcon>
                        )}
                        <ActionIcon
                            variant="default"
                            size="lg"
                            radius={componentRadius}
                            onClick={onTogglePlayMode}
                            title={`播放模式: ${playMode === "loop" ? "列表循环" : playMode === "random" ? "随机" : "单曲循环"}`}
                            style={{ ...controlStyles, borderColor: "transparent", color: textColorPrimary }}
                        >
                            {playMode === "loop" ? <Repeat size={16} /> : playMode === "random" ? <Shuffle size={16} /> : <Repeat1 size={16} />}
                        </ActionIcon>
                        <Group gap={6} align="center">
                            <ActionIcon
                                variant="default"
                                size="lg"
                                radius={componentRadius}
                                onClick={handleMuteToggle}
                                title={isMuted ? "取消静音" : "静音"}
                                style={{ ...controlStyles, borderColor: "transparent", color: textColorPrimary }}
                            >
                                {getVolumeIcon()}
                            </ActionIcon>
                            <Slider
                                value={Math.round(volume * 100)}
                                onChange={(v) => handleVolumeChange(v / 100)}
                                min={0}
                                max={100}
                                step={1}
                                radius={componentRadius}
                                label={(v) => `${v}%`}
                                w={140}
                                style={{ '--slider-color': themeColor } as any}
                            />
                            <Text size="xs" style={{ color: textColorSecondary, width: 36, textAlign: 'right' }}>{Math.round(volume * 100)}%</Text>
                        </Group>
                    </Group>
                </Group>
            </Stack>
        </Group>
    );
};

export default PlayerBar;
