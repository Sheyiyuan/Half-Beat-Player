import { useEffect, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import type { Song } from '../../types';

interface UseAudioEventsProps {
    audioRef: React.MutableRefObject<HTMLAudioElement | null>;
    currentSong: Song | null;
    queue: Song[];
    currentIndex: number;
    volume: number;
    intervalRef: React.MutableRefObject<{ start: number; end: number; length: number }>;
    setIsPlaying: (playing: boolean) => void;
    setProgress: (progress: number) => void;
    setDuration: (duration: number) => void;
    setCurrentIndex: (index: number) => void;
    setCurrentSong: (song: Song | null) => void;
    setStatus: (status: string) => void;
    playbackRetryRef: React.MutableRefObject<Map<string, number>>;
    upsertSongs: (songs: Song[]) => Promise<void>;
    playSong: (song: Song, list?: Song[]) => Promise<void>;
}

export const useAudioEvents = ({
    audioRef,
    currentSong,
    queue,
    currentIndex,
    volume,
    intervalRef,
    setIsPlaying,
    setProgress,
    setDuration,
    setCurrentIndex,
    setCurrentSong,
    setStatus,
    playbackRetryRef,
    upsertSongs,
    playSong,
}: UseAudioEventsProps) => {
    // 注册音频事件监听
    useEffect(() => {
        const audio = (audioRef.current ||= new Audio());
        audio.crossOrigin = "anonymous";
        audio.volume = volume;

        // 错误处理
        const handleError = (e: ErrorEvent | Event) => {
            console.error('音频加载错误:', e);
            const errorMsg = audio.error ? `${audio.error.code}: ${audio.error.message}` : '未知错误';
            console.log(`错误代码: ${audio.error?.code}, 消息: ${audio.error?.message}`);

            // AbortError 通常表示播放被中止或快速切歌，不需要处理
            if (audio.error && audio.error.code === 1) {
                console.log('播放被中止（快速切歌），跳过重试');
                return;
            }

            // 如果是本地文件 404，说明文件已被删除，应该清除本地 URL 并重新获取
            const isLocalUrl = currentSong?.streamUrl?.includes('127.0.0.1:9999/local');
            if (isLocalUrl && currentSong?.bvid) {
                console.log('本地文件加载失败，清除本地 URL 并重新获取网络地址...');
                setStatus('本地文件不可用，正在重新获取...');
                // 清除本地 URL
                const clearedSong = {
                    ...currentSong,
                    streamUrl: '',
                    streamUrlExpiresAt: new Date().toISOString(),
                };
                upsertSongs([clearedSong as any]).catch(console.error);
                // 延迟后重试播放
                setTimeout(() => {
                    if (currentSong && currentSong.id) {
                        playSong(currentSong, queue);
                    }
                }, 500);
                return;
            }

            // 如果是网络错误（通常是 403），尝试刷新 URL，但限制重试次数
            if (audio.error && audio.error.code === 2 && currentSong?.bvid) {
                const count = (playbackRetryRef.current.get(currentSong.id) ?? 0) + 1;
                playbackRetryRef.current.set(currentSong.id, count);
                console.log(`检测到网络错误（可能是 403），第 ${count} 次尝试刷新播放地址...`);
                if (count > 3) {
                    const msg = '播放地址刷新失败，请稍后重试';
                    setStatus(msg);
                    setIsPlaying(false);
                    notifications.show({ title: '播放失败', message: msg, color: 'red' });
                    return;
                }
                setStatus('播放地址失效，正在刷新...');
                // 延迟一下再刷新，避免立即重试
                setTimeout(() => {
                    if (currentSong && currentSong.id) {
                        playSong(currentSong, queue);
                    }
                }, 500);
                return;
            }

            // 如果是源不支持/URL 无效，直接停止并提示，避免循环
            if (audio.error && audio.error.code === 4) {
                const msg = '音频源不可用或格式不支持';
                setStatus(msg);
                setIsPlaying(false);
                notifications.show({ title: '播放失败', message: msg, color: 'red' });
                return;
            }

            setStatus(`音频错误: ${errorMsg}`);
            notifications.show({ title: '音频加载失败', message: errorMsg, color: 'red' });
        };

        // 时间更新处理
        const onTime = () => {
            const t = audio.currentTime;
            const { start, end } = intervalRef.current;
            if (t < start) {
                audio.currentTime = start;
                setProgress(start);
                return;
            }
            if (t > end) {
                audio.pause();
                setIsPlaying(false);
                audio.currentTime = start;
                setProgress(end);
                return;
            }
            setProgress(t);
        };

        // 元数据加载处理
        const onLoaded = () => {
            const loadedDuration = audio.duration || 0;
            setDuration(loadedDuration);

            // 如果当前歌曲的 skipEndTime 为 0，自动设置为实际时长
            if (currentSong && loadedDuration > 0 && currentSong.skipEndTime === 0) {
                const updatedSong = {
                    ...currentSong,
                    skipEndTime: loadedDuration,
                } as any;
                setCurrentSong(updatedSong);

                // 自动保存到数据库
                upsertSongs([updatedSong]).catch((err) => {
                    console.warn('自动保存结束时间失败:', err);
                });
            }
        };

        // 播放结束处理
        const onEnded = () => {
            // 如果在区间内播放完，直接停；否则按队列跳下一首
            const { start, end } = intervalRef.current;
            if (audio.currentTime >= end) {
                audio.pause();
                setIsPlaying(false);
                audio.currentTime = start;
                setProgress(start);
                return;
            }
            if (queue.length > 0 && currentIndex < queue.length - 1) {
                const nextIndex = currentIndex + 1;
                setCurrentIndex(nextIndex);
                setCurrentSong(queue[nextIndex]);
            } else {
                setIsPlaying(false);
            }
        };

        audio.addEventListener('error', handleError);
        audio.addEventListener('timeupdate', onTime);
        audio.addEventListener('loadedmetadata', onLoaded);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('timeupdate', onTime);
            audio.removeEventListener('loadedmetadata', onLoaded);
            audio.removeEventListener('ended', onEnded);
        };
    }, [
        audioRef,
        currentSong,
        queue,
        currentIndex,
        volume,
        intervalRef,
        setIsPlaying,
        setProgress,
        setDuration,
        setCurrentIndex,
        setCurrentSong,
        setStatus,
        playbackRetryRef,
        upsertSongs,
        playSong,
    ]);
};
