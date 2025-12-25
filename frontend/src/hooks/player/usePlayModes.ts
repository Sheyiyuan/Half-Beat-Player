import { useCallback } from 'react';
import type { Song, Favorite } from '../../types';

interface UsePlayModesProps {
    songs: Song[];
    queue: Song[];
    currentIndex: number;
    setQueue: (queue: Song[]) => void;
    setCurrentIndex: (index: number) => void;
    setCurrentSong: (song: Song | null) => void;
    setIsPlaying: (playing: boolean) => void;
    playSong: (song: Song, list?: Song[]) => Promise<void>;
}

/**
 * 不同播放模式的 Hook
 * playSingleSong - 播放单曲（智能插入队列）
 * playFavorite - 播放整个歌单
 */
export const usePlayModes = ({
    songs,
    queue,
    currentIndex,
    setQueue,
    setCurrentIndex,
    setCurrentSong,
    setIsPlaying,
    playSong,
}: UsePlayModesProps) => {
    /**
     * 播放单曲
     * 如果播放列表为空，添加歌曲所在歌单；否则插入到当前播放歌曲的下一首
     */
    const playSingleSong = useCallback(async (song: Song, songFavorite?: Favorite) => {
        // 如果当前播放列表为空
        if (queue.length === 0) {
            // 添加歌曲所在歌单到播放列表
            let songList: Song[] = [];
            if (songFavorite) {
                const idSet = new Set(songFavorite.songIds.map((s) => s.songId));
                songList = songs.filter((s) => idSet.has(s.id));
            }
            // 如果没有歌单或歌单为空，只播放单曲
            if (songList.length === 0) {
                songList = [song];
            }
            setQueue(songList);
            const idx = songList.findIndex((s) => s.id === song.id);
            setCurrentIndex(idx >= 0 ? idx : 0);
            await playSong(song, songList);
        } else {
            // 播放列表不为空，插入到当前播放歌曲的下一首
            const newQueue = [...queue];
            const insertIdx = currentIndex + 1;
            // 检查歌曲是否已在列表中，避免重复
            const existIdx = newQueue.findIndex((s) => s.id === song.id);
            if (existIdx >= 0 && existIdx !== insertIdx) {
                // 歌曲已在列表中但不在插入位置，移除后重新插入
                newQueue.splice(existIdx, 1);
                newQueue.splice(insertIdx, 0, song);
            } else if (existIdx < 0) {
                // 歌曲不在列表中，直接插入
                newQueue.splice(insertIdx, 0, song);
            }
            setQueue(newQueue);
            setCurrentIndex(insertIdx);
            setCurrentSong(song);
            setIsPlaying(true);
            await playSong(song, newQueue);
        }
    }, [songs, queue, currentIndex, setQueue, setCurrentIndex, setCurrentSong, setIsPlaying, playSong]);

    /**
     * 播放歌单
     * 替换整个播放列表为歌单内容
     */
    const playFavorite = useCallback((fav: Favorite) => {
        const idSet = new Set(fav.songIds.map((s) => s.songId));
        const list = songs.filter((s) => idSet.has(s.id));
        if (list.length === 0) return;
        // 播放歌单时，替换整个播放列表
        setQueue(list);
        setCurrentIndex(0);
        playSong(list[0], list);
    }, [songs, setQueue, setCurrentIndex, playSong]);

    return {
        playSingleSong,
        playFavorite,
    };
};
