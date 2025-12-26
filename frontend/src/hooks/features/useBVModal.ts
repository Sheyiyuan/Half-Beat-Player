import { useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import * as Services from '../../../wailsjs/go/services/Service';
import { Song, Favorite } from '../../types';
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
            // 1. 创建流源
            const sourceId = await Services.CreateStreamSource(
                bvPreview.bvid,
                bvPreview.url,
                bvPreview.expiresAt
            );

            // 2. 创建新的独立歌曲实例（不使用 BVID 作为 ID）
            const newSong = new SongClass({
                id: '', // 每个实例都有独立的 ID
                bvid: bvPreview.bvid,
                name: bvSongName || bvPreview.title,
                singer: bvSinger,
                singerId: '',
                cover: bvPreview.cover || '',
                sourceId: sourceId,
                lyric: '',
                lyricOffset: 0,
                skipStartTime: start,
                skipEndTime: end,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            await Services.UpsertSongs([newSong as any]);
            const refreshed = await Services.ListSongs();
            setSongs(refreshed);

            // 找到刚添加的歌曲（按 sourceId 和 skipStartTime 匹配）
            const added = refreshed.find((s) => s.sourceId === sourceId && s.skipStartTime === start) || refreshed[refreshed.length - 1];

            if (added && targetFavId) {
                const fav = favorites.find((f) => f.id === targetFavId);
                if (fav) {
                    const updatedFav = {
                        ...fav,
                        songIds: [...fav.songIds, { id: 0, songId: added.id, favoriteId: fav.id }],
                    };
                    await Services.SaveFavorite(updatedFav as any);
                    const refreshedFavs = await Services.ListFavorites();
                    setFavorites(refreshedFavs);
                    setSelectedFavId(fav.id);
                }
            }

            notifications.show({
                title: '添加成功',
                message: `${bvSongName || bvPreview.title} 已加入${targetFavId ? '' : '库'}${targetFavId ? '。' : ''}`,
                color: 'teal',
            });

            setBvModalOpen(false);
            setBvPreview(null);
            setBvSongName('');
            setBvSinger('');
            setSliceStart(0);
            setSliceEnd(0);
        } catch (err) {
            notifications.show({
                title: '保存失败',
                message: err instanceof Error ? err.message : '未知错误',
                color: 'red',
            });
        }
    }, [bvPreview, bvTargetFavId, sliceStart, sliceEnd, bvSongName, bvSinger, favorites, setSongs, setFavorites, setSelectedFavId, setBvModalOpen, setBvPreview, setBvSongName, setBvSinger, setSliceStart, setSliceEnd]);

    return {
        handleConfirmBVAdd,
    };
};
