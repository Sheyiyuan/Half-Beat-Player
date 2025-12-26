import { useEffect } from "react";
import type { MutableRefObject, RefObject } from "react";
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
    downloadedSongIds: Set<string>;
    setDownloadedSongIds: (v: Set<string>) => void;
    audioRef: RefObject<HTMLAudioElement>;
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
    downloadedSongIds,
    setDownloadedSongIds,
    audioRef,
    prevSongIdRef,
}: UseAppEffectsParams) => {
    // 同步区间值到 ref
    useEffect(() => {
        intervalRef.current = { start: intervalStart, end: intervalEnd, length: intervalLength };
    }, [intervalStart, intervalEnd, intervalLength, intervalRef]);

    // 当前歌曲下载状态 - 从 downloadedSongIds 同步
    useEffect(() => {
        if (currentSong?.id) {
            setIsDownloaded(downloadedSongIds.has(currentSong.id));
        } else {
            setIsDownloaded(false);
        }
    }, [currentSong?.id, downloadedSongIds, setIsDownloaded]);

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
};
