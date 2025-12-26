/**
 * 播放列表管理 Hook
 * 只管理播放队列、当前歌曲索引、播放模式的状态
 * 播放控制逻辑由 usePlaybackControls 处理
 */

import { useState, useEffect } from 'react';
import type { Song } from '../../types';
import * as Services from '../../../wailsjs/go/services/Service';

export type PlayMode = 'loop' | 'random' | 'single';

export interface UsePlaylistReturn {
    queue: Song[];
    currentIndex: number;
    currentSong: Song | null;
    playMode: PlayMode;
    setQueue: (songs: Song[]) => void;
    setCurrentIndex: (index: number) => void;
    setCurrentSong: (song: Song | null) => void;
    setPlayMode: (mode: PlayMode) => void;
}

export const usePlaylist = () => {
    const [queue, setQueue] = useState<Song[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [playMode, setPlayMode] = useState<PlayMode>('loop');

    // 自动保存播放列表到后端（防抖）
    useEffect(() => {
        if (queue.length === 0) return;

        const savePlaylist = async () => {
            try {
                const queueIds = queue.map((song) => song.id);
                const queueJSON = JSON.stringify(queueIds);
                await Services.SavePlaylist(queueJSON, currentIndex);
                console.log('播放列表已保存');
            } catch (err) {
                console.warn('保存播放列表失败', err);
            }
        };

        const timeoutId = setTimeout(savePlaylist, 1000);
        return () => clearTimeout(timeoutId);
    }, [queue, currentIndex]);

    return {
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
