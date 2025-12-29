import { useCallback } from 'react';
import * as Services from '../../../wailsjs/go/services/Service';
import { Song } from '../../types';

interface UseSkipIntervalHandlerProps {
    currentSong: Song | null;
    setCurrentSong: (song: Song) => void;
    setSongs: (songs: Song[] | ((prev: Song[]) => Song[])) => void;
    setQueue: (songs: Song[] | ((prev: Song[]) => Song[])) => void;
    saveTimerRef: React.MutableRefObject<Map<string, NodeJS.Timeout>>;
    intervalStart: number;
    intervalEnd: number;
    intervalLength: number;
}

export const useSkipIntervalHandler = ({
    currentSong,
    setCurrentSong,
    setSongs,
    setQueue,
    saveTimerRef,
    intervalStart,
    intervalEnd,
    intervalLength,
}: UseSkipIntervalHandlerProps) => {

    const updateSongSkipTimes = useCallback((updates: Partial<Pick<Song, 'skipStartTime' | 'skipEndTime'>>, saveKey: string) => {
        if (!currentSong) return;

        const updated = {
            ...currentSong,
            ...updates,
        } as any;

        // 1. 立即同步更新 currentSong
        setCurrentSong(updated);

        // 2. 立即同步更新 songs 列表
        setSongs(prevSongs =>
            prevSongs.map(s => s.id === updated.id ? updated : s)
        );

        // 3. 立即同步更新 queue
        setQueue(prevQueue =>
            prevQueue.map(s => s.id === updated.id ? updated : s)
        );

        // 4. 立即写入 localStorage 缓存
        try {
            const cacheKey = `half-beat.song.${updated.id}`;
            localStorage.setItem(cacheKey, JSON.stringify({
                skipStartTime: updated.skipStartTime,
                skipEndTime: updated.skipEndTime,
                updatedAt: new Date().toISOString()
            }));
        } catch (err) {
            console.warn("写入缓存失败:", err);
        }

        // 5. 防抖异步持久化到数据库（500ms 后保存）
        const existingTimer = saveTimerRef.current.get(saveKey);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        const timer = setTimeout(() => {
            Services.UpsertSongs([updated]).catch((err) => {
                console.error(`保存 ${saveKey} 失败:`, err);
            });
            saveTimerRef.current.delete(saveKey);
        }, 500);

        saveTimerRef.current.set(saveKey, timer);
    }, [currentSong, setCurrentSong, setSongs, setQueue, saveTimerRef]);

    const handleIntervalChange = useCallback((start: number, end: number) => {
        if (!currentSong) return;
        const roundedStart = Math.round(start * 20) / 20;
        const roundedEnd = Math.round(end * 20) / 20;
        updateSongSkipTimes({
            skipStartTime: roundedStart,
            skipEndTime: roundedEnd,
        }, `interval_${currentSong.id}`);
        // 局部区间状态将由 currentSong 更新派生得到，无需额外 setter
    }, [currentSong, updateSongSkipTimes]);

    const handleSkipStartChange = useCallback((value: number) => {
        if (!currentSong) return;
        const roundedValue = Math.round(value * 20) / 20;
        updateSongSkipTimes({
            skipStartTime: roundedValue,
        }, `start_${currentSong.id}`);
        // 局部区间状态将由 currentSong 更新派生得到，无需额外 setter
    }, [currentSong, updateSongSkipTimes]);

    const handleSkipEndChange = useCallback((value: number) => {
        if (!currentSong) return;
        const roundedValue = Math.round(value * 20) / 20;
        updateSongSkipTimes({
            skipEndTime: roundedValue,
        }, `end_${currentSong.id}`);
        // 局部区间状态将由 currentSong 更新派生得到，无需额外 setter
    }, [currentSong, updateSongSkipTimes]);

    return {
        handleIntervalChange,
        handleSkipStartChange,
        handleSkipEndChange,
    };
};
