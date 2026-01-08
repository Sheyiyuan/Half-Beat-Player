/**
 * 合并的音频处理 Hook
 * 整合了：useAudioEvents + useAudioInterval + useSkipIntervalHandler + useAudioSourceManager
 * 
 * 职责：
 * - 计算播放区间（跳过片头片尾）
 * - 处理区间跳过逻辑
 * - 处理音频事件（播放完毕、错误等）
 * - 管理音频源
 */

import { useRef, useEffect, useMemo, useCallback } from 'react';
import type { Song } from '../../types';
import * as Services from '../../../wailsjs/go/services/Service';

// ========== Types ==========

export interface PlayInterval {
    start: number;
    end: number;
    length: number;
}

export interface AudioState {
    progress: number;
    duration: number;
    volume: number;
    progressInInterval: number;
    intervalStart: number;
    intervalEnd: number;
    intervalLength: number;
}

export interface AudioActions {
    seek: (time: number) => void;
    setVolume: (volume: number) => void;
    setSkipInterval: (start: number, end: number) => void;
    updateSkipTimes: (song: Song, start: number, end: number) => void;
}

export interface UseAudioReturn {
    state: AudioState;
    actions: AudioActions;
    intervalRef: React.RefObject<PlayInterval>;
}

// ========== Hook ==========

interface UseAudioProps {
    audioRef: React.RefObject<HTMLAudioElement>;
    currentSong: Song | null;
    duration: number;
    progress: number;
    volume: number;

    // State setters
    setProgress: (progress: number) => void;
    setDuration: (duration: number) => void;
    setVolume: (volume: number) => void;
    setCurrentSong: (song: Song | null) => void;
    setSongs: (songs: Song[] | ((prev: Song[]) => Song[])) => void;
    setQueue: (songs: Song[] | ((prev: Song[]) => Song[])) => void;
    setIsPlaying: (playing: boolean) => void;
}

