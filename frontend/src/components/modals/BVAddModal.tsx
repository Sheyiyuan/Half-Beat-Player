import React from "react";
import { AspectRatio, Button, Group, Image, Modal, NumberInput, RangeSlider, Select, Stack, Text, TextInput, ScrollArea } from "@mantine/core";
import type { Favorite } from "../../types";
import { useImageProxy } from "../../hooks/ui/useImageProxy";

interface BVPreview {
    bvid?: string;
    cover?: string;
    title?: string;
    duration?: number;
    url?: string;
}

interface BVAddModalProps {
    opened: boolean;
    themeColor: string;
    bvPreview: BVPreview | null;
    favorites: Favorite[];
    bvTargetFavId: string | null;
    newFavName: string;
    bvSongName: string;
    bvSinger: string;
    sliceStart: number;
    sliceEnd: number;
    onClose: () => void;
    onSliceRangeChange: (start: number, end: number) => void;
    onSliceStartChange: (value: number | string) => void;
    onSliceEndChange: (value: number | string) => void;
    onSelectFavorite: (id: string | null) => void;
    onCreateFavorite: () => void;
    onFavNameChange: (value: string) => void;
    onSongNameChange: (value: string) => void;
    onSingerChange: (value: string) => void;
    onConfirmAdd: () => void;
    formatTime: (value: number) => string;
    formatTimeWithMs: (value: number) => string;
    panelStyles?: any;
    derived?: any;
}

