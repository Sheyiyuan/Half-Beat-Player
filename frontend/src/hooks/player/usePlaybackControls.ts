import { useCallback } from 'react';
import type { Song } from '../../types';

interface UsePlaybackControlsProps {
    audioRef: React.MutableRefObject<HTMLAudioElement | null>;
    currentSong: Song | null;
    currentIndex: number;
    queue: Song[];
    playMode: 'loop' | 'random' | 'single';
    intervalStart: number;
    intervalEnd: number;
    setIsPlaying: (playing: boolean) => void;
    setCurrentIndex: (index: number) => void;
    setCurrentSong: (song: Song | null) => void;
    setVolume: (volume: number) => void;
    playSong: (song: Song, list?: Song[]) => Promise<void>;
    playbackRetryRef: React.MutableRefObject<Map<string, number>>;
    isHandlingErrorRef?: React.MutableRefObject<Set<string>>;
}

export const usePlaybackControls = ({
    audioRef,
    currentSong,
    currentIndex,
    queue,
    playMode,
    intervalStart,
    intervalEnd,
    setIsPlaying,
    setCurrentIndex,
    setCurrentSong,
    setVolume,
    playSong,
    playbackRetryRef,
    isHandlingErrorRef,
}: UsePlaybackControlsProps) => {
    /**
     * 播放下一首
     * 注意：single 模式下“播放结束”由 onEnded 做单曲循环；但用户手动点击“下一曲”仍应正常切歌。
     * 
     * 播放模式说明：
     * - loop: 列表循环，播放到最后一首后回到第一首
     * - random: 随机播放，随机选择下一首
     * - single: 单曲循环（onEnded 重播）；手动切歌按列表顺序
     */
    const playNext = useCallback(() => {
        if (queue.length === 0) return;

        console.log('[playNext] 当前播放模式:', playMode, '队列长度:', queue.length);

        // 特殊处理：播放列表只有一首歌时，无论什么模式都应该重播当前歌曲
        if (queue.length === 1) {
            console.log('[playNext] 列表只有一首歌，重播当前歌曲');
            setCurrentIndex(0);
            const song = queue[0];
            if (song.id) {
                playbackRetryRef.current.delete(song.id);
                isHandlingErrorRef?.current.delete(song.id);
            }
            setCurrentSong(song);
            setIsPlaying(true);
            playSong(song, queue);
            return;
        }

        let nextIdx: number;

        if (playMode === "random") {
            // 随机播放：随机选择下一首（可能重复）
            nextIdx = Math.floor(Math.random() * queue.length);
            console.log('[playNext] 随机模式，选择索引:', nextIdx);
        } else {
            // 列表循环/单曲循环：手动切歌按列表顺序
            nextIdx = currentIndex + 1;
            if (nextIdx >= queue.length) {
                nextIdx = 0;
            }
            console.log('[playNext] 顺序切歌，当前索引:', currentIndex, '下一个索引:', nextIdx, '模式:', playMode);
        }

        setCurrentIndex(nextIdx);
        const nextSong = queue[nextIdx];

        // 清除新歌曲的重试计数和错误处理标记（用户手动切歌）
        if (nextSong.id) {
            playbackRetryRef.current.delete(nextSong.id);
            isHandlingErrorRef?.current.delete(nextSong.id);
        }

        setCurrentSong(nextSong);
        // 自动播放下一首
        setIsPlaying(true);
        playSong(nextSong, queue);
    }, [currentIndex, playMode, queue, setCurrentIndex, setCurrentSong, setIsPlaying, playSong, playbackRetryRef, isHandlingErrorRef]);

    /**
     * 播放上一首
     */
    const playPrev = useCallback(() => {
        if (queue.length === 0) return;

        console.log('[playPrev] 当前播放模式:', playMode, '队列长度:', queue.length);

        // 特殊处理：播放列表只有一首歌时，直接重播
        if (queue.length === 1) {
            console.log('[playPrev] 列表只有一首歌，重播当前歌曲');
            setCurrentIndex(0);
            const song = queue[0];
            if (song.id) {
                playbackRetryRef.current.delete(song.id);
                isHandlingErrorRef?.current.delete(song.id);
            }
            setCurrentSong(song);
            setIsPlaying(true);
            playSong(song, queue);
            return;
        }

        let prevIdx = currentIndex - 1;
        if (prevIdx < 0) prevIdx = queue.length - 1;
        setCurrentIndex(prevIdx);
        const prevSong = queue[prevIdx];
        // 清除新歌曲的重试计数和错误处理标记（用户手动切歌）
        if (prevSong.id) {
            playbackRetryRef.current.delete(prevSong.id);
            isHandlingErrorRef?.current.delete(prevSong.id);
        }
        setCurrentSong(prevSong);
        // 自动播放上一首
        setIsPlaying(true);
        playSong(prevSong, queue);
    }, [currentIndex, queue, setCurrentIndex, setCurrentSong, setIsPlaying, playSong, playbackRetryRef, isHandlingErrorRef]);

    /**
     * 切换播放/暂停
     */
    const togglePlay = useCallback(async () => {
        const audio = audioRef.current;
        if (!audio || !currentSong?.streamUrl) return;
        const target = Math.max(intervalStart, Math.min(audio.currentTime || 0, intervalEnd));
        audio.currentTime = target;
        if (audio.paused) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .catch((err) => {
                        console.error("播放失败:", err);

                        // 如果是 NotSupportedError 或 AbortError，可能是 URL 过期导致的
                        if (err.name === 'NotSupportedError' || err.name === 'AbortError') {
                            console.log("检测到音频加载失败，可能是 URL 过期，尝试刷新...");
                            if (currentSong?.bvid) {
                                setIsPlaying(false);
                                audio.pause();
                                audio.src = '';
                                // 刷新 URL
                                playSong({
                                    ...currentSong,
                                    streamUrl: '',
                                    streamUrlExpiresAt: new Date().toISOString(),
                                } as Song, queue).catch(console.error);
                            }
                            return;
                        }

                        // 如果是 NotAllowedError，尝试静音播放
                        if (err.name === 'NotAllowedError' && !audio.muted) {
                            console.log("尝试静音播放来绕过浏览器限制...");
                            audio.muted = true;
                            audio.play()
                                .then(() => {
                                    console.log("静音播放成功");
                                    // 1秒后取消静音
                                    setTimeout(() => {
                                        audio.muted = false;
                                    }, 1000);
                                })
                                .catch((e) => console.error("静音播放失败:", e));
                        }
                    });
            }
        } else {
            audio.pause();
        }
    }, [audioRef, currentSong, intervalStart, intervalEnd, setIsPlaying, playSong, queue]);

    /**
     * 改变音量
     */
    const changeVolume = useCallback((v: number) => {
        const audio = audioRef.current;
        const clamped = Math.min(1, Math.max(0, v));
        setVolume(clamped);
        if (audio) audio.volume = clamped;
    }, [audioRef, setVolume]);

    return {
        playNext,
        playPrev,
        togglePlay,
        changeVolume,
    };
};
