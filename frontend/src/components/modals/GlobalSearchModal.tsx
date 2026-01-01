import React, { useEffect, useRef } from "react";
import { ActionIcon, AspectRatio, Badge, Button, Group, Image, Modal, Paper, ScrollArea, Stack, Text, TextInput } from "@mantine/core";
import { Search } from "lucide-react";
import type { Song, Favorite } from "../../types";

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
    panelStyles?: any;
    derived?: any;
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
    panelStyles,
    derived,
}) => {
    const lastSearchedBVRef = useRef<string>("");

    const handleEnter = (hasResult: boolean) => {
        if (hasResult) {
            onResultClick(globalSearchResults[0]);
        } else {
            onResolveBVAndAdd();
        }
    };

    const trimmedTerm = globalSearchTerm.trim();
    const bvPattern = /BV[0-9A-Za-z]{10}/;
    const isBVSearch = bvPattern.test(trimmedTerm) || trimmedTerm.includes("bilibili.com");

    // 当输入 BV 号时自动触发搜索（仅搜索一次）
    useEffect(() => {
        if (opened && isBVSearch && trimmedTerm) {
            const extractedBV = trimmedTerm.match(bvPattern)?.[0] || trimmedTerm;

            // 只在BV号改变时触发搜索，避免重复搜索
            if (extractedBV !== lastSearchedBVRef.current) {
                lastSearchedBVRef.current = extractedBV;
                const timer = setTimeout(() => {
                    onRemoteSearch();
                }, 300); // 防抖300ms
                return () => clearTimeout(timer);
            }
        } else if (!isBVSearch) {
            // 如果不再是BV搜索，重置记录
            lastSearchedBVRef.current = "";
        }
    }, [trimmedTerm, isBVSearch, opened, onRemoteSearch]);

    // 清理：当模态框关闭时重置搜索词（remoteResults会被App自动清理）
    const handleClose = () => {
        onTermChange("");
        onClose();
    };

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            size="lg"
            centered
            padding="lg"
            title="搜索视频 (BV 号或链接)"
            overlayProps={{ blur: 10, opacity: 0.35 }}
            radius={derived?.componentRadius}
            styles={{
                content: {
                    backgroundColor: derived?.modalBackground,
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
                    placeholder="输入 BV 号或完整链接，如 BV1xx... 或 https://www.bilibili.com/video/BV..."
                    value={globalSearchTerm}
                    onChange={(e) => onTermChange(e.currentTarget.value)}
                    leftSection={<Search size={14} />}
                    leftSectionPointerEvents="none"
                    autoFocus
                    disabled={resolvingBV}
                    radius={derived?.componentRadius}
                    styles={{
                        input: {
                            backgroundColor: derived?.controlBackground,
                            color: derived?.textColorPrimary,
                            borderColor: "transparent",
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !resolvingBV) {
                            handleEnter(globalSearchResults.length > 0);
                        }
                    }}
                />
                <ScrollArea h={380} type="auto">
                    <Stack gap="xs">
                        {/* BV号搜索时：显示解析按钮 */}
                        {trimmedTerm && isBVSearch && (
                            <Paper withBorder p="md" w="100%" radius={derived?.componentRadius} style={{ backgroundColor: 'rgba(0, 123, 255, 0.05)' }}>
                                <Group justify="space-between">
                                    <Stack gap={4}>
                                        <Text size="sm" fw={500}>解析 BV 号并添加到歌单</Text>
                                        <Text size="xs" c="dimmed" lineClamp={1}>{globalSearchTerm}</Text>
                                    </Stack>
                                    <ActionIcon
                                        size="lg"
                                        variant="filled"
                                        color={themeColor}
                                        radius={derived?.componentRadius}
                                        onClick={onResolveBVAndAdd}
                                        loading={resolvingBV}
                                        disabled={resolvingBV}
                                    >
                                        <Search size={16} />
                                    </ActionIcon>
                                </Group>
                            </Paper>
                        )}
                        {/* 关键字搜索时：显示B站搜索按钮 */}
                        {trimmedTerm && !isBVSearch && (
                            <Button
                                onClick={onRemoteSearch}
                                loading={remoteLoading}
                                disabled={remoteLoading}
                                variant="light"
                                fullWidth
                            >
                                从 B站搜索：{globalSearchTerm}
                            </Button>
                        )}
                        {/* 本地搜索结果 */}
                        {globalSearchResults.length === 0 && remoteResults.length === 0 && !trimmedTerm ? (
                            <Stack gap="md" align="center" py="xl">
                                <Text c="dimmed" size="sm" ta="center">
                                    输入 BV 号自动搜索本地和B站
                                </Text>
                                <Text c="dimmed" size="xs" ta="center">
                                    输入关键字搜索本地歌曲
                                </Text>
                            </Stack>
                        ) : (
                            <>
                                {/* 本地搜索结果 */}
                                {globalSearchResults.length > 0 && (
                                    <>
                                        <Text size="xs" c="dimmed" fw={500} px="xs">本地歌曲</Text>
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
                                                            {item.kind === "song" ? item.song.name || "未命名歌曲" : item.favorite.title || "未命名收藏夹"}
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
                                                        {item.kind === "song" ? "歌曲" : "收藏夹"}
                                                    </Badge>
                                                </Group>
                                            </Paper>
                                        ))}
                                    </>
                                )}
                                {/* B站搜索结果 */}
                                {remoteResults.length > 0 && (
                                    <>
                                        <Text size="xs" c="dimmed" fw={500} px="xs" mt={globalSearchResults.length > 0 ? "sm" : 0}>
                                            {isBVSearch ? "B站匹配结果" : "B站搜索结果"}
                                        </Text>
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
                                                        <Text fw={600} size="sm" lineClamp={1}>{s.name || '未命名歌曲'}</Text>
                                                        <Text size="xs" c="dimmed" lineClamp={2}>{s.singer || '未知 UP'} · BV: {s.bvid}</Text>
                                                    </Stack>
                                                    <Group gap="xs">
                                                        <Badge color="grape" variant="light">B站</Badge>
                                                        <Button size="xs" variant="filled" onClick={() => onAddFromRemote(s)}>添加到歌单</Button>
                                                    </Group>
                                                </Group>
                                            </Paper>
                                        ))}
                                    </>
                                )}
                                {/* 加载提示 */}
                                {remoteLoading && (
                                    <Text size="sm" c="dimmed" ta="center" py="md">
                                        正在搜索 B站...
                                    </Text>
                                )}
                                {/* 无结果提示 */}
                                {!remoteLoading && globalSearchResults.length === 0 && remoteResults.length === 0 && trimmedTerm && (
                                    <Text size="sm" c="dimmed" ta="center" py="md">
                                        {isBVSearch ? "未找到匹配的歌曲" : "未找到匹配的本地歌曲，点击上方按钮从B站搜索"}
                                    </Text>
                                )}
                            </>
                        )}
                    </Stack>
                </ScrollArea>
            </Stack>
        </Modal>
    );
};

export default GlobalSearchModal;
