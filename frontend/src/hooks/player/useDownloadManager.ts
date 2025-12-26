import { useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import * as Services from '../../../wailsjs/go/services/Service';
import { Song, Favorite } from '../../types';

interface UseDownloadManagerProps {
    currentSong: Song | null;
    currentFavSongs: Song[];
    downloadedSongIds: Set<string>;
    managingSong: Song | null;
    setStatus: (status: string) => void;
    setDownloadedSongIds: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
    setManagingSong: (song: Song | null) => void;
    setConfirmDeleteDownloaded: (confirm: boolean) => void;
    openModal: (name: string) => void;
    closeModal: (name: string) => void;
}

export const useDownloadManager = ({
    currentSong,
    currentFavSongs,
    downloadedSongIds,
    managingSong,
    setStatus,
    setDownloadedSongIds,
    setManagingSong,
    setConfirmDeleteDownloaded,
    openModal,
    closeModal,
}: UseDownloadManagerProps) => {

    const handleDownload = useCallback(async () => {
        if (!currentSong) {
            notifications.show({ title: '无法操作', message: '未选择歌曲', color: 'red' });
            return;
        }
        const isAlreadyDownloaded = downloadedSongIds.has(currentSong.id);
        if (isAlreadyDownloaded) {
            // 已下载，打开管理模态框
            setManagingSong(currentSong);
            setConfirmDeleteDownloaded(false);
            openModal("downloadModal");
        } else {
            // 未下载，执行下载
            await handleDownloadSong(currentSong);
        }
    }, [currentSong, downloadedSongIds]);

    const handleDownloadCurrentSong = useCallback(async () => {
        if (!currentSong) {
            notifications.show({ title: '无法操作', message: '未选择歌曲', color: 'red' });
            return;
        }
        await handleDownloadSong(currentSong);
    }, [currentSong]);

    const handleManageDownload = useCallback(() => {
        if (!currentSong) {
            notifications.show({ title: '无法操作', message: '未选择歌曲', color: 'red' });
            return;
        }
        setManagingSong(currentSong);
        setConfirmDeleteDownloaded(false);
        openModal("downloadModal");
    }, [currentSong, setManagingSong, setConfirmDeleteDownloaded, openModal]);

    const handleDownloadSong = useCallback(async (song: Song) => {
        if (!song) {
            notifications.show({ title: '无法操作', message: '未选择歌曲', color: 'red' });
            return;
        }
        const isAlreadyDownloaded = downloadedSongIds.has(song.id);
        if (isAlreadyDownloaded) {
            setManagingSong(song);
            setConfirmDeleteDownloaded(false);
            openModal("downloadModal");
            return;
        }
        try {
            setStatus(`正在下载: ${song.name}`);
            const savedPath = await Services.DownloadSong(song.id);
            notifications.show({ title: '下载完成', message: `已保存到: ${savedPath}`, color: 'green' });
            setStatus('下载完成');
            setDownloadedSongIds(prev => new Set([...prev, song.id]));
        } catch (e: any) {
            const msg = e?.message ?? String(e);
            notifications.show({ title: '下载失败', message: msg, color: 'red' });
            setStatus(`下载失败: ${msg}`);
        }
    }, [downloadedSongIds, setStatus, setDownloadedSongIds, setManagingSong, setConfirmDeleteDownloaded, openModal]);

    const handleDownloadAllFavorite = useCallback(async (fav: Favorite) => {
        if (!fav || fav.songIds.length === 0) {
            notifications.show({ title: '无法操作', message: '歌单为空', color: 'red' });
            return;
        }
        const songsToDownload = currentFavSongs.filter(s => !downloadedSongIds.has(s.id));
        if (songsToDownload.length === 0) {
            notifications.show({ title: '提示', message: '所有歌曲都已下载', color: 'blue' });
            return;
        }
        setStatus(`开始批量下载 ${songsToDownload.length} 首歌曲...`);
        let successCount = 0;
        let failCount = 0;
        for (const song of songsToDownload) {
            try {
                setStatus(`正在下载: ${song.name} (${successCount + failCount + 1}/${songsToDownload.length})`);
                await Services.DownloadSong(song.id);
                setDownloadedSongIds(prev => new Set([...prev, song.id]));
                successCount++;
            } catch (e: any) {
                failCount++;
                console.error(`下载失败: ${song.name}`, e);
            }
        }
        setStatus(`下载完成: 成功 ${successCount} 首，失败 ${failCount} 首`);
        notifications.show({
            title: '批量下载完成',
            message: `成功 ${successCount} 首，失败 ${failCount} 首`,
            color: failCount === 0 ? 'green' : 'yellow',
        });
    }, [currentFavSongs, downloadedSongIds, setStatus, setDownloadedSongIds]);

    const handleOpenDownloadedFile = useCallback(async () => {
        if (!managingSong) return;
        try {
            await Services.OpenDownloadedFile(managingSong.id);
        } catch (e: any) {
            notifications.show({ title: '打开失败', message: e?.message ?? String(e), color: 'red' });
        }
    }, [managingSong]);

    const handleDeleteDownloadedFile = useCallback(async () => {
        if (!managingSong) return;
        try {
            await Services.DeleteDownloadedSong(managingSong.id);
            setDownloadedSongIds(prev => {
                const next = new Set(prev);
                next.delete(managingSong.id);
                return next;
            });
            closeModal("downloadModal");
            setConfirmDeleteDownloaded(false);
            setManagingSong(null);
            notifications.show({ title: '已删除下载文件', message: '成功', color: 'green' });
        } catch (e: any) {
            notifications.show({ title: '删除失败', message: e?.message ?? String(e), color: 'red' });
        }
    }, [managingSong, setDownloadedSongIds, closeModal, setConfirmDeleteDownloaded, setManagingSong]);

    return {
        handleDownload,
        handleDownloadCurrentSong,
        handleManageDownload,
        handleDownloadSong,
        handleDownloadAllFavorite,
        handleOpenDownloadedFile,
        handleDeleteDownloadedFile,
    };
};
