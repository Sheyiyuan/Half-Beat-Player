import React from "react";
import { AspectRatio, Button, Group, Image, Modal, NumberInput, RangeSlider, Select, Stack, Text, TextInput } from "@mantine/core";
import type { Favorite } from "../types";

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
}) => {
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            size="lg"
            centered
            title="添加到歌单"
            overlayProps={{ blur: 10, opacity: 0.35 }}
        >
            {bvPreview ? (
                <Stack gap="md">
                    <AspectRatio ratio={16 / 9} w="100%">
                        {bvPreview.bvid ? (
                            <iframe
                                title="bilibili-preview"
                                src={`https://player.bilibili.com/player.html?bvid=${bvPreview.bvid}&high_quality=1&as_wide=1&autoplay=0`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                                allowFullScreen
                                style={{ border: 0, width: "100%", height: "100%", borderRadius: 12 }}
                            />
                        ) : (
                            <Image
                                src={bvPreview.cover || undefined}
                                alt={bvPreview.title}
                                fit="cover"
                                w="100%"
                                radius="md"
                                fallbackSrc="https://via.placeholder.com/640x360?text=No+Cover"
                            />
                        )}
                    </AspectRatio>
                    <Stack gap="xs">
                        <Text fw={600}>{bvPreview.title}</Text>
                        <Text size="sm" c="dimmed">BV: {bvPreview.bvid}</Text>
                        <Text size="sm" c="dimmed">时长: {formatTime(bvPreview.duration || 0)}</Text>
                    </Stack>
                    <Stack gap="xs">
                        <Text size="xs" c="dimmed">播放区间（只播放此段）</Text>
                        <RangeSlider
                            value={[sliceStart, sliceEnd]}
                            onChange={([startVal, endVal]) => onSliceRangeChange(startVal, endVal)}
                            min={0}
                            max={Math.max(bvPreview.duration || 0, sliceEnd || 0, 1)}
                            step={0.1}
                            label={(value) => formatTime(Number(value))}
                            style={{ '--slider-color': themeColor } as any}
                        />
                        <Group gap="sm" grow>
                            <NumberInput
                                label="播放开始 (秒)"
                                value={sliceStart}
                                onChange={onSliceStartChange}
                                min={0}
                                max={Math.max(bvPreview.duration || 0, sliceEnd || 0, 1)}
                                step={0.1}
                                hideControls
                                size="sm"
                            />
                            <NumberInput
                                label="播放结束 (秒)"
                                value={sliceEnd}
                                onChange={onSliceEndChange}
                                min={0}
                                max={Math.max(bvPreview.duration || 0, sliceEnd || 0, 1)}
                                step={0.1}
                                hideControls
                                size="sm"
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
                        />
                        <Group align="flex-end" wrap="nowrap" gap="xs">
                            <TextInput
                                label="新建歌单"
                                placeholder="输入名称后点击创建"
                                value={newFavName}
                                onChange={(e) => onFavNameChange(e.currentTarget.value)}
                                style={{ flex: 1 }}
                            />
                            <Button variant="light" onClick={onCreateFavorite}>创建</Button>
                        </Group>
                        <TextInput
                            label="歌曲名"
                            value={bvSongName}
                            onChange={(e) => onSongNameChange(e.currentTarget.value)}
                        />
                        <TextInput
                            label="歌手"
                            value={bvSinger}
                            onChange={(e) => onSingerChange(e.currentTarget.value)}
                            placeholder="默认使用视频 UP/联合投稿"
                        />
                    </Stack>
                    <Group justify="flex-end">
                        <Button variant="default" onClick={onClose}>
                            取消
                        </Button>
                        <Button color={themeColor} onClick={onConfirmAdd}>
                            确认添加
                        </Button>
                    </Group>
                </Stack>
            ) : (
                <Text c="dimmed">暂无预览数据</Text>
            )}
        </Modal>
    );
};

export default BVAddModal;
