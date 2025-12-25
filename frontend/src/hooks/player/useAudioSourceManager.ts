import { useEffect } from 'react';
import type { Song } from '../../types';

interface UseAudioSourceManagerProps {
    audioRef: React.MutableRefObject<HTMLAudioElement | null>;
    currentSong: Song | null;
    queue: Song[];
    playingRef: React.MutableRefObject<string | null>;
    playbackRetryRef: React.MutableRefObject<Map<string, number>>;
    setIsPlaying: (playing: boolean) => void;
    setStatus: (status: string) => void;
    playSong: (song: Song, list?: Song[]) => Promise<void>;
}

/**
 * 音频源管理 Hook
 * 监听 currentSong 变化，设置音频源和处理 URL 验证
 */
export const useAudioSourceManager = ({
    audioRef,
    currentSong,
    queue,
    playingRef,
    playbackRetryRef,
    setIsPlaying,
    setStatus,
    playSong,
}: UseAudioSourceManagerProps) => {
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
            const isExpired = exp && new Date(exp).getTime() <= Date.now() + 60_000;
            if (isExpired && currentSong.bvid) {
                console.log("URL 已过期，正在刷新...");
                setStatus("播放地址已过期，正在刷新...");
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

        playingRef.current = currentSong.id;
        audio.src = currentSong.streamUrl;
        audio.load();
        console.log("已设置音频源:", currentSong.streamUrl);
    }, [audioRef, currentSong, queue, playingRef, playbackRetryRef, setIsPlaying, setStatus, playSong]);
};
