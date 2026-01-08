/**
 * 合并的播放器 Hook
 * 整合了：useAudioPlayer + usePlaybackControls + usePlaySong + usePlayModes
 * 
 * 职责：
 * - 管理音频元素
 * - 基础播放状态（播放/暂停、音量、进度）
 * - 播放控制（播放下一首、上一首、切换播放模式）
 * - 歌曲播放逻辑
 */

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import type { Song } from '../../types';
import { convertSongs } from '../../types';
import * as Services from '../../../wailsjs/go/services/Service';

// ========== Types ==========

export interface PlayerState {
    isPlaying: boolean;
    progress: number;
    duration: number;
    volume: number;
    playMode: 'loop-all' | 'loop-one' | 'shuffle' | 'no-loop';
}

export interface PlayerActions {
    play: () => Promise<void>;
    pause: () => void;
    seek: (time: number) => void;
    setVolume: (volume: number) => void;
    nextSong: () => void;
    prevSong: () => void;
    setPlayMode: (mode: 'loop-all' | 'loop-one' | 'shuffle' | 'no-loop') => void;
    playSong: (song: Song, list?: Song[]) => Promise<void>;
}

export interface UsePlayerReturn {
    audioRef: React.RefObject<HTMLAudioElement>;
    state: PlayerState;
    actions: PlayerActions;
    // 内部状态设置器（供其他 hooks 使用）
    setIsPlaying: (playing: boolean) => void;
    setProgress: (progress: number) => void;
    setDuration: (duration: number) => void;
}

// ========== Hook ==========

interface UsePlayerProps {
    currentSong: Song | null;
    currentIndex: number;
    queue: Song[];
    playMode: 'loop-all' | 'loop-one' | 'shuffle' | 'no-loop';
    selectedFavId: string | null;
    songs: Song[];

    // State setters from Store
    setCurrentIndex: (index: number) => void;
    setCurrentSong: (song: Song | null) => void;
    setQueue: (queue: Song[]) => void;
    setPlayMode: (mode: 'loop-all' | 'loop-one' | 'shuffle' | 'no-loop') => void;
    setSongs: (songs: Song[]) => void;
    setStatus: (status: string) => void;
}

