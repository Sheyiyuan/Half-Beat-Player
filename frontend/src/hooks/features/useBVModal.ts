import { useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import * as Services from '../../../wailsjs/go/services/Service';
import { Song, Favorite, convertSongs, convertFavorites } from '../../types';
import { SongClass } from '../../types';

interface UseBVModalProps {
    bvPreview: any | null;
    sliceStart: number;
    sliceEnd: number;
    bvSongName: string;
    bvSinger: string;
    bvTargetFavId: string | null;
    selectedFavId: string | null;
    favorites: Favorite[];
    songs: Song[];
    currentSong: Song | null;
    themeColor: string;
    setBvModalOpen: (open: boolean) => void;
    setBvPreview: (preview: any) => void;
    setBvSongName: (name: string) => void;
    setBvSinger: (singer: string) => void;
    setSliceStart: (start: number) => void;
    setSliceEnd: (end: number) => void;
    setSongs: (songs: Song[]) => void;
    setFavorites: (favorites: Favorite[]) => void;
    setSelectedFavId: (id: string | null) => void;
}

export const useBVModal = ({
    bvPreview,
    sliceStart,
    sliceEnd,
    bvSongName,
    bvSinger,
    bvTargetFavId,
    selectedFavId,
    favorites,
    songs,
    currentSong,
    themeColor,
    setBvModalOpen,
    setBvPreview,
    setBvSongName,
    setBvSinger,
    setSliceStart,
    setSliceEnd,
    setSongs,
    setFavorites,
    setSelectedFavId,
}: UseBVModalProps) => {

    const handleConfirmBVAdd = useCallback(async () => {
        if (!bvPreview) return;
        const targetFavId = bvTargetFavId || favorites[0]?.id || null;
        const start = Math.max(0, sliceStart);
        const songDuration = bvPreview.duration || 0;
        const end = sliceEnd > 0 ? Math.max(start, sliceEnd) : songDuration;

        try {
            // 1. 获取分P信息（多P将拆分为多首）
            let pagesToAdd: Song[] = [];
            try {
                const rawPages = await Services.SearchBVID(bvPreview.bvid || '');
                const converted = convertSongs(rawPages || []);
                pagesToAdd = converted.filter((s) => !s.id || s.id.trim() === '');
            } catch (err) {
                console.warn('获取分P信息失败，回退为单首添加:', err);
            }

            if (pagesToAdd.length === 0) {
                pagesToAdd = [{
                    id: '',
                    bvid: bvPreview.bvid || '',
                    name: bvSongName || bvPreview.title || '',
                    singer: bvSinger || '',
                    singerId: '',
                    cover: bvPreview.cover || '',
                    coverLocal: '',
                    sourceId: '',
                    streamUrl: '',
                    streamUrlExpiresAt: '',
                    lyric: '',
                    lyricOffset: 0,
                    skipStartTime: start,
                    skipEndTime: end,
                    pageNumber: 1,
                    pageTitle: '',
                    videoTitle: bvPreview.title || '',
                    totalPages: 1,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                } as Song];
            }

            // 2. 为每个分P创建独立流源与歌曲实例
            const newSongs: Song[] = [];
            const createdSourceIds: string[] = [];

            for (const page of pagesToAdd) {
                const pageNumber = page.pageNumber > 0 ? page.pageNumber : 1;
                const playInfo = await Services.GetPlayURL(page.bvid || bvPreview.bvid || '', pageNumber);
                const sourceId = await Services.CreateStreamSource(
                    page.bvid || bvPreview.bvid || '',
                    playInfo.RawURL,
                    playInfo.ExpiresAt
                );
                createdSourceIds.push(sourceId);

                const displayName = pagesToAdd.length > 1 ? (page.name || bvPreview.title || '') : (bvSongName || page.name || bvPreview.title || '');

                newSongs.push(new SongClass({
                    id: '',
                    bvid: page.bvid || bvPreview.bvid || '',
                    name: displayName,
                    singer: bvSinger || page.singer || '',
                    singerId: '',
                    cover: page.cover || bvPreview.cover || '',
                    sourceId: sourceId,
                    lyric: '',
                    lyricOffset: 0,
                    skipStartTime: start,
                    skipEndTime: end,
                    pageNumber: page.pageNumber || 1,
                    pageTitle: page.pageTitle || '',
                    videoTitle: page.videoTitle || bvPreview.title || '',
                    totalPages: page.totalPages || pagesToAdd.length || 1,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }));
            }

            try {
                await Services.UpsertSongs(newSongs as any);
            } catch (err) {
                throw new Error(`保存歌曲失败: ${err instanceof Error ? err.message : String(err)}`);
            }

            let refreshed: Song[] = [];
            try {
                const data = await Services.ListSongs();
                refreshed = convertSongs(data);
            } catch (err) {
                throw new Error(`获取歌曲列表失败: ${err instanceof Error ? err.message : String(err)}`);
            }

            setSongs(refreshed);

            // 找到刚添加的歌曲（按 sourceId 和 skipStartTime 匹配）
            const sourceIdSet = new Set(createdSourceIds);
            const addedSongs = refreshed.filter((s) => sourceIdSet.has(s.sourceId) && s.skipStartTime === start);

            if (addedSongs.length > 0 && targetFavId) {
                const fav = favorites.find((f) => f.id === targetFavId);
                if (fav) {
                    const updatedFav = {
                        ...fav,
                        songIds: [...fav.songIds, ...addedSongs.map((s) => ({ id: 0, songId: s.id, favoriteId: fav.id }))],
                    };
                    try {
                        await Services.SaveFavorite(updatedFav as any);
                    } catch (err) {
                        throw new Error(`保存歌单失败: ${err instanceof Error ? err.message : String(err)}`);
                    }

                    let refreshedFavs: typeof favorites = [];
                    try {
                        const raw = await Services.ListFavorites();
                        refreshedFavs = convertFavorites(raw);
                    } catch (err) {
                        throw new Error(`获取歌单列表失败: ${err instanceof Error ? err.message : String(err)}`);
                    }

                    setFavorites(refreshedFavs);
                    setSelectedFavId(fav.id);
                }
            }

            const addedCount = newSongs.length;
            notifications.show({
                title: '添加成功',
                message: `${addedCount} 首歌曲已加入${targetFavId ? '' : '库'}${targetFavId ? '。' : ''}`,
                color: 'teal',
            });

            setBvModalOpen(false);
            setBvPreview(null);
            setBvSongName('');
            setBvSinger('');
            setSliceStart(0);
            setSliceEnd(0);
        } catch (err) {
            console.error('BV 添加失败:', err);
            notifications.show({
                title: '保存失败',
                message: err instanceof Error ? err.message : '未知错误',
                color: 'red',
            });
        }
    }, [bvPreview, bvTargetFavId, sliceStart, sliceEnd, bvSongName, bvSinger, favorites, songs, setSongs, setFavorites, setSelectedFavId, setBvModalOpen, setBvPreview, setBvSongName, setBvSinger, setSliceStart, setSliceEnd]);

    return {
        handleConfirmBVAdd,
    };
};
