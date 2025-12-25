import React from "react";
import { ActionIcon, Box, Group, Image, Slider, Stack, Text } from "@mantine/core";
import { Download, ListMusic, Music, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, SquarePlus } from "lucide-react";
import { Song } from "../types";

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
    seek: (value: number) => void;
    playPrev: () => void;
    togglePlay: () => void;
    playNext: () => void;
    isPlaying: boolean;
    playMode: "order" | "random" | "single";
    onTogglePlayMode: () => void;
    onAddToFavorite: () => void;
    onShowPlaylist: () => void;
    onDownload: () => void;
    isDownloaded: boolean;
    volume: number;
    changeVolume: (value: number) => void;
    songsCount: number;
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
    onDownload,
    isDownloaded,
    volume,
    changeVolume,
    songsCount,
}) => {
    return (
        <Group align="flex-start" gap="md">
            {cover ? (
                <Image
                    src={cover}
                    w={100}
                    h={100}
                    radius="md"
                    fit="cover"
                    style={{ flexShrink: 0, minWidth: 100, minHeight: 100, maxWidth: 100, maxHeight: 100 }}
                />
            ) : (
                <Box
                    w={100}
                    h={100}
                    bg={computedColorScheme === "dark" ? "dark.6" : "gray.2"}
                    style={{
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        minWidth: 100,
                        minHeight: 100,
                        maxWidth: 100,
                        maxHeight: 100,
                    }}
                >
                    <Music size={48} color="currentColor" />
                </Box>
            )}

            <Stack gap="sm" style={{ flex: 1 }}>
                <Stack gap="xs">
                    <Slider
                        value={progressInInterval}
                        onChange={(v) => seek(intervalStart + v)}
                        min={0}
                        max={intervalLength || 1}
                        step={0.1}
                        w="100%"
                        label={(value) => formatTime(intervalStart + value)}
                        style={{ '--slider-color': themeColor } as any}
                    />
                    <Group justify="space-between" align="center">
                        <Text size="xs" c="dimmed">
                            {formatTime(progressInInterval)}
                        </Text>
                        <Text size="xs" c="dimmed">
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
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
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
                            c="dimmed"
                            style={{
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
                        <ActionIcon variant="outline" color={themeColor} radius="xl" size="lg" onClick={playPrev} title="上一首">
                            <SkipBack size={16} />
                        </ActionIcon>
                        <ActionIcon
                            variant="filled"
                            radius="xl"
                            size="xl"
                            color={themeColor}
                            onClick={togglePlay}
                            disabled={!currentSong?.streamUrl}
                            title={isPlaying ? "暂停" : "播放"}
                        >
                            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                        </ActionIcon>
                        <ActionIcon variant="outline" color={themeColor} radius="xl" size="lg" onClick={playNext} title="下一首">
                            <SkipForward size={16} />
                        </ActionIcon>
                    </Group>

                    <Group gap="xs" align="center">
                        <ActionIcon
                            variant="default"
                            size="lg"
                            onClick={onAddToFavorite}
                            title="添加到收藏"
                            disabled={!currentSong}
                        >
                            <SquarePlus size={16} />
                        </ActionIcon>
                        <ActionIcon
                            variant="default"
                            size="lg"
                            onClick={onShowPlaylist}
                            title="打开播放列表"
                            disabled={songsCount === 0}
                        >
                            <ListMusic size={16} />
                        </ActionIcon>
                        <ActionIcon
                            variant={isDownloaded ? "filled" : "default"}
                            color={isDownloaded ? "teal" : undefined}
                            size="lg"
                            onClick={onDownload}
                            title={isDownloaded ? "已下载：管理下载文件" : "下载当前歌曲"}
                            disabled={!currentSong}
                        >
                            <Download size={16} />
                        </ActionIcon>
                        <ActionIcon
                            variant="default"
                            size="lg"
                            onClick={onTogglePlayMode}
                            title={`播放模式: ${playMode === "order" ? "顺序" : playMode === "random" ? "随机" : "单曲循环"}`}
                        >
                            {playMode === "order" ? <Repeat size={16} /> : playMode === "random" ? <Shuffle size={16} /> : <Repeat1 size={16} />}
                        </ActionIcon>
                        <Group gap={6} align="center">
                            <Text size="xs" c="dimmed">音量</Text>
                            <Slider
                                value={volume * 100}
                                onChange={(v) => changeVolume(v / 100)}
                                min={0}
                                max={100}
                                step={1}
                                w={140}
                                style={{ '--slider-color': themeColor } as any}
                            />
                            <Text size="xs" c="dimmed">{Math.round(volume * 100)}%</Text>
                        </Group>
                    </Group>
                </Group>
            </Stack>
        </Group>
    );
};

export default PlayerBar;
