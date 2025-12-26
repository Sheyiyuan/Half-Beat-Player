import { useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import * as Services from '../../../wailsjs/go/services/Service';
import { Song, Favorite } from '../../types';

interface UsePlaylistActionsProps {
    queue: Song[];
    setQueue: (queue: Song[]) => void;
    currentIndex: number;
    setCurrentIndex: (index: number) => void;
    setCurrentSong: (song: Song | null) => void;
    setIsPlaying: (playing: boolean) => void;
    currentFav: Favorite | null;
    favorites: Favorite[];
    setFavorites: (favorites: Favorite[]) => void;
    setStatus: (status: string) => void;
    setConfirmRemoveSongId: (id: string | null) => void;
    openModal: (name: string) => void;
    closeModal: (name: string) => void;
    playSong: (song: Song, list?: Song[]) => Promise<void>;
}

export const usePlaylistActions = ({
    queue,
    setQueue,
    currentIndex,
    setCurrentIndex,
    setCurrentSong,
    setIsPlaying,
    currentFav,
    favorites,
    setFavorites,
    setStatus,
    setConfirmRemoveSongId,
    openModal,
    closeModal,
    playSong,
}: UsePlaylistActionsProps) => {

    const addSongToFavorite = useCallback((song: Song) => {
        setCurrentSong(song);
        openModal("addFavoriteModal");
    }, [setCurrentSong, openModal]);

    const removeSongFromPlaylist = useCallback(async (song: Song) => {
        if (!currentFav) return;
        try {
            const updatedFav = {
                ...currentFav,
                songIds: currentFav.songIds.filter((ref: any) => ref.songId !== song.id),
            };
            await Services.SaveFavorite(updatedFav as any);
            const refreshedFavs = await Services.ListFavorites();
            setFavorites(refreshedFavs);
            setConfirmRemoveSongId(null);
            notifications.show({ title: '已移出歌单', message: song.name, color: 'green' });
        } catch (e: any) {
            notifications.show({ title: '移出失败', message: e?.message ?? String(e), color: 'red' });
        }
    }, [currentFav, setFavorites, setConfirmRemoveSongId]);

    const addToFavoriteFromModal = useCallback((fav: Favorite) => {
        setStatus(`已添加到歌单: ${fav.title}`);
        closeModal("addFavoriteModal");
    }, [setStatus, closeModal]);

    const playlistSelect = useCallback((song: Song, index: number) => {
        setCurrentIndex(index);
        setIsPlaying(true);
        closeModal("playlistModal");
        playSong(song, queue);
    }, [setCurrentIndex, setIsPlaying, closeModal, playSong, queue]);

    const playlistReorder = useCallback((fromIndex: number, toIndex: number) => {
        const newQueue = [...queue];
        const [movedItem] = newQueue.splice(fromIndex, 1);
        newQueue.splice(toIndex, 0, movedItem);
        setQueue(newQueue);

        // 更新当前播放索引
        if (currentIndex === fromIndex) {
            setCurrentIndex(toIndex);
        } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
            setCurrentIndex(currentIndex - 1);
        } else if (fromIndex > currentIndex && toIndex <= currentIndex) {
            setCurrentIndex(currentIndex + 1);
        }
    }, [queue, setQueue, currentIndex, setCurrentIndex]);

    const playlistRemove = useCallback((index: number) => {
        const newQueue = queue.filter((_, i) => i !== index);
        setQueue(newQueue);

        // 如果删除的是当前播放的歌曲
        if (index === currentIndex) {
            if (newQueue.length === 0) {
                setCurrentSong(null);
                setIsPlaying(false);
            } else if (index >= newQueue.length) {
                // 删除的是最后一首，播放前一首
                const newIndex = newQueue.length - 1;
                setCurrentIndex(newIndex);
                setIsPlaying(true);
                playSong(newQueue[newIndex], newQueue);
            } else {
                // 播放同一位置的下一首
                setIsPlaying(true);
                playSong(newQueue[index], newQueue);
            }
        } else if (index < currentIndex) {
            // 删除的在当前播放之前，索引减1
            setCurrentIndex(currentIndex - 1);
        }
        // 如果删除的在当前播放之后，索引不变
    }, [queue, setQueue, currentIndex, setCurrentIndex, setIsPlaying, setCurrentSong, playSong]);

    return {
        addSongToFavorite,
        removeSongFromPlaylist,
        addToFavoriteFromModal,
        playlistSelect,
        playlistReorder,
        playlistRemove,
    };
};
