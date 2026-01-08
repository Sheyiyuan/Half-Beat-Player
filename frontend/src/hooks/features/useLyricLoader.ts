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
        if (!currentSong) {
            setLyric(null);
            return;
        }

        let isMounted = true;

        Services.GetLyricMapping(currentSong.id)
            .then(lyric => {
                if (isMounted) {
                    setLyric(lyric);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setLyric(null);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [currentSong?.id]);
};