export const usePlayer = ({
    currentSong,
    currentIndex,
    queue,
    playMode,
    selectedFavId,
    songs,
    setCurrentIndex,
    setCurrentSong,
    setQueue,
    setPlayMode,
    setSongs,
    setStatus,
}: UsePlayerProps): UsePlayerReturn => {
    // ========== State ==========
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.5);

    // Refs for retry logic
    const playbackRetryRef = useRef<Map<string, number>>(new Map());
    const isHandlingErrorRef = useRef<Set<string>>(new Set());

    // ========== Initialize Audio Element ==========
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.crossOrigin = 'anonymous';

            // 音频事件处理...后续补充
        }
    }, []);

    // ========== Sync Volume ==========
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // ========== Play/Pause/Seek Actions ==========
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

    // ========== Play Song ==========
    const playSong = useCallback(async (song: Song, list?: Song[]) => {
        const targetList = list ?? queue;
        const idx = targetList.findIndex((s) => s.id === song.id);
        setQueue(targetList);
        setCurrentIndex(idx >= 0 ? idx : 0);

        let toPlay = song;

        // 优先使用本地缓存
        const shouldSkipLocal = song.streamUrl?.includes('__SKIP_LOCAL__');

        if (!shouldSkipLocal) {
            try {
                const localUrl = await Services.GetLocalAudioURL(song.id);
                if (localUrl) {
                    let localOk = false;
                    try {
                        const ctrl = new AbortController();
                        const t = setTimeout(() => ctrl.abort(), 1500);
                        try {
                            const resp = await fetch(localUrl, {
                                method: 'HEAD',
                                cache: 'no-store',
                                signal: ctrl.signal
                            });
                            clearTimeout(t);
                            localOk = resp.ok;
                        } catch (e) {
                            clearTimeout(t);
                        }
                    } catch (e) {
                        // Ignore
                    }

                    if (localOk) {
                        toPlay = { ...song, streamUrl: localUrl };
                        console.log('[playSong] 使用本地文件:', localUrl);
                    }
                }
            } catch (e) {
                console.warn('[playSong] 获取本地 URL 失败:', e);
            }
        }

        // 刷新远程 URL
        if (!toPlay.streamUrl || toPlay.streamUrl === song.streamUrl) {
            try {
                const playInfo = await Services.GetPlayURL(song.bvid, 0);
                if (playInfo?.ProxyURL && playInfo.ProxyURL !== '') {
                    const now = new Date();
                    const proxyUrlWithSid = song.id ? `${playInfo.ProxyURL}&sid=${encodeURIComponent(song.id)}` : playInfo.ProxyURL;
                    toPlay = {
                        ...toPlay,
                        streamUrl: proxyUrlWithSid,
                        streamUrlExpiresAt: new Date(now.getTime() + 6 * 3600 * 1000).toISOString(),
                    };
                    console.log('[playSong] 获取远程 URL 成功');
                }
            } catch (e) {
                console.warn('[playSong] 刷新远程 URL 失败:', e);
                setStatus('获取音频链接失败，请重试');
                setIsPlaying(false);
                return;
            }
        }

        setCurrentSong(toPlay);

        // 设置音频源
        if (audioRef.current && toPlay.streamUrl) {
            audioRef.current.src = toPlay.streamUrl;
            setIsPlaying(true);
            await play();
        }
    }, [queue, setQueue, setCurrentIndex, setCurrentSong, setStatus, play]);

    // ========== Playback Controls ==========
    const playNext = useCallback(() => {
        if (queue.length === 0) return;

        if (queue.length === 1) {
            setCurrentIndex(0);
            const song = queue[0];
            if (song.id) {
                playbackRetryRef.current.delete(song.id);
                isHandlingErrorRef.current.delete(song.id);
            }
            setCurrentSong(song);
            setIsPlaying(true);
            playSong(song, queue);
            return;
        }

        let nextIdx: number;

        if (playMode === "shuffle") {
            nextIdx = Math.floor(Math.random() * queue.length);
        } else if (playMode === "loop-all") {
            nextIdx = currentIndex + 1;
            if (nextIdx >= queue.length) {
                nextIdx = 0;
            }
        } else {
            console.warn('[playNext] 单曲循环模式不应该调用 playNext');
            return;
        }

        setCurrentIndex(nextIdx);
        const nextSong = queue[nextIdx];

        if (nextSong.id) {
            playbackRetryRef.current.delete(nextSong.id);
            isHandlingErrorRef.current.delete(nextSong.id);
        }

        setCurrentSong(nextSong);
        setIsPlaying(true);
        playSong(nextSong, queue);
    }, [currentIndex, playMode, queue, setCurrentIndex, setCurrentSong, setIsPlaying, playSong]);

    const playPrev = useCallback(() => {
        if (queue.length === 0) return;

        let prevIdx: number;

        if (playMode === "shuffle") {
            prevIdx = Math.floor(Math.random() * queue.length);
        } else {
            prevIdx = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
        }

        setCurrentIndex(prevIdx);
        const prevSong = queue[prevIdx];

        if (prevSong.id) {
            playbackRetryRef.current.delete(prevSong.id);
            isHandlingErrorRef.current.delete(prevSong.id);
        }

        setCurrentSong(prevSong);
        setIsPlaying(true);
        playSong(prevSong, queue);
    }, [currentIndex, playMode, queue, setCurrentIndex, setCurrentSong, setIsPlaying, playSong]);

    const handleSetPlayMode = useCallback((mode: 'loop-all' | 'loop-one' | 'shuffle' | 'no-loop') => {
        setPlayMode(mode);
        notifications.show({
            title: '播放模式已更改',
            message: `当前模式: ${mode === 'loop-all' ? '列表循环' :
                mode === 'loop-one' ? '单曲循环' :
                    mode === 'shuffle' ? '随机播放' :
                        '不循环'
                }`,
            autoClose: 1500,
        });
    }, [setPlayMode]);

    // ========== Memoized Return ==========
    const playerState: PlayerState = useMemo(() => ({
        isPlaying,
        progress,
        duration,
        volume,
        playMode,
    }), [isPlaying, progress, duration, volume, playMode]);

    const playerActions: PlayerActions = useMemo(() => ({
        play,
        pause,
        seek,
        setVolume: handleVolumeChange,
        nextSong: playNext,
        prevSong: playPrev,
        setPlayMode: handleSetPlayMode,
        playSong,
    }), [play, pause, seek, handleVolumeChange, playNext, playPrev, handleSetPlayMode, playSong]);

    return {
        audioRef,
        state: playerState,
        actions: playerActions,
        setIsPlaying,
        setProgress,
        setDuration,
    };
};
