import { useCallback } from 'react';
import type { Song, LyricMapping } from '../../types';
import * as Services from '../../../wailsjs/go/services/Service';

interface UseLyricManagementProps {
    currentSong: Song | null;
    lyric: LyricMapping | null;
    setLyric: (lyric: LyricMapping | null) => void;
}

export const useLyricManagement = ({
    currentSong,
    lyric,
    setLyric,
}: UseLyricManagementProps) => {
    /**
     * 保存歌词内容
     */
    const saveLyric = useCallback(async (value: string) => {
        if (!currentSong) return;
        const next = {
            id: currentSong.id,
            lyric: value,
            offsetMs: lyric?.offsetMs ?? 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await Services.SaveLyricMapping(next as any);
        setLyric(next as any);
    }, [currentSong, lyric?.offsetMs, setLyric]);

    /**
     * 保存歌词偏移量
     */
    const saveLyricOffset = useCallback(async (offset: number) => {
        if (!currentSong) return;
        const next = {
            id: currentSong.id,
            lyric: lyric?.lyric ?? "",
            offsetMs: offset,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await Services.SaveLyricMapping(next as any);
        setLyric(next as any);
    }, [currentSong, lyric?.lyric, setLyric]);

    return {
        saveLyric,
        saveLyricOffset,
    };
};
