import React from "react";
import { ActionIcon, Button, Card, Flex, Group, ScrollArea, Stack, Text, TextInput, Transition } from "@mantine/core";
import { Download, SquarePlus, Trash2 } from "lucide-react";
import { Favorite, Song } from "../../types";

export type CurrentPlaylistCardProps = {
    panelBackground: string;
    panelStyles: React.CSSProperties;
    currentFav: Favorite | null;
    currentFavSongs: Song[];
    currentSongId?: string | null;
    searchQuery: string;
    onSearchChange: (value: string) => void;
    onPlaySong: (song: Song) => void;  // 只需要 song 参数，不再需要 list
    onAddSong: () => void;
    themeColor: string;
    downloadedSongIds: Set<string>;
    onDownloadSong: (song: Song) => void;
    onAddSongToFavorite: (song: Song) => void;
    onRemoveSongFromPlaylist: (song: Song) => void;
    confirmRemoveSongId: string | null;
    onToggleConfirmRemove: (songId: string | null) => void;
    onPlayAll: () => void;
    onDownloadAll: () => void;
    componentRadius?: number;
    controlBackground?: string;
    controlStyles?: React.CSSProperties;
    textColorPrimary?: string;
    textColorSecondary?: string;
};

const CurrentPlaylistCard: React.FC<CurrentPlaylistCardProps> = ({
    panelBackground,
    panelStyles,
    currentFav,
    currentFavSongs,
    currentSongId,
    searchQuery,
    onSearchChange,
    onPlaySong,
    onAddSong,
    themeColor,
    downloadedSongIds,
    onDownloadSong,
    onAddSongToFavorite,
    onRemoveSongFromPlaylist,
    confirmRemoveSongId,
    onToggleConfirmRemove,
    onPlayAll,
    onDownloadAll,
    componentRadius = 8,
    controlBackground,
    controlStyles,
    textColorPrimary,
    textColorSecondary,
}) => {
    // 过滤当前歌单的歌曲，基于实时搜索词（名称或歌手）
    const normalizedQuery = (searchQuery || "").trim().toLowerCase();
    const displayedSongs = normalizedQuery
        ? currentFavSongs.filter((s) =>
            (s.name || "").toLowerCase().includes(normalizedQuery) ||
            (s.singer || "").toLowerCase().includes(normalizedQuery)
        )
        : currentFavSongs;

    return (
        <Card flex={1} shadow="sm" padding="md" withBorder miw={0} h="100%" className="glass-panel" style={{ ...panelStyles, minHeight: 0, backgroundColor: panelBackground, display: "flex", flexDirection: "column" }}>
            <Group justify="space-between" mb="sm">
                <Text fw={600} size="sm" style={{ color: textColorPrimary, flex: 1, minWidth: 0 }} lineClamp={1}>
                    {currentFav?.title || "选择歌单"}
                </Text>
                <Group gap="xs">
                    <Button size="xs" variant="light" color={themeColor} disabled={!currentFav} onClick={onPlayAll} radius={componentRadius}>播放全部</Button>
                    <Button size="xs" variant="light" color={themeColor} disabled={!currentFav} onClick={onDownloadAll} radius={componentRadius}>下载全部</Button>
                </Group>
            </Group>
            <TextInput
                placeholder="搜索歌曲..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.currentTarget.value)}
                size="sm"
                mb="sm"
                radius={componentRadius}
                styles={{
                    input: {
                        backgroundColor: controlBackground,
                        color: textColorPrimary,
                        borderColor: "transparent",
                    }
                }}
            />
            <ScrollArea style={{ flex: 1, minHeight: 0 }}>
                {currentFav ? (
                    <Stack gap="xs" pb="sm">
                        {displayedSongs.length === 0 && (
                            <Flex align="center" justify="center" py="md">
                                <Text c="dimmed" size="sm">未找到匹配的歌曲</Text>
                            </Flex>
                        )}
                        {displayedSongs.map((s) => {
                            const isDownloaded = downloadedSongIds.has(s.id);
                            const isConfirmingRemove = confirmRemoveSongId === s.id;
                            const isSelected = currentSongId === s.id;
                            return (
                                <Group key={s.id} gap="xs" wrap="nowrap" align="stretch">
                                    <Button
                                        variant={isSelected ? "filled" : "subtle"}
                                        color={themeColor}
                                        justify="flex-start"
                                        onClick={() => onPlaySong(s)}
                                        radius={componentRadius}
                                        style={{
                                            flex: 1,
                                            ...(isSelected ? { backgroundColor: themeColor } : controlStyles),
                                            color: isSelected ? "white" : textColorPrimary,
                                        }}
                                    >
                                        <Stack gap={2} align="flex-start" style={{ width: "100%", minWidth: 0, overflow: "hidden", textAlign: "left" }}>
                                            <Text fw={500} size="sm" style={{ color: "inherit", width: "100%", textAlign: "left" }} truncate>
                                                {s.name}
                                            </Text>
                                            <Text size="xs" style={{ color: isSelected ? "rgba(255,255,255,0.7)" : textColorSecondary, width: "100%", textAlign: "left" }} truncate>
                                                {s.singer || "未知歌手"}
                                            </Text>
                                        </Stack>
                                    </Button>
                                    <Group gap={4} wrap="nowrap">
                                        <ActionIcon
                                            variant={isDownloaded ? "filled" : "default"}
                                            color={themeColor}
                                            size="lg"
                                            radius={componentRadius}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDownloadSong(s);
                                            }}
                                            title={isDownloaded ? "已下载：管理下载文件" : "下载歌曲"}
                                            style={{
                                                ...(isDownloaded ? { backgroundColor: themeColor } : controlStyles),
                                                color: isDownloaded ? "white" : textColorPrimary,
                                                borderColor: "transparent"
                                            }}
                                        >
                                            <Download size={16} />
                                        </ActionIcon>
                                        <ActionIcon
                                            variant="default"
                                            size="lg"
                                            radius={componentRadius}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAddSongToFavorite(s);
                                            }}
                                            title="添加到收藏"
                                            style={{
                                                ...controlStyles,
                                                color: textColorPrimary,
                                                borderColor: "transparent"
                                            }}
                                        >
                                            <SquarePlus size={16} />
                                        </ActionIcon>
                                        <Transition
                                            mounted={!isConfirmingRemove}
                                            transition="fade"
                                            duration={200}
                                        >
                                            {(styles) => (
                                                <ActionIcon
                                                    variant="default"
                                                    size="lg"
                                                    radius={componentRadius}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onToggleConfirmRemove(s.id);
                                                    }}
                                                    title="移出歌单"
                                                    style={{
                                                        ...styles,
                                                        ...controlStyles,
                                                        color: "red",
                                                        borderColor: "transparent"
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </ActionIcon>
                                            )}
                                        </Transition>
                                        <Transition
                                            mounted={isConfirmingRemove}
                                            transition="fade"
                                            duration={200}
                                        >
                                            {(styles) => (
                                                <ActionIcon
                                                    color="red"
                                                    variant="filled"
                                                    size="lg"
                                                    radius={componentRadius}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRemoveSongFromPlaylist(s);
                                                    }}
                                                    title="确认移出"
                                                    style={styles}
                                                >
                                                    <Trash2 size={16} />
                                                </ActionIcon>
                                            )}
                                        </Transition>
                                    </Group>
                                </Group>
                            );
                        })}
                    </Stack>
                ) : (
                    <Flex align="center" justify="center" h="100%">
                        <Text style={{ color: textColorSecondary }}>请从左侧选择一个歌单</Text>
                    </Flex>
                )}
            </ScrollArea>
        </Card>
    );
};

export default CurrentPlaylistCard;
