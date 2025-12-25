import { useCallback } from 'react';
import type { Song, Favorite } from '../../types';
import * as Services from '../../../wailsjs/go/services/Service';

interface UseSongOperationsProps {
    currentSong: Song | null;
    songs: Song[];
    favorites: Favorite[];
    setSongs: (songs: Song[]) => void;
    setCurrentSong: (song: Song | null) => void;
    setFavorites: (favorites: Favorite[]) => void;
    playSong: (song: Song, list?: Song[]) => Promise<void>;
}

export const useSongOperations = ({
    currentSong,
    songs,
    favorites,
    setSongs,
    setCurrentSong,
    setFavorites,
    playSong,
}: UseSongOperationsProps) => {
    /**
     * 添加新歌曲
     */
    const addSong = useCallback(async () => {
        const name = prompt("歌曲名") || "新歌曲";
        const streamUrl = prompt("音频地址 (可选)") || "";
        const newSong = {
            id: "",
            bvid: "",
            name,
            singer: "",
            singerId: "",
            cover: "",
            streamUrl,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await Services.UpsertSongs([newSong as any]);
        const refreshed = await Services.ListSongs();
        setSongs(refreshed);
        if (!currentSong && refreshed.length) {
            playSong(refreshed[0], refreshed);
        }
    }, [currentSong, setSongs, playSong]);

    /**
     * 更新歌曲的播放地址
     */
    const updateStreamUrl = useCallback(async (url: string) => {
        if (!currentSong) return;
        const updated = { ...currentSong, streamUrl: url };
        await Services.UpsertSongs([updated as any]);
        const refreshed = await Services.ListSongs();
        setSongs(refreshed);
        setCurrentSong(updated as any);
    }, [currentSong, setSongs, setCurrentSong]);

    /**
     * 将当前歌曲添加到收藏夹
     */
    const addCurrentToFavorite = useCallback(async (favId: string) => {
        if (!currentSong) return;
        const target = favorites.find((f) => f.id === favId);
        if (!target) return;
        const next = {
            ...target,
            songIds: [...target.songIds, { id: 0, songId: currentSong.id, favoriteId: favId }],
        };
        await Services.SaveFavorite(next as any);
        const refreshed = await Services.ListFavorites();
        setFavorites(refreshed);
    }, [currentSong, favorites, setFavorites]);

    return {
        addSong,
        updateStreamUrl,
        addCurrentToFavorite,
    };
};
