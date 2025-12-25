import { useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import * as Services from '../../../wailsjs/go/services/Service';
import { Song, Favorite } from '../../types';
import { SongClass } from '../../types';

interface UseBVModalProps {
    bvPreview: any | null;
    sliceStart: number;
    sliceEnd: number;
    isSlicePreviewing: boolean;
    bvSongName: string;
    bvSinger: string;
    bvTargetFavId: string | null;
    selectedFavId: string | null;
    favorites: Favorite[];
    songs: Song[];
    currentSong: Song | null;
    themeColor: string;
    sliceAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
    setBvModalOpen: (open: boolean) => void;
    setBvPreview: (preview: any) => void;
    setBvSongName: (name: string) => void;
    setBvSinger: (singer: string) => void;
    setSliceStart: (start: number) => void;
    setSliceEnd: (end: number) => void;
    setIsSlicePreviewing: (previewing: boolean) => void;
    setSlicePreviewPosition: (position: number) => void;
    setSongs: (songs: Song[]) => void;
    setFavorites: (favorites: Favorite[]) => void;
    setSelectedFavId: (id: string | null) => void;
}

export const useBVModal = ({
    bvPreview,
    sliceStart,
    sliceEnd,
    isSlicePreviewing,
    bvSongName,
    bvSinger,
    bvTargetFavId,
    selectedFavId,
    favorites,
    songs,
    currentSong,
    themeColor,
    sliceAudioRef,
    setBvModalOpen,
    setBvPreview,
    setBvSongName,
    setBvSinger,
    setSliceStart,
    setSliceEnd,
    setIsSlicePreviewing,
    setSlicePreviewPosition,
    setSongs,
    setFavorites,
    setSelectedFavId,
}: UseBVModalProps) => {

    const handleSlicePreviewPlay = useCallback(async () => {
        if (!sliceAudioRef.current || !bvPreview?.url) return;
        const audio = sliceAudioRef.current;
        const start = Math.max(0, sliceStart);
        const end = Math.max(start, sliceEnd || start);
        if (end <= start) {
            notifications.show({ title: '切片区间无效', message: '结束时间需大于开始时间', color: 'orange' });
            return;
        }
        if (isSlicePreviewing) {
            audio.pause();
            audio.currentTime = start;
            setIsSlicePreviewing(false);
            return;
        }
        audio.currentTime = start;
        setSlicePreviewPosition(start);
        try {
            await audio.play();
            setIsSlicePreviewing(true);
        } catch (error) {
            notifications.show({ title: '预览失败', message: String(error), color: 'red' });
            setIsSlicePreviewing(false);
        }
    }, [bvPreview, sliceStart, sliceEnd, isSlicePreviewing, sliceAudioRef, setIsSlicePreviewing, setSlicePreviewPosition]);

    const handleConfirmBVAdd = useCallback(async () => {
        if (!bvPreview) return;
        const targetFavId = bvTargetFavId || favorites[0]?.id || null;
        const start = Math.max(0, sliceStart);
        const songDuration = bvPreview.duration || 0;
        const end = sliceEnd > 0 ? Math.max(start, sliceEnd) : songDuration;

        try {
            const newSong = new SongClass({
                id: '',
                bvid: bvPreview.bvid,
                name: bvSongName || bvPreview.title,
                singer: bvSinger,
                singerId: '',
                cover: bvPreview.cover || '',
                streamUrl: bvPreview.url,
                streamUrlExpiresAt: bvPreview.expiresAt,
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

            const added = refreshed.find((s) => s.bvid === bvPreview.bvid && s.streamUrl === bvPreview.url) || refreshed[refreshed.length - 1];

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
            setIsSlicePreviewing(false);
        } catch (err) {
            notifications.show({
                title: '保存失败',
                message: err instanceof Error ? err.message : '未知错误',
                color: 'red',
            });
        }
    }, [bvPreview, bvTargetFavId, sliceStart, sliceEnd, bvSongName, bvSinger, favorites, setSongs, setFavorites, setSelectedFavId, setBvModalOpen, setBvPreview, setBvSongName, setBvSinger, setSliceStart, setSliceEnd, setIsSlicePreviewing]);

    return {
        handleSlicePreviewPlay,
        handleConfirmBVAdd,
    };
};
