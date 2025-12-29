import React, { useState } from "react";
import { ActionIcon, Group, Modal, Paper, ScrollArea, Stack, Text } from "@mantine/core";
import { GripVertical, X } from "lucide-react";
import { Song } from "../types";

export type PlaylistModalProps = {
    opened: boolean;
    onClose: () => void;
    queue: Song[];
    currentIndex: number;
    themeColorHighlight: string;
    onSelect: (song: Song, index: number) => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
    onRemove: (index: number) => void;
    panelStyles?: React.CSSProperties;
    derived?: any;
};

const PlaylistModal: React.FC<PlaylistModalProps> = ({
    opened,
    onClose,
    queue,
    currentIndex,
    themeColorHighlight,
    onSelect,
    onReorder,
    onRemove,
    panelStyles,
    derived,
}) => {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== dropIndex) {
            onReorder(draggedIndex, dropIndex);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="当前播放列表"
            size="lg"
            centered
            overlayProps={{ blur: 10, opacity: 0.35 }}
            styles={{
                body: { height: '500px' },
                content: {
                    height: '600px',
                    ...panelStyles,
                    backgroundColor: derived?.panelBackground,
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
            className="glass-panel"
        >
            <ScrollArea style={{ height: '450px' }}>
                <Stack gap="xs">
                    {queue.length === 0 ? (
                        <Text c={derived?.textColorSecondary}>播放列表为空</Text>
                    ) : (
                        queue.map((song, index) => (
                            <Paper
                                key={`${song.id}-${index}`}
                                p="sm"
                                withBorder
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, index)}
                                onDragEnd={handleDragEnd}
                                className="glass-panel"
                                style={{
                                    ...panelStyles,
                                    backgroundColor:
                                        index === currentIndex
                                            ? `${themeColorHighlight}40`
                                            : dragOverIndex === index && draggedIndex !== index
                                                ? 'rgba(0, 0, 0, 0.05)'
                                                : derived?.controlBackground,
                                    "--glass-panel-color": index === currentIndex
                                        ? `${themeColorHighlight}40`
                                        : derived?.controlBackground,
                                    cursor: "move",
                                    opacity: draggedIndex === index ? 0.5 : 1,
                                    transition: 'all 0.2s ease',
                                    border: dragOverIndex === index && draggedIndex !== index
                                        ? `2px dashed ${themeColorHighlight}`
                                        : undefined,
                                }}
                            >
                                <Group justify="space-between" wrap="nowrap" gap="xs">
                                    <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                                        <GripVertical size={20} style={{ flexShrink: 0, cursor: 'grab' }} color={derived?.textColorSecondary} />
                                        <div
                                            style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                                            onClick={() => onSelect(song, index)}
                                        >
                                            <Text fw={index === currentIndex ? 600 : 400} truncate c={index === currentIndex ? themeColorHighlight : derived?.textColorPrimary}>{song.name}</Text>
                                            <Text size="sm" c={derived?.textColorSecondary} truncate>{song.singer}</Text>
                                        </div>
                                    </Group>
                                    <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
                                        {index === currentIndex && (
                                            <Text size="sm" fw={600} c={themeColorHighlight} style={{ flexShrink: 0 }}>
                                                正在播放
                                            </Text>
                                        )}
                                        <ActionIcon
                                            variant="subtle"
                                            color="red"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemove(index);
                                            }}
                                            title="从播放列表移除"
                                        >
                                            <X size={16} />
                                        </ActionIcon>
                                    </Group>
                                </Group>
                            </Paper>
                        ))
                    )}
                </Stack>
            </ScrollArea>
        </Modal>
    );
};

export default PlaylistModal;
