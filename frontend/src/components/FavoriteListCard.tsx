import React from "react";
import { Button, Card, Group, ScrollArea, Stack, Text, Transition } from "@mantine/core";
import { Favorite, Song } from "../types";

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
}) => {
    return (
        <Card shadow="sm" padding="md" w={300} withBorder h="100%" className="glass-panel" style={{ ...panelStyles, display: "flex", flexDirection: "column", minHeight: 0, backgroundColor: panelBackground }}>
            <Group justify="space-between" mb="sm">
                <Text fw={600} size="sm">我的歌单</Text>
                <Button size="xs" variant="light" color={themeColor} onClick={onCreateFavorite}>+ 新建</Button>
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
                                radius="md"
                                withBorder
                                shadow="xs"
                                onClick={() => {
                                    onSelectFavorite(f.id);
                                    onToggleConfirmDelete(null);
                                }}
                                style={{
                                    cursor: "pointer",
                                    backgroundColor: isSelected ? themeColor : undefined
                                }}
                            >
                                <Stack gap={6}>
                                    <Text fw={600} size="sm">{f.title}</Text>
                                    <Text size="xs" c={isSelected ? "gray.2" : "dimmed"}>{f.songIds.length} 首</Text>
                                    <Group gap="xs" wrap="nowrap">
                                        <Button
                                            size="xs"
                                            variant={isSelected ? "filled" : "light"}
                                            color={themeColor}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onPlayFavorite(f);
                                            }}
                                            style={{ flexShrink: 0 }}
                                        >播放</Button>
                                        <Button
                                            size="xs"
                                            variant="light"
                                            color="gray"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditFavorite(f);
                                                onToggleConfirmDelete(null);
                                            }}
                                            style={{ flexShrink: 0, backgroundColor: "rgba(0,0,0,0.08)" }}
                                        >编辑</Button>
                                        <Button
                                            size="xs"
                                            variant="outline"
                                            color="red"
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
                                                backgroundColor: isConfirmDelete ? "rgb(250, 82, 82)" : "rgba(255,0,0,0.12)",
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
