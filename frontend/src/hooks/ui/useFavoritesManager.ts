/**
 * useFavoritesManager - 收藏夹管理状态聚合
 * 将 App.tsx 中分散的收藏夹相关状态集中管理
 */

import { useState, useCallback } from 'react';

interface UseFavoritesManagerState {
    // 创建收藏夹
    createFavName: string;
    createFavMode: 'blank' | 'duplicate' | 'importMine' | 'importFid';
    duplicateSourceId: string | null;
    importFid: string;
    confirmDeleteFavId: string | null;

    // 编辑收藏夹
    editingFavId: string | null;
    editingFavName: string;

    // 下载管理
    isDownloaded: boolean;
    confirmDeleteDownloaded: boolean;
    downloadedSongIds: Set<string>;
    managingSong: any | null;
    confirmRemoveSongId: string | null;
}

export const useFavoritesManager = () => {
    // ========== 创建收藏夹 ==========
    const [createFavName, setCreateFavName] = useState("新歌单");
    const [createFavMode, setCreateFavMode] = useState<'blank' | 'duplicate' | 'importMine' | 'importFid'>('blank');
    const [duplicateSourceId, setDuplicateSourceId] = useState<string | null>(null);
    const [importFid, setImportFid] = useState("");
    const [confirmDeleteFavId, setConfirmDeleteFavId] = useState<string | null>(null);

    // ========== 编辑收藏夹 ==========
    const [editingFavId, setEditingFavId] = useState<string | null>(null);
    const [editingFavName, setEditingFavName] = useState("");

    // ========== 下载管理 ==========
    const [isDownloaded, setIsDownloaded] = useState<boolean>(false);
    const [confirmDeleteDownloaded, setConfirmDeleteDownloaded] = useState<boolean>(false);
    const [downloadedSongIds, setDownloadedSongIds] = useState<Set<string>>(new Set());
    const [managingSong, setManagingSong] = useState<any | null>(null);
    const [confirmRemoveSongId, setConfirmRemoveSongId] = useState<string | null>(null);

    // 重置创建收藏夹状态
    const resetCreateFavState = useCallback(() => {
        setCreateFavName("新歌单");
        setCreateFavMode("blank");
        setDuplicateSourceId(null);
        setImportFid("");
    }, []);

    // 重置编辑收藏夹状态
    const resetEditFavState = useCallback(() => {
        setEditingFavId(null);
        setEditingFavName("");
    }, []);

    // 重置下载管理状态
    const resetDownloadState = useCallback(() => {
        setIsDownloaded(false);
        setConfirmDeleteDownloaded(false);
        setManagingSong(null);
        setConfirmRemoveSongId(null);
    }, []);

    return {
        // 创建收藏夹状态
        createFavName,
        setCreateFavName,
        createFavMode,
        setCreateFavMode,
        duplicateSourceId,
        setDuplicateSourceId,
        importFid,
        setImportFid,
        confirmDeleteFavId,
        setConfirmDeleteFavId,

        // 编辑收藏夹状态
        editingFavId,
        setEditingFavId,
        editingFavName,
        setEditingFavName,

        // 下载管理状态
        isDownloaded,
        setIsDownloaded,
        confirmDeleteDownloaded,
        setConfirmDeleteDownloaded,
        downloadedSongIds,
        setDownloadedSongIds,
        managingSong,
        setManagingSong,
        confirmRemoveSongId,
        setConfirmRemoveSongId,

        // 重置函数
        resetCreateFavState,
        resetEditFavState,
        resetDownloadState,
    };
};
