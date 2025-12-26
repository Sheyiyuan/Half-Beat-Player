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
 * - BV号/链接：精确匹配本地结果 + B站搜索自动触发
 * - 关键字：模糊匹配本地（包含即可）
 */
export const useGlobalSearch = ({
    globalSearchTerm,
    songs,
    favorites,
}: UseGlobalSearchProps) => {
    const globalSearchResults: GlobalSearchResult[] = useMemo(() => {
        const term = globalSearchTerm.trim();
        if (!term) return [];

        // 判断是否为 BV 号或链接（注意这里不转小写，保持原样）
        const bvPattern = /BV[0-9A-Za-z]{10}/;
        const isBVSearch = bvPattern.test(term) || term.includes("bilibili.com");

        let songMatches: { kind: "song"; song: Song }[] = [];

        if (isBVSearch) {
            // BV 号搜索：本地精确匹配 BV 号
            const extractedBV = term.match(bvPattern)?.[0];
            if (extractedBV) {
                const extractedBVLower = extractedBV.toLowerCase();
                songMatches = songs
                    .filter((s) => {
                        const bvid = normalizeText(s.bvid);
                        return bvid === extractedBVLower;
                    })
                    .map((song) => ({ kind: "song" as const, song }));
            }
        } else {
            // 关键字搜索：模糊匹配（包含即可）
            const termLower = term.toLowerCase();
            songMatches = songs
                .filter((s) => {
                    const name = normalizeText(s.name);
                    const singer = normalizeText(s.singer);
                    const singerId = normalizeText(s.singerId);
                    return name.includes(termLower) || singer.includes(termLower) || singerId.includes(termLower);
                })
                .map((song) => ({ kind: "song" as const, song }));
        }

        // 收藏夹也支持搜索（无论什么类型的搜索都可以搜到）
        const term_lower = term.toLowerCase();
        const favoriteMatches = favorites
            .filter((f) => {
                const fid = normalizeText(f.id);
                const title = normalizeText(f.title);
                return fid.includes(term_lower) || title.includes(term_lower);
            })
            .map((favorite) => ({ kind: "favorite" as const, favorite }));

        return [...songMatches, ...favoriteMatches];
    }, [globalSearchTerm, songs, favorites]);

    return { globalSearchResults };
};
