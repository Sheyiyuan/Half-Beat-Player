import { useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import * as Services from '../../../wailsjs/go/services/Service';
import { Favorite, Song } from '../../types';
import { useFidImport } from './useFidImport';
import { useMyFavoriteImport } from './useMyFavoriteImport';

interface UseFavoriteActionsProps {
    favorites: Favorite[];
    setFavorites: (favorites: Favorite[]) => void;
    songs: Song[];
    setSongs: (songs: Song[]) => void;
    selectedFavId: string | null;
    setSelectedFavId: (id: string | null) => void;
    setStatus: (status: string) => void;
    isLoggedIn: boolean;
    themeColor: string;
    openModal: (name: string) => void;
    closeModal: (name: string) => void;
}

interface CreateFavoriteOptions {
    name: string;
    mode: 'blank' | 'duplicate' | 'importMine' | 'importFid';
    duplicateSourceId?: string | null;
    importFid?: string;
    selectedMyFavId?: number | null;
}

export const useFavoriteActions = ({
    favorites,
    setFavorites,
    songs,
    setSongs,
    selectedFavId,
    setSelectedFavId,
    setStatus,
    isLoggedIn,
    themeColor,
    openModal,
    closeModal,
}: UseFavoriteActionsProps) => {

    // 使用 fid 导入 Hook
    const { importFromFid } = useFidImport({
        themeColor,
        songs,
        onStatusChange: setStatus,
    });

    // 使用我的收藏夹导入 Hook
    const myFavoriteImport = useMyFavoriteImport({
        themeColor,
        songs,
        onStatusChange: setStatus,
    });

    const deleteFavorite = useCallback(async (id: string, setConfirmDeleteFavId: (id: string | null) => void) => {
        try {
            await Services.DeleteFavorite(id);
            
            // 删除歌单后清理未被引用的歌曲
            const deletedCount = await Services.DeleteUnreferencedSongs();
            console.log('[deleteFavorite] 清理了', deletedCount, '首未被引用的歌曲');
            
            // 刷新歌单和歌曲列表
            const refreshed = await Services.ListFavorites();
            setFavorites(refreshed);
            
            // 刷新歌曲列表（因为可能有歌曲被清理）
            const refreshedSongs = await Services.ListSongs();
            setSongs(refreshedSongs);
            
            if (selectedFavId === id) {
                setSelectedFavId(null);
            }
            setConfirmDeleteFavId(null);
            
            const message = deletedCount > 0 
                ? `已删除歌单，并清理了 ${deletedCount} 首未被引用的歌曲`
                : "已删除歌单";
            notifications.show({ 
                title: "删除成功", 
                message, 
                color: "green" 
            });
        } catch (error) {
            notifications.show({ title: "删除失败", message: String(error), color: "red" });
        }
    }, [favorites, setFavorites, selectedFavId, setSelectedFavId, setSongs]);

    const editFavorite = useCallback((fav: Favorite, setEditingFavId: (id: string | null) => void, setEditingFavName: (name: string) => void) => {
        setEditingFavId(fav.id);
        setEditingFavName(fav.title);
        openModal("editFavModal");
    }, [openModal]);

    const saveEditFavorite = useCallback(async (editingFavId: string | null, editingFavName: string) => {
        if (!editingFavId) return;
        const name = editingFavName.trim() || "未命名歌单";
        try {
            const target = favorites.find((f: Favorite) => f.id === editingFavId);
            if (!target) {
                notifications.show({ title: "未找到歌单", message: "", color: "red" });
                return;
            }
            const updated = { ...target, title: name };
            await Services.SaveFavorite(updated as any);
            const refreshed = await Services.ListFavorites();
            setFavorites(refreshed);
            closeModal("editFavModal");
            notifications.show({ title: "已保存", message: "", color: "green" });
        } catch (error) {
            notifications.show({ title: "保存失败", message: String(error), color: "red" });
        }
    }, [favorites, setFavorites, closeModal]);

    const createFavorite = useCallback(async (options: CreateFavoriteOptions) => {
        const { name: rawName, mode, duplicateSourceId, importFid, selectedMyFavId } = options;
        const name = (rawName || "").trim() || "新歌单";

        try {
            if (mode === "blank") {
                await Services.SaveFavorite({ id: "", title: name, songIds: [] } as any);
            } else if (mode === "duplicate") {
                if (!duplicateSourceId) {
                    notifications.show({ title: "请选择要复制的歌单", message: "", color: "orange" });
                    return;
                }
                const source = favorites.find((f: Favorite) => f.id === duplicateSourceId);
                if (!source) {
                    notifications.show({ title: "未找到源歌单", message: "", color: "red" });
                    return;
                }
                const cloned = {
                    id: "",
                    title: name,
                    songIds: source.songIds.map((ref: any) => ({ id: 0, songId: ref.songId, favoriteId: "" })),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                await Services.SaveFavorite(cloned as any);
            } else if (mode === "importMine" || mode === "importFid") {
                let fidToImport: string | null = null;

                // 处理导入我的收藏夹
                if (mode === "importMine") {
                    if (!isLoggedIn) {
                        notifications.show({ title: "需要登录", message: "", color: "blue" });
                        openModal("loginModal");
                        return;
                    }
                    if (!selectedMyFavId) {
                        notifications.show({ title: "请选择收藏夹", message: "", color: "orange" });
                        return;
                    }
                    fidToImport = String(selectedMyFavId);
                } else {
                    // 处理导入公开收藏夹
                    if (!importFid?.trim()) {
                        notifications.show({ title: "请输入 fid", message: "", color: "orange" });
                        return;
                    }
                    fidToImport = importFid.trim();
                }

                // 使用封装的 Hook 导入
                console.log('[createFavorite] 开始导入 fid:', fidToImport);
                const result = await importFromFid(fidToImport);
                if (!result) {
                    console.log('[createFavorite] 导入失败，中止创建歌单');
                    return; // 导入失败，Hook 内部已处理通知
                }

                const { newSongs, existingSongs, totalCount, collectionTitle } = result;
                console.log('[createFavorite] 导入成功:', {
                    newCount: newSongs.length,
                    existingCount: existingSongs.length,
                    totalCount,
                    collectionTitle
                });

                // 如果用户没有修改默认名字，使用收藏夹标题
                let finalName = name;
                if (collectionTitle && (name === "新歌单" || !name.trim())) {
                    finalName = collectionTitle;
                    console.log('[createFavorite] 使用收藏夹标题作为歌单名:', finalName);
                }

                // 保存新增歌曲到数据库
                if (newSongs.length > 0) {
                    console.log('[createFavorite] 保存新增歌曲到数据库...');
                    await Services.UpsertSongs(newSongs);
                }

                // 刷新歌曲列表
                console.log('[createFavorite] 刷新歌曲列表...');
                const refreshedSongs = await Services.ListSongs();
                setSongs(refreshedSongs);

                // 组装歌单 songIds（包含新增和已存在的）
                const allImportedSongs = [...newSongs, ...existingSongs];
                const allSongIds = allImportedSongs.map(song => {
                    const found = refreshedSongs.find((s: Song) => s.bvid === song.bvid);
                    return found ? found.id : song.id;
                });
                console.log('[createFavorite] 组装歌单 songIds，共', allSongIds.length, '首');

                // 创建新歌单
                const newFav = {
                    id: "",
                    title: finalName,
                    songIds: allSongIds.map((songId: string) => ({ id: 0, songId, favoriteId: "" })),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                console.log('[createFavorite] 保存新歌单:', newFav.title);
                await Services.SaveFavorite(newFav as any);

                // 刷新歌单列表并选中新建的歌单
                console.log('[createFavorite] 刷新歌单列表...');
                const refreshedFavs = await Services.ListFavorites();
                setFavorites(refreshedFavs);
                console.log('[createFavorite] 歌单列表刷新完成，共', refreshedFavs.length, '个歌单');

                const created = refreshedFavs.find((f: Favorite) => f.title === finalName) || refreshedFavs[refreshedFavs.length - 1];
                if (created) {
                    console.log('[createFavorite] 找到新创建的歌单:', created.id, created.title);
                    setSelectedFavId(created.id);
                } else {
                    console.warn('[createFavorite] 未找到新创建的歌单！');
                }

                closeModal("createFavModal");
                console.log('[createFavorite] 导入流程完成');
                return;
            }

            const refreshedFavs = await Services.ListFavorites();
            setFavorites(refreshedFavs);
            const created = refreshedFavs.find((f: Favorite) => f.title === name) || refreshedFavs[refreshedFavs.length - 1];
            if (created) {
                setSelectedFavId(created.id);
            }
            closeModal("createFavModal");
        } catch (error) {
            notifications.show({ title: "创建失败", message: String(error), color: "red" });
        }
    }, [favorites, setFavorites, songs, setSongs, setSelectedFavId, setStatus, isLoggedIn, themeColor, openModal, closeModal, importFromFid]);

    const addToFavorite = useCallback(async (favId: string, song: Song) => {
        const target = favorites.find((f: Favorite) => f.id === favId);
        if (!target) return;

        const alreadyExists = target.songIds.some((ref: any) => ref.songId === song.id);
        if (alreadyExists) {
            notifications.show({
                title: "已在歌单中",
                message: "",
                color: "blue",
            });
            return;
        }

        const updated = {
            ...target,
            songIds: [...target.songIds, { id: 0, songId: song.id, favoriteId: favId }],
        };

        try {
            await Services.SaveFavorite(updated as any);
            const refreshed = await Services.ListFavorites();
            setFavorites(refreshed);
            notifications.show({
                title: "已添加到歌单",
                message: "",
                color: "green",
            });
        } catch (error) {
            notifications.show({
                title: "添加失败",
                message: String(error),
                color: "red",
            });
        }
    }, [favorites, setFavorites]);

    return {
        deleteFavorite,
        editFavorite,
        saveEditFavorite,
        createFavorite,
        addToFavorite,
        
        // 导出我的收藏夹导入功能
        myFavoriteImport,
    };
};