const BVAddModal: React.FC<BVAddModalProps> = ({
    opened,
    themeColor,
    bvPreview,
    favorites,
    bvTargetFavId,
    newFavName,
    bvSongName,
    bvSinger,
    sliceStart,
    sliceEnd,
    onClose,
    onSliceRangeChange,
    onSliceStartChange,
    onSliceEndChange,
    onSelectFavorite,
    onCreateFavorite,
    onFavNameChange,
    onSongNameChange,
    onSingerChange,
    onConfirmAdd,
    formatTime,
    formatTimeWithMs,
    panelStyles,
    derived,
}) => {
    const { getProxiedImageUrlSync } = useImageProxy();
    const modalStyles = derived ? {
        content: {
            backgroundColor: derived.modalBackground,
            color: derived.textColorPrimary,
        },
        header: {
            backgroundColor: "transparent",
            color: derived.textColorPrimary,
        },
        title: {
            color: derived.textColorPrimary,
            fontWeight: 600,
        }
    } : undefined;

    const inputStyles = derived ? {
        input: {
            backgroundColor: derived.controlBackground,
            color: derived.textColorPrimary,
            borderColor: "transparent",
            borderRadius: derived.componentRadius,
        },
        label: {
            color: derived.textColorPrimary,
        }
    } : undefined;

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            size="lg"
            centered
            title="添加到歌单"
            overlayProps={{ blur: 10, opacity: 0.35 }}
            radius={derived?.componentRadius}
            styles={modalStyles}
            className="normal-panel"
        >
            <ScrollArea type="auto" style={{ maxHeight: "70vh", height: "70vh" }}>
                {bvPreview ? (
                    <div style={{ paddingRight: 16 }}>
                        <Stack gap="md">
                            <AspectRatio ratio={16 / 9} w="100%" mah={240}>
                                {bvPreview.bvid ? (
                                    <iframe
                                        title="bilibili-preview"
                                        src={`https://player.bilibili.com/player.html?bvid=${bvPreview.bvid}&high_quality=1&as_wide=1&autoplay=0`}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                                        allowFullScreen
                                        style={{ border: 0, width: "100%", height: "100%", borderRadius: derived?.componentRadius }}
                                    />
                                ) : (
                                    <Image
                                        src={getProxiedImageUrlSync(bvPreview.cover || "")}
                                        alt={bvPreview.title}
                                        fit="cover"
                                        w="100%"
                                        radius={derived?.componentRadius}
                                        fallbackSrc="https://via.placeholder.com/640x360?text=No+Cover"
                                    />
                                )}
                            </AspectRatio>
                            <Stack gap="xs">
                                <Text fw={600} c={derived?.textColorPrimary}>{bvPreview.title}</Text>
                                <Text size="sm" c={derived?.textColorSecondary}>BV: {bvPreview.bvid}</Text>
                                <Text size="sm" c={derived?.textColorSecondary}>时长: {formatTime(bvPreview.duration || 0)}</Text>
                            </Stack>
                            <Stack gap="xs">
                                <Text size="xs" c={derived?.textColorSecondary}>播放区间（只播放此段）</Text>
                                <RangeSlider
                                    value={[sliceStart, sliceEnd]}
                                    onChange={([startVal, endVal]) => onSliceRangeChange(startVal, endVal)}
                                    min={0}
                                    max={Math.max(bvPreview.duration || 0, sliceEnd || 0, 1)}
                                    step={0.05}
                                    label={(value) => formatTimeWithMs(Number(value))}
                                    color={themeColor}
                                />
                                <Group gap="sm" grow>
                                    <NumberInput
                                        label="播放开始 (秒)"
                                        value={sliceStart}
                                        onChange={onSliceStartChange}
                                        min={0}
                                        max={Math.max(bvPreview.duration || 0, sliceEnd || 0, 1)}
                                        step={0.05}
                                        decimalScale={2}
                                        hideControls
                                        size="sm"
                                        radius={derived?.componentRadius}
                                        styles={inputStyles}
                                    />
                                    <NumberInput
                                        label="播放结束 (秒)"
                                        value={sliceEnd}
                                        onChange={onSliceEndChange}
                                        min={0}
                                        max={Math.max(bvPreview.duration || 0, sliceEnd || 0, 1)}
                                        step={0.05}
                                        decimalScale={2}
                                        hideControls
                                        size="sm"
                                        radius={derived?.componentRadius}
                                        styles={inputStyles}
                                    />
                                </Group>
                            </Stack>
                            <Stack gap="xs">
                                <Select
                                    label="加入歌单"
                                    placeholder={favorites.length === 0 ? '暂无歌单' : '选择歌单'}
                                    data={favorites.map((f) => ({ value: f.id, label: f.title }))}
                                    value={bvTargetFavId}
                                    onChange={(val) => onSelectFavorite(val)}
                                    clearable={favorites.length === 0}
                                    radius={derived?.componentRadius}
                                    styles={inputStyles}
                                />
                                <Group align="flex-end" wrap="nowrap" gap="xs">
                                    <TextInput
                                        label="新建歌单"
                                        placeholder="输入名称后点击创建"
                                        value={newFavName}
                                        onChange={(e) => onFavNameChange(e.currentTarget.value)}
                                        style={{ flex: 1 }}
                                        radius={derived?.componentRadius}
                                        styles={inputStyles}
                                    />
                                    <Button variant="light" color={themeColor} radius={derived?.componentRadius} onClick={onCreateFavorite}>创建</Button>
                                </Group>
                                <TextInput
                                    label="歌曲名"
                                    value={bvSongName}
                                    onChange={(e) => onSongNameChange(e.currentTarget.value)}
                                    radius={derived?.componentRadius}
                                    styles={inputStyles}
                                />
                                <TextInput
                                    label="歌手"
                                    value={bvSinger}
                                    onChange={(e) => onSingerChange(e.currentTarget.value)}
                                    placeholder="默认使用视频 UP/联合投稿"
                                    radius={derived?.componentRadius}
                                    styles={inputStyles}
                                />
                            </Stack>
                            <Group justify="flex-end">
                                <Button variant="subtle" onClick={onClose} radius={derived?.componentRadius} style={{ color: derived?.textColorPrimary }}>
                                    取消
                                </Button>
                                <Button color={themeColor} onClick={onConfirmAdd} radius={derived?.componentRadius}>
                                    确认添加
                                </Button>
                            </Group>
                        </Stack>
                    </div>
                ) : (
                    <Text c={derived?.textColorSecondary}>暂无预览数据</Text>
                )}
            </ScrollArea>
        </Modal>
    );
};

export default BVAddModal;
