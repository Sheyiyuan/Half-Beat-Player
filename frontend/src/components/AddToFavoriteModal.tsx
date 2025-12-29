import React from "react";
import { Button, Modal, Stack, Text } from "@mantine/core";
import { Favorite, Song } from "../types";

export type AddToFavoriteModalProps = {
    opened: boolean;
    onClose: () => void;
    favorites: Favorite[];
    currentSong: Song | null;
    themeColor: string;
    onAdd: (fav: Favorite) => void;
    panelStyles?: React.CSSProperties;
    derived?: any;
};

const AddToFavoriteModal: React.FC<AddToFavoriteModalProps> = ({ opened, onClose, favorites, currentSong, themeColor, onAdd, panelStyles, derived }) => {
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="添加到歌单"
            centered
            overlayProps={{ blur: 10, opacity: 0.35 }}
            styles={{
                content: {
                    ...panelStyles,
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
            className="glass-panel"
        >
            <Stack gap="md">
                {favorites.length === 0 ? (
                    <Text c={derived?.textColorSecondary}>没有歌单</Text>
                ) : (
                    favorites.map((fav) => {
                        const isInFav = currentSong && fav.songIds.some(ref => ref.songId === currentSong.id) ? true : false;
                        return (
                            <Button
                                key={fav.id}
                                variant={isInFav ? "light" : "default"}
                                color={themeColor}
                                disabled={isInFav}
                                onClick={() => {
                                    if (currentSong && !isInFav) {
                                        onAdd(fav);
                                    }
                                }}
                                styles={{
                                    root: {
                                        backgroundColor: !isInFav ? derived?.controlBackground : undefined,
                                        color: !isInFav ? derived?.textColorPrimary : undefined,
                                    }
                                }}
                            >
                                {fav.title} {isInFav ? "✓ (已添加)" : ""}
                            </Button>
                        );
                    })
                )}
            </Stack>
        </Modal>
    );
};

export default AddToFavoriteModal;
