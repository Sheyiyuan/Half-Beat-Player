import { useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import * as Services from '../../../wailsjs/go/services/Service';
import { Song, Favorite, convertFavorites } from '../../types';
import type { ModalStates } from '../ui/useModalManager';

interface UsePlaylistActionsProps {
    queue: Song[];
    setQueue: (queue: Song[]) => void;
    currentIndex: number;
    setCurrentIndex: (index: number) => void;
    currentSong: Song | null;
    setCurrentSong: (song: Song | null) => void;
    setIsPlaying: (playing: boolean) => void;
    currentFav: Favorite | null;
    favorites: Favorite[];
    setFavorites: (favorites: Favorite[]) => void;
    setStatus: (status: string) => void;
    setConfirmRemoveSongId: (id: string | null) => void;
    openModal: (name: keyof ModalStates) => void;
    closeModal: (name: keyof ModalStates) => void;
    playSong: (song: Song, list?: Song[]) => Promise<void>;
    addCurrentToFavorite: (favId: string) => Promise<void>;
    addSongToFavorite: (song: Song, favId: string) => Promise<void>;
    setPendingFavoriteSong: (song: Song | null) => void;
    pendingFavoriteSong: Song | null;
}

export const usePlaylistActions = ({
    queue,
    setQueue,
    currentIndex,
    setCurrentIndex,
    currentSong,
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
    addCurrentToFavorite,
    addSongToFavorite,
    setPendingFavoriteSong,
    pendingFavoriteSong,
}: UsePlaylistActionsProps) => {

    const addSongToFavoriteFromList = useCallback((song: Song) => {
        console.log(`=== addSongToFavorite START for: ${song.name} ===`);

        // 使用 pendingFavoriteSong 而不是临时切换 currentSong
        setPendingFavoriteSong(song);
        openModal("addFavoriteModal");

        console.log('Opened modal for song:', song.name);
    }, [setPendingFavoriteSong, openModal]);

    const removeSongFromPlaylist = useCallback(async (song: Song) => {
        if (!currentFav) return;
        try {
            const updatedFav = {
                ...currentFav,
                songIds: currentFav.songIds.filter((ref: any) => ref.songId !== song.id),
            };
            await Services.SaveFavorite(updatedFav as any);
            const rawRefreshedFavs = await Services.ListFavorites();
            setFavorites(convertFavorites(rawRefreshedFavs || []));
            setConfirmRemoveSongId(null);
            notifications.show({ title: '已移出歌单', message: song.name, color: 'green' });
        } catch (e: any) {
            notifications.show({ title: '移出失败', message: e?.message ?? String(e), color: 'red' });
        }
    }, [currentFav, setFavorites, setConfirmRemoveSongId]);

    const addToFavoriteFromModal = useCallback(async (fav: Favorite) => {
        try {
            // 优先使用 pendingFavoriteSong，如果没有则使用 currentSong
            const targetSong = pendingFavoriteSong || currentSong;
            if (!targetSong) {
                console.log('没有目标歌曲');
                return;
            }

            if (pendingFavoriteSong) {
                // 使用 addSongToFavorite 处理 pending 歌曲
                await addSongToFavorite(pendingFavoriteSong, fav.id);
            } else {
                // 使用 addCurrentToFavorite 处理当前歌曲
                await addCurrentToFavorite(fav.id);
            }

            // 立即显示成功状态，不等待
            setStatus(`已添加到歌单: ${fav.title}`);

            // 清除 pending 状态
            setPendingFavoriteSong(null);

            // 稍微延迟关闭模态框，让用户看到反馈
            setTimeout(() => {
                closeModal("addFavoriteModal");
            }, 300);
        } catch (error) {
            console.error('Failed to add song to favorite:', error);
            setStatus(`添加失败: ${error}`);

            // 清除 pending 状态
            setPendingFavoriteSong(null);

            // 出错时也关闭模态框
            setTimeout(() => {
                closeModal("addFavoriteModal");
            }, 1000);
        }
    }, [pendingFavoriteSong, currentSong, addSongToFavorite, addCurrentToFavorite, setStatus, setPendingFavoriteSong, closeModal]);

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
        addSongToFavoriteFromList,
        removeSongFromPlaylist,
        addToFavoriteFromModal,
        playlistSelect,
        playlistReorder,
        playlistRemove,
    };
};
