/**
 * 音频播放器核心 Hook
 * 管理音频元素和基础播放状态
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import type { Song } from '../../types';

export interface AudioPlayerState {
    isPlaying: boolean;
    progress: number;
    duration: number;
    volume: number;
}

export interface AudioPlayerActions {
    play: () => Promise<void>;
    pause: () => void;
    seek: (time: number) => void;
    setVolume: (volume: number) => void;
}

export interface UseAudioPlayerReturn {
    audioRef: React.RefObject<HTMLAudioElement>;
    state: AudioPlayerState;
    actions: AudioPlayerActions;
}

export const useAudioPlayer = (currentSong: Song | null, initialVolume?: number) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(initialVolume ?? 0.5);

    // 初始化音频元素
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.crossOrigin = 'anonymous';
        }
    }, []);

    // 同步音量
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const play = useCallback(async () => {
        if (!audioRef.current) return;
        try {
            await audioRef.current.play();
            setIsPlaying(true);
        } catch (error) {
            console.error('播放失败:', error);
            setIsPlaying(false);
        }
    }, []);

    const pause = useCallback(() => {
        if (!audioRef.current) return;
        audioRef.current.pause();
        setIsPlaying(false);
    }, []);

    const seek = useCallback((time: number) => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = time;
        setProgress(time);
    }, []);

    const handleVolumeChange = useCallback((newVolume: number) => {
        setVolume(newVolume);
    }, []);

    return {
        audioRef,
        state: {
            isPlaying,
            progress,
            duration,
            volume,
        },
        actions: {
            play,
            pause,
            seek,
            setVolume: handleVolumeChange,
        },
        // 内部状态设置器（供其他 hooks 使用）
        setIsPlaying,
        setProgress,
        setDuration,
    };
};
