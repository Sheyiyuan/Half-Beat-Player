import { useEffect, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import type { Song } from '../../types';

interface UseAudioEventsProps {
    audioRef: React.MutableRefObject<HTMLAudioElement | null>;
    currentSong: Song | null;
    queue: Song[];
    currentIndex: number;
    volume: number;
    playMode: 'loop' | 'random' | 'single';
    isPlaying: boolean;
    intervalRef: React.MutableRefObject<{ start: number; end: number; length: number }>;
    setIsPlaying: (playing: boolean) => void;
    setProgress: (progress: number) => void;
    setDuration: (duration: number) => void;
    setCurrentIndex: (index: number) => void;
    setCurrentSong: (song: Song | null) => void;
    setStatus: (status: string) => void;
    playbackRetryRef: React.MutableRefObject<Map<string, number>>;
    isHandlingErrorRef: React.MutableRefObject<Set<string>>;
    upsertSongs: (songs: Song[]) => Promise<void>;
    playSong: (song: Song, list?: Song[]) => Promise<void>;
    playNext: () => void;
}

export const useAudioEvents = ({
    audioRef,
    currentSong,
    queue,
    currentIndex,
    volume,
    playMode,
    isPlaying,
    intervalRef,
    setIsPlaying,
    setProgress,
    setDuration,
    setCurrentIndex,
    setCurrentSong,
    setStatus,
    playbackRetryRef,
    isHandlingErrorRef,
    upsertSongs,
    playSong,
    playNext,
}: UseAudioEventsProps) => {
    // 使用 Ref 跟踪 isPlaying 状态，避免频繁重新注册事件
    const isPlayingRef = useRef(isPlaying);
    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    // 注册音频事件监听
    useEffect(() => {
        const audio = (audioRef.current ||= new Audio());
        audio.crossOrigin = "anonymous";
        audio.volume = volume;

        // 错误处理
        const handleError = (e: ErrorEvent | Event) => {
            // 防止同一首歌曲的错误被多次处理
            if (!currentSong?.id || isHandlingErrorRef.current.has(currentSong.id)) {
                console.log('错误已在处理中，跳过重复处理');
                return;
            }
            isHandlingErrorRef.current.add(currentSong.id);

            console.error('音频加载错误:', e);
            const errorMsg = audio.error ? `${audio.error.code}: ${audio.error.message}` : '未知错误';
            console.log(`错误代码: ${audio.error?.code}, 消息: ${audio.error?.message}`);

            // AbortError 通常表示播放被中止或快速切歌，不需要处理
            if (audio.error && audio.error.code === 1) {
                console.log('播放被中止（快速切歌），跳过重试');
                isHandlingErrorRef.current.delete(currentSong.id);
                return;
            }

            // 如果是本地文件 404，说明文件已被删除，应该清除本地 URL 并重新获取
            const isLocalUrl = currentSong?.streamUrl?.includes('127.0.0.1:9999/local');
            if (isLocalUrl && currentSong?.bvid) {
                const count = (playbackRetryRef.current.get(currentSong.id) ?? 0) + 1;
                playbackRetryRef.current.set(currentSong.id, count);
                console.log(`本地文件加载失败，第 ${count} 次尝试重新获取网络地址...`);

                if (count > 2) {
                    const msg = '本地文件损坏且网络获取失败，请删除后重新下载';
                    setStatus(msg);
                    setIsPlaying(false);
                    notifications.show({ title: '播放失败', message: msg, color: 'red' });
                    // 如果是单曲循环，跳到下一首避免死循环
                    if (playMode === 'single' && queue.length > 1) {
                        playNext();
                    }
                    return;
                }

                setStatus('本地文件不可用，正在重新获取...');
                // 立即停止音频并清空 src，防止继续触发错误事件
                audio.pause();
                audio.src = '';

                // 清除本地 URL
                const clearedSong = {
                    ...currentSong,
                    streamUrl: '__SKIP_LOCAL__', // 标记跳过本地文件
                    streamUrlExpiresAt: new Date().toISOString(),
                };
                upsertSongs([clearedSong as any]).catch(console.error);
                // 延迟后重试播放
                setTimeout(() => {
                    if (clearedSong && clearedSong.id) {
                        playSong(clearedSong, queue).catch(err => {
                            console.error('音频重试播放失败:', err);
                        });
                    }
                }, 500);
                return;
            }

            // 如果是网络错误（通常是 403/404）或格式不支持错误，尝试刷新 URL
            // code 2 = MEDIA_ERR_NETWORK, code 4 = MEDIA_ERR_SRC_NOT_SUPPORTED
            if (audio.error && (audio.error.code === 2 || audio.error.code === 4) && currentSong?.bvid) {
                const count = (playbackRetryRef.current.get(currentSong.id) ?? 0) + 1;
                playbackRetryRef.current.set(currentSong.id, count);
                console.log(`[错误处理] 检测到网络/格式错误 (code=${audio.error.code})，第 ${count} 次尝试刷新播放地址...`);
                if (count > 2) {
                    const msg = '播放地址获取失败，请稍后重试';
                    setStatus(msg);
                    setIsPlaying(false);
                    notifications.show({ title: '播放失败', message: msg, color: 'red' });
                    // 如果是单曲循环，跳到下一首避免死循环
                    if (playMode === 'single' && queue.length > 1) {
                        playNext();
                    }
                    return;
                }

                const errorCodeMsg = audio.error.code === 2 ? '网络错误（403/404）' : '格式不支持';
                setStatus(`${errorCodeMsg}，正在重新获取...`);
                // 立即停止音频并清空 src，防止继续触发错误事件
                audio.pause();
                audio.src = '';

                // 强制清除 streamUrl 以便 playSong 重新获取
                const urlExpiredSong = {
                    ...currentSong,
                    streamUrl: '', // 清空 URL 强制刷新
                    streamUrlExpiresAt: new Date().toISOString(),
                } as unknown as Song;

                // 延迟一下再刷新，避免立即重试
                setTimeout(() => {
                    if (urlExpiredSong && urlExpiredSong.id) {
                        playSong(urlExpiredSong, queue).catch(err => {
                            console.error("[错误恢复] 音频重试播放失败:", err);
                        });
                    }
                }, 500);
                return;
            }

            setStatus(`音频错误: ${errorMsg}`);
            notifications.show({ title: '音频加载失败', message: errorMsg, color: 'red' });
            setIsPlaying(false);
        };

        // 时间更新处理
        const onTime = () => {
            const t = audio.currentTime;
            const { start, end } = intervalRef.current;

            if (t < start) {
                // 如果播放时间早于区间起点，调整回起点
                audio.currentTime = start;
                setProgress(start);
                return;
            }

            if (t > end) {
                // 播放到区间末尾：重置位置，暂停，并触发 ended 事件来处理播放模式
                // 但要保持用户设置的播放意图（通过 onEnded 中的 playMode 逻辑）
                audio.currentTime = start;
                setProgress(end);
                audio.pause();

                // 触发 ended 事件让 onEnded 处理器根据播放模式决定下一步动作
                // 这样可以正确处理单曲循环、列表循环、随机等模式
                audio.dispatchEvent(new Event('ended'));
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
            const { start } = intervalRef.current;

            console.log('[onEnded] 播放结束，当前模式:', playMode);

            // 根据播放模式处理播放结束
            if (playMode === 'single') {
                // 单曲循环：重置到区间起点并播放
                console.log('[onEnded] 单曲循环：重置播放');
                audio.currentTime = start;
                setProgress(start);
                audio.play().catch(console.error);
            } else {
                // 列表循环/随机播放：播放下一首
                console.log('[onEnded] 列表循环/随机：播放下一首');
                if (queue.length > 0) {
                    playNext();
                }
            }
        };

        // 音频可以播放处理 - 清理错误状态并根据 isPlaying 状态决定是否自动播放
        const onCanPlay = () => {
            if (currentSong?.id) {
                // 歌曲成功加载，清除错误处理标记
                isHandlingErrorRef.current.delete(currentSong.id);

                // 只在 isPlaying 为 true 时才自动播放（用户点击了播放按钮或切换歌曲）
                if (isPlayingRef.current && audio.paused) {
                    // 设置到区间起点
                    const { start } = intervalRef.current;
                    if (start > 0 && audio.currentTime < start) {
                        audio.currentTime = start;
                        setProgress(start);
                    }

                    audio.play().catch((err) => {
                        console.error("自动播放失败:", err);
                        setIsPlaying(false);
                    });
                }
            }
        };

        // 同步播放状态 - 当音频真正开始播放时
        const onPlay = () => {
            setIsPlaying(true);
        };

        // 同步暂停状态 - 当音频暂停时
        const onPause = () => {
            setIsPlaying(false);
        };

        audio.addEventListener('error', handleError);
        audio.addEventListener('timeupdate', onTime);
        audio.addEventListener('loadedmetadata', onLoaded);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('canplaythrough', onCanPlay);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);

        return () => {
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('timeupdate', onTime);
            audio.removeEventListener('loadedmetadata', onLoaded);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('canplaythrough', onCanPlay);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
        };
    }, [
        audioRef,
        currentSong,
        queue,
        currentIndex,
        volume,
        playMode,
        intervalRef,
        setIsPlaying,
        setProgress,
        setDuration,
        setCurrentIndex,
        setCurrentSong,
        setStatus,
        playbackRetryRef,
        isHandlingErrorRef,
        upsertSongs,
        playSong,
        playNext,
    ]);
};
