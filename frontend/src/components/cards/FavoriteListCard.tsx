import React from "react";
import { Button, Card, Group, ScrollArea, Stack, Text, Transition } from "@mantine/core";
import { Favorite, Song } from "../../types";

export type FavoriteListCardProps = {
    panelBackground: string;
    panelStyles: React.CSSProperties;
    favorites: Favorite[];
    selectedFavId: string | null;
    onSelectFavorite: (id: string) => void;
    onPlayFavorite: (fav: Favorite) => void;
    onPlaySongInFavorite: (song: Song, list: Song[]) => void;
    onAddCurrentToFavorite: (favId: string) => void;
    onCreateFavorite: () => void;
    onEditFavorite: (fav: Favorite) => void;
    onDeleteFavorite: (id: string) => void;
    onToggleConfirmDelete: (id: string | null) => void;
    confirmDeleteFavId: string | null;
    currentSong: Song | null;
    themeColor: string;
    componentRadius?: number;
    controlBackground?: string;
    favoriteCardBackground?: string;
    textColorPrimary?: string;
    textColorSecondary?: string;
};

const FavoriteListCard: React.FC<FavoriteListCardProps> = ({
    panelBackground,
    panelStyles,
    favorites,
    selectedFavId,
    onSelectFavorite,
    onPlayFavorite,
    onPlaySongInFavorite,
    onAddCurrentToFavorite,
    onCreateFavorite,
    onEditFavorite,
    onDeleteFavorite,
    onToggleConfirmDelete,
    confirmDeleteFavId,
    currentSong,
    themeColor,
    componentRadius = 8,
    controlBackground,
    favoriteCardBackground,
    textColorPrimary,
    textColorSecondary,
}) => {
    return (
        <Card shadow="sm" padding="md" w={300} withBorder h="100%" className="glass-panel" style={{ ...panelStyles, display: "flex", flexDirection: "column", minHeight: 0, backgroundColor: panelBackground }}>
            <Group justify="space-between" mb="sm">
                <Text fw={600} size="sm" style={{ color: textColorPrimary }}>我的歌单</Text>
                <Button size="xs" variant="light" color={themeColor} onClick={onCreateFavorite} radius={componentRadius}>+ 新建</Button>
            </Group>
            <ScrollArea style={{ flex: 1, minHeight: 0 }}>
                <Stack gap="xs" pb="sm">
                    {favorites.map((f) => {
                        const isSelected = selectedFavId === f.id;
                        const isConfirmDelete = confirmDeleteFavId === f.id;
                        return (
                            <Card
                                key={f.id}
                                padding="sm"
                                radius={componentRadius}
                                withBorder
                                shadow="xs"
                                onClick={() => {
                                    onSelectFavorite(f.id);
                                    onToggleConfirmDelete(null);
                                }}
                                style={{
                                    cursor: "pointer",
                                    backgroundColor: isSelected ? themeColor : (favoriteCardBackground || "transparent"),
                                    borderColor: isSelected ? themeColor : "transparent",
                                }}
                            >
                                <Stack gap={6}>
                                    <Text fw={600} size="sm" style={{ color: isSelected ? "white" : textColorPrimary }} lineClamp={1}>
                                        {f.title}
                                    </Text>
                                    <Text size="xs" style={{ color: isSelected ? "rgba(255,255,255,0.7)" : textColorSecondary }}>{f.songIds.length} 首</Text>
                                    <Group gap="xs" wrap="nowrap">
                                        <Button
                                            size="xs"
                                            variant={isSelected ? "filled" : "light"}
                                            color={isSelected ? "white" : themeColor}
                                            radius={componentRadius}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onPlayFavorite(f);
                                            }}
                                            style={{
                                                flexShrink: 0,
                                                color: isSelected ? themeColor : undefined,
                                                backgroundColor: isSelected ? "white" : undefined
                                            }}
                                        >播放</Button>
                                        <Button
                                            size="xs"
                                            variant="light"
                                            color="gray"
                                            radius={componentRadius}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditFavorite(f);
                                                onToggleConfirmDelete(null);
                                            }}
                                            style={{
                                                flexShrink: 0,
                                                backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : (controlBackground || "rgba(0,0,0,0.08)"),
                                                color: isSelected ? "white" : textColorPrimary
                                            }}
                                        >编辑</Button>
                                        <Button
                                            size="xs"
                                            variant="outline"
                                            color="red"
                                            radius={componentRadius}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isConfirmDelete) {
                                                    onDeleteFavorite(f.id);
                                                } else {
                                                    onToggleConfirmDelete(f.id);
                                                }
                                            }}
                                            style={{
                                                flexShrink: 0,
                                                backgroundColor: isConfirmDelete ? "rgb(250, 82, 82)" : (isSelected ? "rgba(255,255,255,0.1)" : (controlBackground || "rgba(255,0,0,0.12)")),
                                                color: isConfirmDelete ? "white" : (isSelected ? "white" : "red"),
                                                borderColor: isSelected ? "white" : "red",
                                                transition: "background-color 150ms ease-out"
                                            }}
                                        >
                                            {!isConfirmDelete && (
                                                <Transition mounted={true} transition="fade" duration={150} timingFunction="ease-out">
                                                    {(styles) => <span style={styles}>删除歌单</span>}
                                                </Transition>
                                            )}
                                            {isConfirmDelete && (
                                                <Transition mounted={true} transition="fade" duration={150} timingFunction="ease-out">
                                                    {(styles) => <span style={styles}>确认删除</span>}
                                                </Transition>
                                            )}
                                        </Button>
                                    </Group>
                                </Stack>
                            </Card>
                        );
                    })}
                </Stack>
            </ScrollArea>
        </Card>
    );
};

export default FavoriteListCard;
