import { useEffect, useRef } from 'react';
import type { Song } from '../../types';

interface UseAudioSourceManagerProps {
    audioRef: React.MutableRefObject<HTMLAudioElement | null>;
    currentSong: Song | null;
    playingRef: React.MutableRefObject<string | null>;
    playbackRetryRef: React.MutableRefObject<Map<string, number>>;
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    onBeforePlay?: () => void;
}

/**
 * 音频源管理 Hook
 * 仅负责：设置音频源和控制播放/暂停
 * 不处理 URL 刷新、过期检测等，这些由其他 hooks 处理
 */
export const useAudioSourceManager = ({
    audioRef,
    currentSong,
    playingRef,
    playbackRetryRef,
    isPlaying,
    setIsPlaying,
    onBeforePlay,
}: UseAudioSourceManagerProps) => {
    // 缓存上次处理的歌曲ID和URL，避免重复处理
    const lastProcessedSongIdRef = useRef<string | null>(null);
    const lastProcessedUrlRef = useRef<string | null>(null);

    // 处理歌曲源设置（只在歌曲ID或URL实际改变时）
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentSong) {
            if (audio) {
                audio.pause();
                audio.src = "";
            }
            return;
        }

        // 仅在歌曲 ID 或 URL 实际改变时才处理
        const songIdChanged = lastProcessedSongIdRef.current !== currentSong.id;
        const urlChanged = lastProcessedUrlRef.current !== currentSong.streamUrl;

        if (!songIdChanged && !urlChanged) {
            // 元数据更新，忽略
            return;
        }

        // 记录本次处理的 ID 和 URL
        lastProcessedSongIdRef.current = currentSong.id;
        lastProcessedUrlRef.current = currentSong.streamUrl;

        // 如果歌曲 ID 改变，重置该歌曲的重试计数
        if (songIdChanged) {
            playbackRetryRef.current.delete(currentSong.id);
        }

        // 如果没有 URL，不设置音频源
        if (!currentSong.streamUrl) {
            audio.pause();
            audio.src = "";
            return;
        }

        // 防止并发播放：如果正在播放其他歌曲，先停止
        if (playingRef.current && playingRef.current !== currentSong.id) {
            audio.pause();
            audio.src = "";
        }

        // 设置音频源
        playingRef.current = currentSong.id;
        audio.src = currentSong.streamUrl;
        audio.crossOrigin = "anonymous";
        audio.preload = "metadata";
        audio.load();
        console.log("已设置音频源:", currentSong.id, currentSong.streamUrl);
    }, [currentSong?.id, currentSong?.streamUrl, audioRef, playingRef, playbackRetryRef]);

    // 处理播放/暂停控制
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentSong?.streamUrl) return;

        if (isPlaying && audio.paused) {
            try {
                onBeforePlay?.();
            } catch (e) {
                console.warn('onBeforePlay 执行失败:', e);
            }
            audio.play().catch((err) => {
                const name = err instanceof Error ? err.name : '';
                // Switching src/load can trigger transient AbortError/InvalidStateError.
                // Keep play intent and let canplay/loadedmetadata retry.
                if (name === 'AbortError' || name === 'InvalidStateError') {
                    console.warn('播放被中断/状态未就绪，等待媒体就绪后重试:', err);
                    return;
                }
                console.error('播放失败:', err);
                setIsPlaying(false);
            });
        } else if (!isPlaying && !audio.paused) {
            audio.pause();
        }
    }, [currentSong?.id, isPlaying, audioRef, setIsPlaying, onBeforePlay]);
};
