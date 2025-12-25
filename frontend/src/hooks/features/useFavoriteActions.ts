import { useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import * as Services from '../../../wailsjs/go/services/Service';
import { Favorite, Song } from '../../types';

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
    
    const deleteFavorite = useCallback(async (id: string, setConfirmDeleteFavId: (id: string | null) => void) => {
        try {
            await Services.DeleteFavorite(id);
            const refreshed = await Services.ListFavorites();
            setFavorites(refreshed);
            if (selectedFavId === id) {
                setSelectedFavId(null);
            }
            setConfirmDeleteFavId(null);
            notifications.show({ title: "已删除歌单", message: "", color: "green" });
        } catch (error) {
            notifications.show({ title: "删除失败", message: String(error), color: "red" });
        }
    }, [favorites, setFavorites, selectedFavId, setSelectedFavId]);

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
                let collectionId: number | null = null;

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
                    collectionId = selectedMyFavId;
                } else {
                    if (!importFid?.trim()) {
                        notifications.show({ title: "请输入 fid", message: "", color: "orange" });
                        return;
                    }
                    const parsed = Number(importFid.trim());
                    if (!Number.isFinite(parsed) || parsed <= 0) {
                        notifications.show({ title: "fid 格式不正确", message: "", color: "red" });
                        return;
                    }
                    collectionId = parsed;
                }

                const toastId = notifications.show({
                    title: "正在导入...",
                    message: "",
                    color: themeColor,
                    loading: true,
                    autoClose: false,
                });

                try {
                    setStatus("正在导入收藏夹...");
                    const bvids = await Services.GetFavoriteCollectionBVIDs(collectionId!);

                    if (!bvids || bvids.length === 0) {
                        notifications.update({
                            id: toastId,
                            title: "收藏夹为空",
                            message: "",
                            color: "yellow",
                            loading: false,
                            autoClose: 2000,
                        });
                        return;
                    }

                    // 准备新增歌曲
                    const newSongs: Song[] = [];
                    for (const info of bvids) {
                        const existing = songs.find((s: Song) => s.bvid === info.bvid);
                        if (!existing) {
                            newSongs.push({
                                id: info.bvid,
                                bvid: info.bvid,
                                name: info.title || info.bvid,
                                singer: "",
                                singerId: "",
                                cover: info.cover,
                                streamUrl: "",
                                streamUrlExpiresAt: new Date().toISOString(),
                                lyric: "",
                                lyricOffset: 0,
                                skipStartTime: 0,
                                skipEndTime: 0,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                            } as any);
                        }
                    }

                    if (newSongs.length > 0) {
                        await Services.UpsertSongs(newSongs);
                    }

                    const refreshedSongs = await Services.ListSongs();
                    setSongs(refreshedSongs);

                    // 组装歌单 songIds
                    const allSongIds = bvids.map((info: any) => {
                        const found = refreshedSongs.find((s: Song) => s.bvid === info.bvid);
                        return found ? found.id : info.bvid;
                    });

                    const newFav = {
                        id: "",
                        title: name,
                        songIds: allSongIds.map((songId: string) => ({ id: 0, songId, favoriteId: "" })),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };

                    await Services.SaveFavorite(newFav as any);

                    const refreshedFavs = await Services.ListFavorites();
                    setFavorites(refreshedFavs);

                    const created = refreshedFavs.find((f: Favorite) => f.title === name) || refreshedFavs[refreshedFavs.length - 1];
                    if (created) {
                        setSelectedFavId(created.id);
                    }

                    notifications.update({
                        id: toastId,
                        title: `导入完成 (${bvids.length} 首)`,
                        message: "",
                        color: "green",
                        loading: false,
                        autoClose: 2000,
                    });
                    closeModal("createFavModal");
                } catch (e: any) {
                    console.error("[useFavoriteActions] 导入收藏夹失败:", e);
                    const errorMsg = e?.message || String(e);
                    const simpleMsg = errorMsg.length > 30 ? errorMsg.substring(0, 30) + "..." : errorMsg;
                    notifications.update({
                        id: toastId,
                        title: `导入失败: ${simpleMsg}`,
                        message: "",
                        color: "red",
                        loading: false,
                        autoClose: 4000,
                    });
                } finally {
                    setStatus("");
                }

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
    }, [favorites, setFavorites, songs, setSongs, setSelectedFavId, setStatus, isLoggedIn, themeColor, openModal, closeModal]);

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
    };
};
