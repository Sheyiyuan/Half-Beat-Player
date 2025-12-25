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
};

const AddToFavoriteModal: React.FC<AddToFavoriteModalProps> = ({ opened, onClose, favorites, currentSong, themeColor, onAdd }) => {
    return (
        <Modal opened={opened} onClose={onClose} title="添加到歌单">
            <Stack gap="md">
                {favorites.length === 0 ? (
                    <Text c="dimmed">没有歌单</Text>
                ) : (
                    favorites.map((fav) => {
                        const isInFav = currentSong && fav.songIds.some(ref => ref.songId === currentSong.id);
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
