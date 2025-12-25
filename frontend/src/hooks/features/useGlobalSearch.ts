import { useMemo } from 'react';
import type { Song, Favorite } from '../../types';

type GlobalSearchResult =
    | { kind: "song"; song: Song }
    | { kind: "favorite"; favorite: Favorite };

interface UseGlobalSearchProps {
    globalSearchTerm: string;
    songs: Song[];
    favorites: Favorite[];
}

const normalizeText = (value?: string | null) => (value || "").toLowerCase();

/**
 * 全局搜索 Hook
 * 在歌曲和歌单中搜索匹配项
 */
export const useGlobalSearch = ({
    globalSearchTerm,
    songs,
    favorites,
}: UseGlobalSearchProps) => {
    const globalSearchResults: GlobalSearchResult[] = useMemo(() => {
        const term = globalSearchTerm.trim().toLowerCase();
        if (!term) return [];

        const songMatches = songs
            .filter((s) => {
                const name = normalizeText(s.name);
                const singer = normalizeText(s.singer);
                const bvid = normalizeText(s.bvid);
                const singerId = normalizeText(s.singerId);
                return name.includes(term) || singer.includes(term) || bvid.includes(term) || singerId.includes(term);
            })
            .map((song) => ({ kind: "song" as const, song }));

        const favoriteMatches = favorites
            .filter((f) => {
                const fid = normalizeText(f.id);
                const title = normalizeText(f.title);
                return fid.includes(term) || title.includes(term);
            })
            .map((favorite) => ({ kind: "favorite" as const, favorite }));

        return [...songMatches, ...favoriteMatches];
    }, [globalSearchTerm, songs, favorites]);

    return { globalSearchResults };
};
