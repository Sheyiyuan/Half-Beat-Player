import { useEffect } from 'react';
import type { Song, LyricMapping } from '../../types';
import * as Services from '../../../wailsjs/go/services/Service';

interface UseLyricLoaderProps {
    currentSong: Song | null;
    setLyric: (lyric: LyricMapping | null) => void;
}

/**
 * 歌词加载 Hook
 * 当歌曲切换时，自动加载歌词
 */
export const useLyricLoader = ({
    currentSong,
    setLyric,
}: UseLyricLoaderProps) => {
    useEffect(() => {
        if (!currentSong) return;
        try {
            Services.GetLyricMapping(currentSong.id)
                .then(setLyric)
                .catch(() => setLyric(null));
        } catch (e) {
            console.warn("获取歌词失败", e);
            setLyric(null);
        }
    }, [currentSong, setLyric]);
};