export const useAudio = ({
    audioRef,
    currentSong,
    duration,
    progress,
    volume,
    setProgress,
    setDuration,
    setVolume,
    setCurrentSong,
    setSongs,
    setQueue,
    setIsPlaying,
}: UseAudioProps): UseAudioReturn => {
    // ========== Refs ==========
    const intervalRef = useRef<PlayInterval>({ start: 0, end: 0, length: 0 });
    const saveTimerRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

    // ========== Audio Interval Calculation ==========

    const rawIntervalStart = currentSong?.skipStartTime ?? 0;
    const rawIntervalEnd = currentSong?.skipEndTime ?? 0;

    const intervalStart = useMemo(() =>
        Math.min(Math.max(rawIntervalStart, 0), duration || 0),
        [rawIntervalStart, duration]
    );

    const rawIntervalEndEffective = rawIntervalEnd === 0 ? (duration || 0) : rawIntervalEnd;
    const intervalEnd = useMemo(() =>
        Math.min(Math.max(rawIntervalEndEffective, intervalStart), duration || 0),
        [rawIntervalEndEffective, intervalStart, duration]
    );

    const intervalLength = useMemo(() =>
        Math.max(0, intervalEnd - intervalStart),
        [intervalEnd, intervalStart]
    );

    const progressInInterval = useMemo(() =>
        Math.max(0, Math.min(intervalLength || (duration || 0), progress - intervalStart)),
        [intervalLength, duration, progress, intervalStart]
    );

    // 同步区间值到 ref
    useEffect(() => {
        intervalRef.current = { start: intervalStart, end: intervalEnd, length: intervalLength };
    }, [intervalStart, intervalEnd, intervalLength]);

    // ========== Audio Events Handling ==========

    useEffect(() => {
        if (!audioRef.current) return;

        const audio = audioRef.current;

        // 时间更新事件
        const handleTimeUpdate = () => {
            const current = audio.currentTime;
            setProgress(current);

            // 检查是否需要跳过
            if (currentSong && intervalLength > 0) {
                if (current >= intervalEnd && current < intervalEnd + 0.1) {
                    // 到达区间结尾，停止播放
                    audio.pause();
                    setIsPlaying(false);
                }
            }
        };

        // 元数据加载事件
        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        // 播放结束事件
        const handleEnded = () => {
            setIsPlaying(false);
        };

        // 错误事件
        const handleError = () => {
            console.error('[useAudio] 音频播放错误:', audio.error);
            setIsPlaying(false);
        };

        // 可以播放事件
        const handleCanPlay = () => {
            console.log('[useAudio] 音频可以播放');
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);
        audio.addEventListener('canplay', handleCanPlay);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('canplay', handleCanPlay);
        };
    }, [audioRef, currentSong, intervalLength, intervalEnd, setProgress, setDuration, setIsPlaying]);

    // ========== Skip Interval Handling ==========

    const updateSkipTimes = useCallback((song: Song, start: number, end: number) => {
        if (!currentSong || currentSong.id !== song.id) return;

        const updated = {
            ...currentSong,
            skipStartTime: start,
            skipEndTime: end,
        };

        // 1. 立即同步更新 currentSong
        setCurrentSong(updated);

        // 2. 立即同步更新 songs 列表
        setSongs((prevSongs) =>
            Array.isArray(prevSongs)
                ? prevSongs.map((s) => s.id === updated.id ? updated : s)
                : prevSongs
        );

        // 3. 立即同步更新 queue
        setQueue((prevQueue) =>
            Array.isArray(prevQueue)
                ? prevQueue.map((s) => s.id === updated.id ? updated : s)
                : prevQueue
        );

        // 4. 写入 localStorage 缓存
        try {
            const cacheKey = `half-beat.song.${updated.id}`;
            localStorage.setItem(cacheKey, JSON.stringify({
                skipStartTime: updated.skipStartTime,
                skipEndTime: updated.skipEndTime,
                updatedAt: new Date().toISOString(),
            }));
        } catch (err) {
            console.warn('[useAudio] 写入缓存失败:', err);
        }

        // 5. 防抖异步持久化到数据库（500ms 后保存）
        const saveKey = `${song.id}`;
        if (saveTimerRef.current.has(saveKey)) {
            clearTimeout(saveTimerRef.current.get(saveKey)!);
        }

        const timer = setTimeout(async () => {
            try {
                // 使用本地 localStorage 缓存保存跳过时间
                // 后续可以通过其他接口同步到数据库
                const cacheKey = `half-beat.song.${updated.id}`;
                localStorage.setItem(cacheKey, JSON.stringify({
                    skipStartTime: start,
                    skipEndTime: end,
                    updatedAt: new Date().toISOString(),
                }));
                console.log('[useAudio] 跳过时间已保存到本地缓存');
            } catch (err) {
                console.warn('[useAudio] 保存跳过时间失败:', err);
            }
            saveTimerRef.current.delete(saveKey);
        }, 500);

        saveTimerRef.current.set(saveKey, timer);
    }, [currentSong, setCurrentSong, setSongs, setQueue]);

    // ========== Actions ==========

    const seek = useCallback((time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setProgress(time);
        }
    }, [audioRef, setProgress]);

    const handleSetVolume = useCallback((newVolume: number) => {
        setVolume(newVolume);
    }, [setVolume]);

    const setSkipInterval = useCallback((start: number, end: number) => {
        if (currentSong) {
            updateSkipTimes(currentSong, start, end);
        }
    }, [currentSong, updateSkipTimes]);

    // ========== Cleanup ==========
    useEffect(() => {
        return () => {
            saveTimerRef.current.forEach((timer) => clearTimeout(timer));
        };
    }, []);

    // ========== Memoized Return ==========

    const audioState: AudioState = useMemo(() => ({
        progress,
        duration,
        volume,
        progressInInterval,
        intervalStart,
        intervalEnd,
        intervalLength,
    }), [progress, duration, volume, progressInInterval, intervalStart, intervalEnd, intervalLength]);

    const audioActions: AudioActions = useMemo(() => ({
        seek,
        setVolume: handleSetVolume,
        setSkipInterval,
        updateSkipTimes,
    }), [seek, handleSetVolume, setSkipInterval, updateSkipTimes]);

    return {
        state: audioState,
        actions: audioActions,
        intervalRef,
    };
};
