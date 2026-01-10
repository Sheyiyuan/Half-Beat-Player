import { useCallback, useRef, useEffect } from 'react';
import type { Song, Favorite } from '../../types';
import { convertSongs, convertFavorites } from '../../types';
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
    // 使用 ref 来避免依赖问题
    const currentSongRef = useRef(currentSong);

    useEffect(() => {
        currentSongRef.current = currentSong;
    }, [currentSong]);
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
        const rawRefreshed = await Services.ListSongs();
        setSongs(convertSongs(rawRefreshed || []));
        if (!currentSong && rawRefreshed.length) {
            playSong(convertSongs(rawRefreshed)[0], convertSongs(rawRefreshed));
        }
    }, [currentSong, setSongs, playSong]);

    /**
     * 更新歌曲的播放地址
     */
    const updateStreamUrl = useCallback(async (url: string) => {
        if (!currentSong) return;
        const updated = { ...currentSong, streamUrl: url };
        await Services.UpsertSongs([updated as any]);
        const rawRefreshed = await Services.ListSongs();
        setSongs(convertSongs(rawRefreshed || []));
        setCurrentSong(updated as any);
    }, [currentSong, setSongs, setCurrentSong]);

    /**
     * 更新歌曲信息（名称、歌手、封面等）
     */
    const updateSongInfo = useCallback(async (songId: string, updates: { name?: string; singer?: string; cover?: string }) => {
        const song = songs.find(s => s.id === songId);
        if (!song) return;

        const updated = {
            ...song,
            name: updates.name !== undefined ? updates.name : song.name,
            singer: updates.singer !== undefined ? updates.singer : song.singer,
            cover: updates.cover !== undefined ? updates.cover : song.cover,
            updatedAt: new Date().toISOString(),
        };

        await Services.UpsertSongs([updated as any]);
        const rawRefreshed = await Services.ListSongs();
        setSongs(convertSongs(rawRefreshed || []));

        // 如果更新的是当前播放的歌曲，也更新 currentSong
        if (currentSong?.id === songId) {
            setCurrentSong(updated as any);
        }
    }, [songs, currentSong, setSongs, setCurrentSong]);

    /**
     * 将指定歌曲添加到收藏夹 - 完全独立的实现，不影响播放器
     */
    const addSongToFavorite = useCallback(async (song: Song, favId: string) => {
        try {
            const [currentFavorites] = await Promise.all([
                Services.ListFavorites()
            ]);

            const favorites = convertFavorites(currentFavorites || []);

            // 找到目标收藏夹
            const target = favorites.find((f) => f.id === favId);
            if (!target) {
                console.log('找不到目标收藏夹');
                return;
            }

            // 检查歌曲是否已经在收藏夹中
            const alreadyExists = target.songIds.some(ref => ref.songId === song.id);
            if (alreadyExists) {
                console.log('歌曲已在收藏夹中');
                return;
            }

            // 创建更新后的收藏夹
            const updatedFavorite = {
                ...target,
                songIds: [...target.songIds, { id: 0, songId: song.id, favoriteId: favId }],
            };

            // 保存到数据库
            await Services.SaveFavorite(updatedFavorite as any);

            // 异步更新UI状态，不阻塞当前操作
            setTimeout(async () => {
                try {
                    const refreshedFavorites = await Services.ListFavorites();
                    setFavorites(convertFavorites(refreshedFavorites || []));
                } catch (error) {
                    console.error('更新收藏夹UI失败:', error);
                }
            }, 200);

            console.log('成功添加歌曲到收藏夹');
        } catch (error) {
            console.error('添加到收藏夹失败:', error);
            throw error;
        }
    }, [setFavorites]);

    /**
     * 将当前歌曲添加到收藏夹 - 完全独立的实现，不影响播放器
     */
    const addCurrentToFavorite = useCallback(async (favId: string) => {
        // 直接从数据库获取最新数据，避免依赖状态
        try {
            const song = currentSongRef.current;
            if (!song) {
                console.log('没有当前播放的歌曲');
                return;
            }

            return addSongToFavorite(song, favId);
        } catch (error) {
            console.error('添加当前歌曲到收藏夹失败:', error);
            throw error;
        }
    }, [addSongToFavorite]);

    return {
        addSong,
        updateStreamUrl,
        updateSongInfo,
        addCurrentToFavorite,
        addSongToFavorite,
    };
};
