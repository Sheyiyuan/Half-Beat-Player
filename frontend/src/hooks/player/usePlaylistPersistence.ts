import { useEffect } from 'react';
import type { Song } from '../../types';
import * as Services from '../../../wailsjs/go/services/Service';

interface UsePlaylistPersistenceProps {
    queue: Song[];
    currentIndex: number;
}

/**
 * 播放列表自动保存 Hook
 * 当播放列表或当前索引变化时，自动保存到后端（带防抖）
 */
export const usePlaylistPersistence = ({
    queue,
    currentIndex,
}: UsePlaylistPersistenceProps) => {
    useEffect(() => {
        // 避免在初始化时立即保存
        if (queue.length === 0) return;

        const savePlaylist = async () => {
            try {
                const queueIds = queue.map((song) => song.id);
                const queueJSON = JSON.stringify(queueIds);
                await Services.SavePlaylist(queueJSON, currentIndex);
                console.log("播放列表已保存");
            } catch (err) {
                console.warn("保存播放列表失败", err);
            }
        };

        // 使用防抖避免频繁保存
        const timeoutId = setTimeout(savePlaylist, 1000);
        return () => clearTimeout(timeoutId);
    }, [queue, currentIndex]);
};
