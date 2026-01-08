import { useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import type { Song } from '../../types';
import { convertSongs } from '../../types';
import * as Services from '../../../wailsjs/go/services/Service';

interface UsePlaySongProps {
    queue: Song[];
    selectedFavId: string | null;
    setQueue: (queue: Song[]) => void;
    setCurrentIndex: (index: number) => void;
    setCurrentSong: (song: Song | null) => void;
    setIsPlaying: (playing: boolean) => void;
    setStatus: (status: string) => void;
    setSongs: (songs: Song[]) => void;
    playbackRetryRef: React.MutableRefObject<Map<string, number>>;
}

/**
 * 核心播放函数 Hook
 * 处理歌曲播放的所有逻辑：本地缓存、URL 刷新、播放历史
 */
export const usePlaySong = ({
    queue,
    selectedFavId,
    setQueue,
    setCurrentIndex,
    setCurrentSong,
    setIsPlaying,
    setStatus,
    setSongs,
    playbackRetryRef,
}: UsePlaySongProps) => {
    const playSong = useCallback(async (song: Song, list?: Song[]) => {
        // 注意：不在这里清除重试计数，因为重试时会再次调用这个函数
        // 计数只在成功播放时（canplaythrough事件）或手动切歌时清除
        const targetList = list ?? queue;
        const idx = targetList.findIndex((s) => s.id === song.id);
        setQueue(targetList);
        setCurrentIndex(idx >= 0 ? idx : 0);

        let toPlay = song;

        // 优先使用本地缓存：如果存在本地文件且未被标记为失败，直接走本地代理URL
        // 如果 streamUrl 包含 __SKIP_LOCAL__ 说明该本地文件已经失败过，跳过本地文件
        const shouldSkipLocal = song.streamUrl?.includes('__SKIP_LOCAL__');

        if (!shouldSkipLocal) {
            try {
                const localUrl = await Services.GetLocalAudioURL(song.id);
                if (localUrl) {
                    // 先验证本地 URL 是否可用，避免死循环
                    let localOk = false;
                    try {
                        const ctrl = new AbortController();
                        const t = setTimeout(() => ctrl.abort(), 1500);
                        try {
                            const resp = await fetch(localUrl, { method: 'HEAD', cache: 'no-store', signal: ctrl.signal });
                            clearTimeout(t);
                            localOk = resp.ok;
                        } catch (fetchErr) {
                            clearTimeout(t);
                            // AbortError 表示超时或被中止，这是正常的失败情况
                            if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
                                console.warn('本地 URL 校验超时');
                            } else {
                                console.warn('本地 URL 校验失败:', fetchErr);
                            }
                        }
                    } catch (err) {
                        console.warn('本地 URL 校验异常', err);
                    }

                    if (localOk) {
                        console.log("找到本地缓存文件，使用本地 URL:", localUrl);
                        toPlay = {
                            ...song,
                            streamUrl: localUrl,
                            // 本地文件不需要过期，给一个很远的未来时间
                            streamUrlExpiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
                            updatedAt: new Date().toISOString()
                        } as any;
                        // 不保存到数据库，只是临时使用，避免保存过时的本地 URL 引用
                        setCurrentSong(toPlay);
                        setIsPlaying(true);
                        // 保存播放历史
                        const currentFavId = selectedFavId || "";
                        if (toPlay.id) {
                            Services.SavePlayHistory(currentFavId, toPlay.id).catch((e) => {
                                console.warn("保存播放历史失败", e);
                            });
                        }
                        return;
                    } else {
                        console.log('本地 URL 不可用，尝试获取网络播放地址');
                    }
                }
            } catch (e) {
                console.warn('检查本地缓存失败', e);
            }
        }

        const exp: any = (song as any).streamUrlExpiresAt;
        // 检查是否需要刷新URL：无URL、已过期、或不是代理URL（本地文件除外）
        const isLocalUrl = song.streamUrl?.includes('127.0.0.1:9999/local');
        const isProxyUrl = song.streamUrl?.includes('127.0.0.1:9999/audio');
        const expired = !isLocalUrl && (!song.streamUrl || !isProxyUrl || (exp && new Date(exp).getTime() <= Date.now() + 60_000));

        if (expired && song.bvid) {
            try {
                console.log("URL 过期或缺失，正在获取新的播放地址:", song.bvid);
                setStatus(`正在获取播放地址: ${song.name}`);
                const playInfo = await Services.GetPlayURL(song.bvid, 0);
                console.log("获取到播放信息:", playInfo);

                if (!playInfo || !playInfo.ProxyURL) {
                    console.error("playInfo缺少ProxyURL:", playInfo);
                    throw new Error("无法获取代理播放地址");
                }

                const proxyUrlWithSid = song.id ? `${playInfo.ProxyURL}&sid=${encodeURIComponent(song.id)}` : playInfo.ProxyURL;

                toPlay = {
                    ...song,
                    streamUrl: proxyUrlWithSid,
                    streamUrlExpiresAt: playInfo.ExpiresAt,
                    updatedAt: new Date().toISOString()
                } as any;
                console.log("已更新 streamUrl:", proxyUrlWithSid);
                console.log("过期时间:", playInfo.ExpiresAt);

                // 尝试保存到数据库，但如果失败也不影响播放
                try {
                    await Services.UpsertSongs([toPlay as any]);
                    const rawRefreshed = await Services.ListSongs();
                    setSongs(convertSongs(rawRefreshed || []));
                } catch (dbErr) {
                    console.warn("保存到数据库失败（不影响播放）:", dbErr);
                    // 继续使用内存中的 toPlay 继续播放
                }
                setStatus("就绪");
            } catch (e) {
                const errorMsg = e instanceof Error ? e.message : '未知错误';
                console.error("获取播放地址失败:", errorMsg);
                notifications.show({ title: '获取播放地址失败', message: errorMsg, color: 'red' });
                setStatus(`错误: ${errorMsg}`);
                setIsPlaying(false);
                return; // 停止播放
            }
        }

        setCurrentSong(toPlay);
        setIsPlaying(true);

        // 保存播放历史：记录当前歌单（如果存在）和歌曲
        const currentFavId = selectedFavId || "";
        if (toPlay.id) {
            Services.SavePlayHistory(currentFavId, toPlay.id).catch((e) => {
                console.warn("保存播放历史失败", e);
            });
        }
    }, [queue, selectedFavId, setQueue, setCurrentIndex, setCurrentSong, setIsPlaying, setStatus, setSongs, playbackRetryRef]);

    return { playSong };
};
