import { useEffect } from "react";
import type { MutableRefObject, RefObject } from "react";
import { notifications } from "@mantine/notifications";
import * as Services from "../../../wailsjs/go/services/Service";
import type { Song } from "../../types";

interface UseAppEffectsParams {
    intervalStart: number;
    intervalEnd: number;
    intervalLength: number;
    intervalRef: MutableRefObject<{ start: number; end: number; length: number } | null>;
    currentSong: Song | null;
    songs: Song[];
    setIsDownloaded: (v: boolean) => void;
    setDownloadedSongIds: (v: Set<string>) => void;
    audioRef: RefObject<HTMLAudioElement>;
    isPlaying: boolean;
    setIsPlaying: (v: boolean) => void;
    setStatus: (v: string) => void;
    playbackRetryRef: MutableRefObject<Map<string, number>>;
    prevSongIdRef: MutableRefObject<string | null>;
}

export const useAppEffects = ({
    intervalStart,
    intervalEnd,
    intervalLength,
    intervalRef,
    currentSong,
    songs,
    setIsDownloaded,
    setDownloadedSongIds,
    audioRef,
    isPlaying,
    setIsPlaying,
    setStatus,
    playbackRetryRef,
    prevSongIdRef,
}: UseAppEffectsParams) => {
    // 同步区间值到 ref
    useEffect(() => {
        intervalRef.current = { start: intervalStart, end: intervalEnd, length: intervalLength };
    }, [intervalStart, intervalEnd, intervalLength, intervalRef]);

    // 当前歌曲下载状态
    useEffect(() => {
        (async () => {
            try {
                if (currentSong?.id) {
                    const downloaded = await Services.IsSongDownloaded(currentSong.id);
                    setIsDownloaded(!!downloaded);
                } else {
                    setIsDownloaded(false);
                }
            } catch (e) {
                console.warn("检查下载状态失败", e);
                setIsDownloaded(false);
            }
        })();
    }, [currentSong, setIsDownloaded]);

    // 批量下载状态
    useEffect(() => {
        (async () => {
            if (songs.length === 0) {
                setDownloadedSongIds(new Set());
                return;
            }
            try {
                const results = await Promise.all(
                    songs.map(async (song) => {
                        try {
                            const downloaded = await Services.IsSongDownloaded(song.id);
                            return downloaded ? song.id : null;
                        } catch {
                            return null;
                        }
                    })
                );
                const downloadedIds = new Set(results.filter((id): id is string => id !== null));
                setDownloadedSongIds(downloadedIds);
            } catch (e) {
                console.warn("批量检查下载状态失败", e);
            }
        })();
    }, [songs, setDownloadedSongIds]);

    // 记录当前歌曲 ID
    useEffect(() => {
        prevSongIdRef.current = currentSong?.id ?? null;
    }, [currentSong?.id, prevSongIdRef]);

    // 控制播放/暂停
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentSong) return;

        const playWithRetry = () => {
            audio.play().catch((e) => {
                console.error("播放失败:", e);
                const count = (playbackRetryRef.current.get(currentSong.id) ?? 0) + 1;
                playbackRetryRef.current.set(currentSong.id, count);
                if (count >= 3) {
                    setIsPlaying(false);
                    setStatus(`无法播放: ${e}`);
                    notifications.show({ title: "播放失败", message: String(e), color: "red" });
                }
            });
        };

        if (isPlaying) {
            const onCanPlay = () => {
                audio.removeEventListener("canplay", onCanPlay);
                playWithRetry();
            };
            audio.addEventListener("canplay", onCanPlay, { once: true });
            if (audio.readyState >= 2) {
                playWithRetry();
            }
        } else {
            audio.pause();
        }
    }, [audioRef, isPlaying, currentSong, playbackRetryRef, setIsPlaying, setStatus]);
};
