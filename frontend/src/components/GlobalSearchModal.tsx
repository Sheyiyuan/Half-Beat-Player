import React from "react";
import { ActionIcon, AspectRatio, Badge, Button, Group, Image, Modal, Paper, ScrollArea, Stack, Text, TextInput } from "@mantine/core";
import { Search } from "lucide-react";
import type { Song, Favorite } from "../types";

type GlobalSearchResult = { kind: "song"; song: Song } | { kind: "favorite"; favorite: Favorite };

interface GlobalSearchModalProps {
    opened: boolean;
    themeColor: string;
    globalSearchTerm: string;
    globalSearchResults: GlobalSearchResult[];
    remoteResults: Song[];
    remoteLoading: boolean;
    resolvingBV: boolean;
    onClose: () => void;
    onTermChange: (value: string) => void;
    onResolveBVAndAdd: () => void;
    onRemoteSearch: () => void;
    onResultClick: (result: GlobalSearchResult) => void;
    onAddFromRemote: (song: Song) => void;
}

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
    opened,
    themeColor,
    globalSearchTerm,
    globalSearchResults,
    remoteResults,
    remoteLoading,
    resolvingBV,
    onClose,
    onTermChange,
    onResolveBVAndAdd,
    onRemoteSearch,
    onResultClick,
    onAddFromRemote,
}) => {
    const handleEnter = (hasResult: boolean) => {
        if (hasResult) {
            onResultClick(globalSearchResults[0]);
        } else {
            onResolveBVAndAdd();
        }
    };

    const trimmedTerm = globalSearchTerm.trim();

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            size="lg"
            centered
            radius="md"
            padding="lg"
            title="搜索视频 (BV 号或链接)"
            overlayProps={{ blur: 10, opacity: 0.35 }}
        >
            <Stack gap="md">
                <TextInput
                    placeholder="输入 BV 号或完整链接，如 BV1xx... 或 https://www.bilibili.com/video/BV..."
                    value={globalSearchTerm}
                    onChange={(e) => onTermChange(e.currentTarget.value)}
                    leftSection={<Search size={14} />}
                    leftSectionPointerEvents="none"
                    autoFocus
                    disabled={resolvingBV}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !resolvingBV) {
                            handleEnter(globalSearchResults.length > 0);
                        }
                    }}
                />
                <ScrollArea h={380} type="auto">
                    {globalSearchResults.length === 0 && remoteResults.length === 0 ? (
                        <Stack gap="md" align="center" py="xl">
                            <Text c="dimmed" size="sm" ta="center">
                                输入 BV 号或完整链接解析视频音频
                            </Text>
                            <Text c="dimmed" size="xs" ta="center">
                                本地已有歌曲也会显示在这里
                            </Text>
                            {trimmedTerm && (
                                <Paper withBorder p="md" w="100%">
                                    <Group justify="space-between">
                                        <Stack gap={4}>
                                            <Text size="sm" fw={500}>解析并添加到歌单</Text>
                                            <Text size="xs" c="dimmed" lineClamp={1}>{globalSearchTerm}</Text>
                                        </Stack>
                                        <ActionIcon
                                            size="lg"
                                            variant="filled"
                                            color={themeColor}
                                            onClick={onResolveBVAndAdd}
                                            loading={resolvingBV}
                                            disabled={resolvingBV}
                                        >
                                            <Search size={16} />
                                        </ActionIcon>
                                    </Group>
                                </Paper>
                            )}
                            {trimmedTerm && (
                                <Button onClick={onRemoteSearch} loading={remoteLoading} disabled={remoteLoading} variant="light">
                                    从 B站搜索：{globalSearchTerm}
                                </Button>
                            )}
                        </Stack>
                    ) : (
                        <Stack gap="xs">
                            {globalSearchResults.map((item) => (
                                <Paper
                                    key={item.kind === "song" ? `song-${item.song.id}` : `fav-${item.favorite.id}`}
                                    withBorder
                                    p="sm"
                                    shadow="xs"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => onResultClick(item)}
                                >
                                    <Group justify="space-between" align="flex-start">
                                        <Stack gap={4} style={{ flex: 1 }}>
                                            <Text fw={600} size="sm" lineClamp={1}>
                                                {item.kind === "song" ? item.song.name || "未命名视频" : item.favorite.title || "未命名收藏夹"}
                                            </Text>
                                            <Text size="xs" c="dimmed" lineClamp={1}>
                                                {item.kind === "song"
                                                    ? item.song.singer || item.song.singerId || "未知 UP"
                                                    : `fid: ${item.favorite.id} · 曲目数: ${item.favorite.songIds.length}`}
                                            </Text>
                                            {item.kind === "song" && item.song.bvid ? (
                                                <Text size="xs" c="dimmed">BV: {item.song.bvid}</Text>
                                            ) : null}
                                        </Stack>
                                        <Badge color={item.kind === "song" ? "blue" : "violet"} variant="light">
                                            {item.kind === "song" ? "视频" : "收藏夹"}
                                        </Badge>
                                    </Group>
                                </Paper>
                            ))}
                            {remoteResults.map((s) => (
                                <Paper key={`remote-${s.bvid}-${s.name}`} withBorder p="sm" shadow="xs">
                                    <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
                                        <AspectRatio ratio={16 / 9} w={120}>
                                            <Image
                                                src={s.cover || undefined}
                                                alt={s.name}
                                                fit="cover"
                                                radius="sm"
                                                fallbackSrc="https://via.placeholder.com/160x90?text=No+Cover"
                                            />
                                        </AspectRatio>
                                        <Stack gap={4} style={{ flex: 1 }}>
                                            <Text fw={600} size="sm" lineClamp={1}>{s.name || '未命名视频'}</Text>
                                            <Text size="xs" c="dimmed" lineClamp={2}>{s.singer || '未知 UP'} · BV: {s.bvid}</Text>
                                        </Stack>
                                        <Group gap="xs">
                                            <Badge color="grape" variant="light">B站</Badge>
                                            <Button size="xs" variant="filled" onClick={() => onAddFromRemote(s)}>添加到歌单</Button>
                                        </Group>
                                    </Group>
                                </Paper>
                            ))}
                        </Stack>
                    )}
                </ScrollArea>
            </Stack>
        </Modal>
    );
};

export default GlobalSearchModal;
