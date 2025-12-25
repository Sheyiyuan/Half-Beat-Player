import { useCallback } from 'react';
import type { Song } from '../../types';

interface UsePlaybackControlsProps {
    audioRef: React.MutableRefObject<HTMLAudioElement | null>;
    currentSong: Song | null;
    currentIndex: number;
    queue: Song[];
    playMode: 'single' | 'list' | 'loop' | 'random';
    intervalStart: number;
    intervalEnd: number;
    setIsPlaying: (playing: boolean) => void;
    setCurrentIndex: (index: number) => void;
    setCurrentSong: (song: Song | null) => void;
    setVolume: (volume: number) => void;
    playSong: (song: Song, list?: Song[]) => Promise<void>;
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
}: UsePlaybackControlsProps) => {
    /**
     * 播放下一首
     */
    const playNext = useCallback(() => {
        if (playMode === "single") {
            const audio = audioRef.current;
            if (audio) {
                audio.currentTime = 0;
                audio.play().catch(console.error);
            }
        } else if (queue.length > 0) {
            let nextIdx = currentIndex + 1;
            if (playMode === "random") {
                nextIdx = Math.floor(Math.random() * queue.length);
            } else if (nextIdx >= queue.length) {
                nextIdx = 0;
            }
            setCurrentIndex(nextIdx);
            const nextSong = queue[nextIdx];
            setCurrentSong(nextSong);
            // 自动播放下一首
            setIsPlaying(true);
            playSong(nextSong, queue);
        }
    }, [audioRef, currentIndex, playMode, queue, setCurrentIndex, setCurrentSong, setIsPlaying, playSong]);

    /**
     * 播放上一首
     */
    const playPrev = useCallback(() => {
        if (queue.length > 0) {
            let prevIdx = currentIndex - 1;
            if (prevIdx < 0) prevIdx = queue.length - 1;
            setCurrentIndex(prevIdx);
            const prevSong = queue[prevIdx];
            setCurrentSong(prevSong);
            // 自动播放上一首
            setIsPlaying(true);
            playSong(prevSong, queue);
        }
    }, [currentIndex, queue, setCurrentIndex, setCurrentSong, setIsPlaying, playSong]);

    /**
     * 切换播放/暂停
     */
    const togglePlay = useCallback(async () => {
        const audio = audioRef.current;
        if (!audio || !currentSong?.streamUrl) return;
        const target = Math.max(intervalStart, Math.min(audio.currentTime || 0, intervalEnd));
        audio.currentTime = target;
        if (audio.paused) {
            await audio.play();
            setIsPlaying(true);
        } else {
            audio.pause();
            setIsPlaying(false);
        }
    }, [audioRef, currentSong, intervalStart, intervalEnd, setIsPlaying]);

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
