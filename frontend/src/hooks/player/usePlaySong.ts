import { useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import type { Song } from '../../types';
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
}: UsePlaySongProps) => {
    const playSong = useCallback(async (song: Song, list?: Song[]) => {
        const targetList = list ?? queue;
        const idx = targetList.findIndex((s) => s.id === song.id);
        setQueue(targetList);
        setCurrentIndex(idx >= 0 ? idx : 0);

        let toPlay = song;

        // 优先使用本地缓存：如果存在本地文件，直接走本地代理URL
        try {
            const localUrl = await Services.GetLocalAudioURL(song.id);
            if (localUrl) {
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
            }
        } catch (e) {
            console.warn('检查本地缓存失败', e);
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

                toPlay = {
                    ...song,
                    streamUrl: playInfo.ProxyURL,
                    streamUrlExpiresAt: playInfo.ExpiresAt,
                    updatedAt: new Date().toISOString()
                } as any;
                console.log("已更新 streamUrl:", playInfo.ProxyURL);
                console.log("过期时间:", playInfo.ExpiresAt);

                await Services.UpsertSongs([toPlay as any]);
                const refreshed = await Services.ListSongs();
                setSongs(refreshed);
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
    }, [queue, selectedFavId, setQueue, setCurrentIndex, setCurrentSong, setIsPlaying, setStatus, setSongs]);

    return { playSong };
};
