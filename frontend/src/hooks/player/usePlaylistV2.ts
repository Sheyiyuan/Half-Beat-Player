/**
 * 合并的播放列表 Hook
 * 整合了：usePlaylist + usePlaylistActions + usePlaylistPersistence
 * 
 * 职责：
 * - 管理播放队列
 * - 管理当前歌曲索引
 * - 播放列表持久化
 * - 播放列表基础操作
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import * as Services from '../../../wailsjs/go/services/Service';
import { Song, Favorite, convertFavorites } from '../../types';

// ========== Types ==========

export type PlayMode = 'loop-all' | 'loop-one' | 'shuffle' | 'no-loop';

export interface PlaylistState {
    queue: Song[];
    currentIndex: number;
    currentSong: Song | null;
    playMode: PlayMode;
}

export interface PlaylistActions {
    setQueue: (songs: Song[]) => void;
    setCurrentIndex: (index: number) => void;
    setCurrentSong: (song: Song | null) => void;
    setPlayMode: (mode: PlayMode) => void;

    // 播放列表操作
    clearQueue: () => void;
    removeSongFromQueue: (index: number) => void;
    reorderQueue: (fromIndex: number, toIndex: number) => void;
    loadPlaylist: () => Promise<void>;
    savePlaylist: () => Promise<void>;
}

export interface UsePlaylistReturn {
    state: PlaylistState;
    actions: PlaylistActions;

    // 便捷访问
    queue: Song[];
    currentIndex: number;
    currentSong: Song | null;
    playMode: PlayMode;
    setQueue: (songs: Song[]) => void;
    setCurrentIndex: (index: number) => void;
    setCurrentSong: (song: Song | null) => void;
    setPlayMode: (mode: PlayMode) => void;
}

// ========== Hook ==========

export const usePlaylist = (): UsePlaylistReturn => {
    // ========== State ==========
    const [queue, setQueue] = useState<Song[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [playMode, setPlayMode] = useState<PlayMode>('loop-all');

    // ========== Persistence ==========

    // 自动保存播放列表到后端（防抖）
    useEffect(() => {
        if (queue.length === 0) return;

        const savePlaylist = async () => {
            try {
                const queueIds = queue.map((song) => song.id);
                const queueJSON = JSON.stringify(queueIds);
                await Services.SavePlaylist(queueJSON, currentIndex);
                console.log('[usePlaylist] 播放列表已保存');
            } catch (err) {
                console.warn('[usePlaylist] 保存播放列表失败', err);
            }
        };

        const timeoutId = setTimeout(savePlaylist, 1000);
        return () => clearTimeout(timeoutId);
    }, [queue, currentIndex]);

    // ========== Actions ==========

    const clearQueue = useCallback(() => {
        setQueue([]);
        setCurrentIndex(0);
        setCurrentSong(null);
    }, []);

    const removeSongFromQueue = useCallback((index: number) => {
        setQueue((prev) => {
            const newQueue = prev.filter((_, i) => i !== index);
            if (newQueue.length === 0) {
                setCurrentIndex(0);
                setCurrentSong(null);
            } else if (index < currentIndex) {
                setCurrentIndex((prev) => Math.max(0, prev - 1));
            } else if (index === currentIndex && index >= newQueue.length) {
                setCurrentIndex(Math.max(0, newQueue.length - 1));
            }
            return newQueue;
        });
    }, [currentIndex]);

    const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
        setQueue((prev) => {
            const newQueue = [...prev];
            const [movedItem] = newQueue.splice(fromIndex, 1);
            newQueue.splice(toIndex, 0, movedItem);

            // 调整当前索引
            if (fromIndex === currentIndex) {
                setCurrentIndex(toIndex);
            } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
                setCurrentIndex((prev) => prev - 1);
            } else if (fromIndex > currentIndex && toIndex < currentIndex) {
                setCurrentIndex((prev) => prev + 1);
            }

            return newQueue;
        });
    }, [currentIndex]);

    const loadPlaylist = useCallback(async () => {
        try {
            const playlist = await Services.GetPlaylist();
            if (playlist) {
                // 注意：这里只是加载队列 ID，实际歌曲数据需要从其他地方获取
                const queueIds = (playlist as any)?.queueIds || [];
                if (queueIds.length > 0) {
                    console.log('[usePlaylist] 播放列表已加载:', queueIds.length, '首歌');
                }
            }
        } catch (err) {
            console.warn('[usePlaylist] 加载播放列表失败', err);
        }
    }, []);

    const savePlaylist = useCallback(async () => {
        try {
            const queueIds = queue.map((song) => song.id);
            const queueJSON = JSON.stringify(queueIds);
            await Services.SavePlaylist(queueJSON, currentIndex);
            console.log('[usePlaylist] 播放列表已主动保存');
        } catch (err) {
            console.warn('[usePlaylist] 保存播放列表失败', err);
        }
    }, [queue, currentIndex]);

    // ========== Memoized Return ==========

    const playlistState: PlaylistState = useMemo(() => ({
        queue,
        currentIndex,
        currentSong,
        playMode,
    }), [queue, currentIndex, currentSong, playMode]);

    const playlistActions: PlaylistActions = useMemo(() => ({
        setQueue,
        setCurrentIndex,
        setCurrentSong,
        setPlayMode,
        clearQueue,
        removeSongFromQueue,
        reorderQueue,
        loadPlaylist,
        savePlaylist,
    }), [setQueue, setCurrentIndex, setCurrentSong, setPlayMode, clearQueue, removeSongFromQueue, reorderQueue, loadPlaylist, savePlaylist]);

    return {
        state: playlistState,
        actions: playlistActions,

        // 便捷访问（保持向后兼容）
        queue,
        currentIndex,
        currentSong,
        playMode,
        setQueue,
        setCurrentIndex,
        setCurrentSong,
        setPlayMode,
    };
};
