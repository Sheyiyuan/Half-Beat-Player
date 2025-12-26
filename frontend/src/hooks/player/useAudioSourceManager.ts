import { useEffect } from 'react';
import type { Song } from '../../types';

interface UseAudioSourceManagerProps {
    audioRef: React.MutableRefObject<HTMLAudioElement | null>;
    currentSong: Song | null;
    queue: Song[];
    playingRef: React.MutableRefObject<string | null>;
    playbackRetryRef: React.MutableRefObject<Map<string, number>>;
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    setStatus: (status: string) => void;
    playSong: (song: Song, list?: Song[]) => Promise<void>;
}

/**
 * 音频源管理 Hook
 * 监听 currentSong 变化，设置音频源和处理 URL 验证
 * 注意：只在歌曲切换时设置音频源，播放/暂停状态变化不会触发
 */
export const useAudioSourceManager = ({
    audioRef,
    currentSong,
    queue,
    playingRef,
    playbackRetryRef,
    isPlaying,
    setIsPlaying,
    setStatus,
    playSong,
}: UseAudioSourceManagerProps) => {
    // Effect 1: 处理歌曲源设置（仅依赖 currentSong，不依赖 isPlaying）
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentSong) {
            if (audio) {
                audio.pause();
                audio.src = "";
            }
            return;
        }

        // 更换歌曲时重置该歌曲的重试计数，防止旧状态泄漏
        playbackRetryRef.current.delete(currentSong.id);

        // 检查 URL 是否存在和有效
        if (!currentSong.streamUrl) {
            setStatus("当前歌曲缺少播放地址，正在尝试获取...");
            // 尝试刷新 URL
            if (currentSong.bvid) {
                playSong(currentSong, queue);
            } else {
                setIsPlaying(false);
                audio.pause();
            }
            return;
        }

        // 检查 URL 是否过期（本地文件除外）
        const isLocalUrl = currentSong.streamUrl?.includes('127.0.0.1:9999/local');
        if (!isLocalUrl) {
            const exp = (currentSong as any).streamUrlExpiresAt;
            // 提前 5 分钟检测过期（原来是 1 分钟）
            const isExpired = exp && new Date(exp).getTime() <= Date.now() + 300_000;
            if (isExpired && currentSong.bvid) {
                console.log("[URL 过期检测] URL 即将过期或已过期，正在刷新...");
                setStatus("播放地址即将过期，正在刷新...");
                playSong(currentSong, queue);
                return;
            }
        }

        // 防止并发播放：如果正在播放其他歌曲，先停止
        if (playingRef.current && playingRef.current !== currentSong.id) {
            console.log(`停止播放 ${playingRef.current}，切换到 ${currentSong.id}`);
            audio.pause();
            audio.src = "";
        }

        // 只在切换歌曲时设置音频源
        playingRef.current = currentSong.id;
        audio.src = currentSong.streamUrl;
        // 设置媒体属性以支持跨域和流式播放
        audio.crossOrigin = "anonymous";
        audio.preload = "metadata";
        audio.load();
        console.log("已设置音频源:", currentSong.streamUrl);
    }, [audioRef, currentSong, queue, playingRef, playbackRetryRef, setIsPlaying, setStatus, playSong]);

    // Effect 2: 处理播放/暂停控制（仅依赖 isPlaying 状态变化）
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentSong?.streamUrl) return;

        // 根据 isPlaying 状态控制播放/暂停
        if (isPlaying && audio.paused) {
            // 只有在音频已经准备好的情况下才播放
            // 对于新加载的音频，会在 canplaythrough 事件中自动播放
            if (audio.readyState >= 3) { // HAVE_FUTURE_DATA
                audio.play().catch((err) => {
                    console.error("播放失败:", err);
                    setIsPlaying(false);
                });
            }
        } else if (!isPlaying && !audio.paused) {
            audio.pause();
        }
    }, [audioRef, currentSong?.streamUrl, isPlaying, setIsPlaying]);
};
