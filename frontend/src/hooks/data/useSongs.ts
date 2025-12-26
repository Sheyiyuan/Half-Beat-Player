/**
 * 歌曲数据管理 Hook
 * 管理歌曲列表的增删改查
 */

import { useState, useCallback } from 'react';
import type { Song } from '../../types';
import * as Services from '../../../wailsjs/go/services/Service';
import { storage, STORAGE_KEYS } from '../../utils/storage';

export interface UseSongsReturn {
    songs: Song[];
    setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
    loadSongs: () => Promise<void>;
    addSong: (song: Song) => Promise<void>;
    updateSong: (song: Song) => Promise<void>;
    deleteSong: (songId: string) => Promise<void>;
    refreshSongs: () => Promise<Song[]>;
}

export const useSongs = () => {
    const [songs, setSongs] = useState<Song[]>([]);

    // 加载歌曲列表（带缓存恢复）
    const loadSongs = useCallback(async () => {
        try {
            const songList = await Services.ListSongs();

            // 从 localStorage 恢复缓存的播放时间设置
            const songsWithCache = songList.map(song => {
                try {
                    const cacheKey = `${STORAGE_KEYS.SONG_CACHE_PREFIX}${song.id}`;
                    const cached = storage.get<{
                        skipStartTime: number;
                        skipEndTime: number;
                        updatedAt: string;
                    }>(cacheKey);

                    if (cached) {
                        return {
                            ...song,
                            skipStartTime: cached.skipStartTime ?? song.skipStartTime,
                            skipEndTime: cached.skipEndTime ?? song.skipEndTime,
                        };
                    }
                } catch (err) {
                    console.warn(`恢复歌曲 ${song.id} 缓存失败:`, err);
                }
                return song;
            });

            setSongs(songsWithCache);
        } catch (error) {
            console.error('加载歌曲列表失败:', error);
            throw error;
        }
    }, []);

    // 添加歌曲
    const addSong = useCallback(async (song: Song) => {
        try {
            await Services.UpsertSongs([song as any]);
            await loadSongs();
        } catch (error) {
            console.error('添加歌曲失败:', error);
            throw error;
        }
    }, [loadSongs]);

    // 更新歌曲
    const updateSong = useCallback(async (song: Song) => {
        try {
            await Services.UpsertSongs([song as any]);
            setSongs(prev => prev.map(s => s.id === song.id ? song : s));
        } catch (error) {
            console.error('更新歌曲失败:', error);
            throw error;
        }
    }, []);

    // 删除歌曲，自动清理未被引用的歌曲和流源
    const deleteSong = useCallback(async (songId: string) => {
        try {
            await Services.DeleteSong(songId);
            // 删除后清理所有未被任何歌单引用的歌曲
            const deletedCount = await Services.DeleteUnreferencedSongs();
            console.log('[deleteSong] 清理了', deletedCount, '首未被引用的歌曲');
            setSongs(prev => prev.filter(s => s.id !== songId));
        } catch (error) {
            console.error('删除歌曲失败:', error);
            throw error;
        }
    }, []);

    // 刷新歌曲列表
    const refreshSongs = useCallback(async () => {
        const refreshed = await Services.ListSongs();
        setSongs(refreshed);
        return refreshed;
    }, []);

    return {
        songs,
        setSongs,
        loadSongs,
        addSong,
        updateSong,
        deleteSong,
        refreshSongs,
    };
};
