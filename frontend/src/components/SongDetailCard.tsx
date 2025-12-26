import React from "react";
import { Box, Card, Flex, Group, Image, NumberInput, RangeSlider, ScrollArea, Stack, Text, TextInput } from "@mantine/core";
import { Song } from "../types";

export type SongDetailCardProps = {
    song: Song | null;
    panelBackground: string;
    themeColor: string;
    computedColorScheme: string;
    placeholderCover: string;
    maxSkipLimit: number;
    formatTime: (seconds: number) => string;
    formatTimeLabel: (value: number | string) => string;
    parseTimeLabel: (value: string) => number;
    onIntervalChange: (start: number, end: number) => void;
    onSkipStartChange: (value: number) => void;
    onSkipEndChange: (value: number) => void;
    onStreamUrlChange: (value: string) => void;
};

const SongDetailCard: React.FC<SongDetailCardProps> = ({
    song,
    panelBackground,
    themeColor,
    computedColorScheme,
    placeholderCover,
    maxSkipLimit,
    formatTime,
    formatTimeLabel,
    parseTimeLabel,
    onIntervalChange,
    onSkipStartChange,
    onSkipEndChange,
    onStreamUrlChange,
}) => {
    return (
        <Card shadow="sm" padding="md" radius="md" w={300} withBorder h="100%" style={{ minHeight: 0, backgroundColor: panelBackground, display: "flex", flexDirection: "column" }}>
            {song ? (
                <ScrollArea style={{ flex: 1, minHeight: 0 }}>
                    <Stack gap="md" pb="sm">
                        <Box
                            w="100%"
                            h={135}
                            bg={computedColorScheme === "dark" ? "dark.6" : "gray.2"}
                            style={{
                                borderRadius: 8,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                overflow: "hidden",
                            }}
                        >
                            <Image
                                src={song.cover || placeholderCover}
                                h={135}
                                radius="md"
                                fit="contain"
                            />
                        </Box>

                        <Stack gap={4}>
                            <Text fw={700} size="lg" lineClamp={2}>{song.name}</Text>
                            <Text c="dimmed" size="sm" lineClamp={1}>{song.singer}</Text>
                            {song.bvid && (
                                <Text size="xs" c="dimmed" lineClamp={1}>BV: {song.bvid}</Text>
                            )}
                        </Stack>

                        <Stack gap="xs">
                            <Text size="xs" c="dimmed">播放区间（只播放此段）</Text>
                            <RangeSlider
                                value={[song?.skipStartTime ?? 0, song?.skipEndTime ?? 0]}
                                onChange={(vals) => onIntervalChange(Number(vals[0]), Number(vals[1]))}
                                min={0}
                                max={maxSkipLimit}
                                step={0.1}
                                label={(value) => formatTime(value)}
                                style={{ '--slider-color': themeColor } as any}
                            />
                            <Group gap="sm" grow>
                                <NumberInput
                                    label="播放开始 (秒)"
                                    value={song?.skipStartTime ?? 0}
                                    onChange={(value) => value !== undefined && onSkipStartChange(Number(value))}
                                    min={0}
                                    max={maxSkipLimit}
                                    step={0.1}
                                    hideControls
                                    size="sm"
                                />
                                <NumberInput
                                    label="播放结束 (秒)"
                                    value={song?.skipEndTime ?? 0}
                                    onChange={(value) => value !== undefined && onSkipEndChange(Number(value))}
                                    min={0}
                                    max={maxSkipLimit}
                                    step={0.1}
                                    hideControls
                                    size="sm"
                                />
                            </Group>
                        </Stack>


                    </Stack>
                </ScrollArea>
            ) : (
                <Flex align="center" justify="center" h="100%">
                    <Text c="dimmed">选择一首歌曲</Text>
                </Flex>
            )}
        </Card>
    );
};

export default SongDetailCard;
