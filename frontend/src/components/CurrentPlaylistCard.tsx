import React from "react";
import { ActionIcon, Button, Card, Flex, Group, ScrollArea, Stack, Text, TextInput, Transition } from "@mantine/core";
import { Download, SquarePlus, Trash2 } from "lucide-react";
import { Favorite, Song } from "../types";

export type CurrentPlaylistCardProps = {
    panelBackground: string;
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
};

const CurrentPlaylistCard: React.FC<CurrentPlaylistCardProps> = ({
    panelBackground,
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
}) => {
    return (
        <Card flex={1} shadow="sm" padding="md" radius="md" withBorder miw={0} h="100%" style={{ minHeight: 0, backgroundColor: panelBackground, display: "flex", flexDirection: "column" }}>
            <Group justify="space-between" mb="sm">
                <Text fw={600} size="sm">{currentFav?.title || "选择歌单"}</Text>
                <Group gap="xs">
                    <Button size="xs" variant="light" color={themeColor} disabled={!currentFav} onClick={onPlayAll}>播放全部</Button>
                    <Button size="xs" variant="light" color="blue" disabled={!currentFav} onClick={onDownloadAll}>下载全部</Button>
                    <Button size="xs" variant="light" color={themeColor} disabled={!currentFav} onClick={onAddSong}>+ 添加</Button>
                </Group>
            </Group>
            <TextInput
                placeholder="搜索歌曲..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.currentTarget.value)}
                size="sm"
                mb="sm"
            />
            <ScrollArea style={{ flex: 1, minHeight: 0 }}>
                {currentFav ? (
                    <Stack gap="xs" pb="sm">
                        {currentFavSongs.map((s) => {
                            const isDownloaded = downloadedSongIds.has(s.id);
                            const isConfirmingRemove = confirmRemoveSongId === s.id;
                            return (
                                <Group key={s.id} gap="xs" wrap="nowrap" align="stretch">
                                    <Button
                                        variant={currentSongId === s.id ? "filled" : "subtle"}
                                        color={themeColor}
                                        justify="flex-start"
                                        onClick={() => onPlaySong(s)}
                                        style={{ flex: 1 }}
                                    >
                                        <Stack gap={2} align="flex-start">
                                            <Text fw={500} size="sm">{s.name}</Text>
                                            <Text size="xs" c="dimmed">{s.singer || "未知歌手"}</Text>
                                        </Stack>
                                    </Button>
                                    <Group gap={4} wrap="nowrap">
                                        <ActionIcon
                                            variant={isDownloaded ? "filled" : "default"}
                                            color={isDownloaded ? "teal" : undefined}
                                            size="lg"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDownloadSong(s);
                                            }}
                                            title={isDownloaded ? "已下载：管理下载文件" : "下载歌曲"}
                                        >
                                            <Download size={16} />
                                        </ActionIcon>
                                        <ActionIcon
                                            variant="default"
                                            size="lg"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAddSongToFavorite(s);
                                            }}
                                            title="添加到收藏"
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
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onToggleConfirmRemove(s.id);
                                                    }}
                                                    title="移出歌单"
                                                    style={styles}
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
                        <Text c="dimmed">请在右侧选择一个歌单</Text>
                    </Flex>
                )}
            </ScrollArea>
        </Card>
    );
};

export default CurrentPlaylistCard;
