import { useCallback } from "react";
import { notifications } from "@mantine/notifications";
import * as Services from "../../../wailsjs/go/services/Service";
import { Song, Favorite } from "../../types";

interface UseSearchAndBVProps {
    themeColor: string;
    selectedFavId: string | null;
    favorites: Favorite[];
    globalSearchTerm: string;
    setGlobalSearchTerm: (term: string) => void;
    setRemoteResults: (results: Song[]) => void;
    setRemoteLoading: (loading: boolean) => void;
    setBvPreview: (preview: any) => void;
    setBvSongName: (name: string) => void;
    setBvSinger: (singer: string) => void;
    setBvTargetFavId: (id: string | null) => void;
    setBvModalOpen: (open: boolean) => void;
    setResolvingBV: (resolving: boolean) => void;
    setIsLoggedIn: (logged: boolean) => void;
    playSingleSong: (song: Song) => void;
    playFavorite: (fav: Favorite) => void;
    setSelectedFavId: (id: string | null) => void;
    openModal: (name: string) => void;
    closeModal: (name: string) => void;
}

type GlobalSearchResult = { kind: "song"; song: Song } | { kind: "favorite"; favorite: Favorite };

export const useSearchAndBV = ({
    themeColor,
    selectedFavId,
    favorites,
    globalSearchTerm,
    setGlobalSearchTerm,
    setRemoteResults,
    setRemoteLoading,
    setBvPreview,
    setBvSongName,
    setBvSinger,
    setBvTargetFavId,
    setBvModalOpen,
    setResolvingBV,
    setIsLoggedIn,
    playSingleSong,
    playFavorite,
    setSelectedFavId,
    openModal,
    closeModal,
}: UseSearchAndBVProps) => {
    const searchResultClick = useCallback((result: GlobalSearchResult) => {
        if (result.kind === "song") {
            playSingleSong(result.song);
        } else {
            setSelectedFavId(result.favorite.id);
            playFavorite(result.favorite);
        }
        closeModal("globalSearchModal");
    }, [playSingleSong, playFavorite, setSelectedFavId, closeModal]);

    const remoteSearch = useCallback(async () => {
        const term = globalSearchTerm.trim();
        if (!term) return;

        setRemoteLoading(true);
        try {
            const bvPattern = /BV[0-9A-Za-z]{10}/;
            const isBVSearch = bvPattern.test(term) || term.includes("bilibili.com");

            if (isBVSearch) {
                // BV号搜索：调用 SearchBVID
                const extractedBV = term.match(bvPattern)?.[0] || term;
                try {
                    const list = await Services.SearchBVID(extractedBV);
                    setRemoteResults(list || []);
                } catch (err) {
                    console.warn("[remoteSearch] SearchBVID failed:", err);
                    // 静默失败，不显示错误提示，因为可能会在resolveBVAndAdd中再次尝试
                    setRemoteResults([]);
                }
            } else {
                // 关键字搜索：调用 SearchBiliVideos
                try {
                    const list = await Services.SearchBiliVideos(term, 1, 10);
                    setRemoteResults(list || []);
                } catch (err) {
                    console.warn("[remoteSearch] SearchBiliVideos failed:", err);
                    notifications.show({
                        title: "B站搜索失败",
                        message: err instanceof Error ? err.message : "未知错误",
                        color: "orange",
                    });
                    setRemoteResults([]);
                }
            }
        } catch (e) {
            console.error("[remoteSearch] Unexpected error:", e);
            notifications.show({
                title: "搜索异常",
                message: e instanceof Error ? e.message : "未知错误",
                color: "red",
            });
            setRemoteResults([]);
        } finally {
            setRemoteLoading(false);
        }
    }, [globalSearchTerm, setRemoteResults, setRemoteLoading]);

    const addFromRemote = useCallback(async (item: Song) => {
        const bvid = item.bvid || "";
        if (!bvid) {
            notifications.show({
                title: "添加失败",
                message: "该视频没有有效的 BV 号",
                color: "red",
            });
            return;
        }

        // 设置搜索词并触发解析
        setGlobalSearchTerm(bvid);

        // 延迟一下确保状态更新后再解析
        setTimeout(async () => {
            setResolvingBV(true);
            const toastId = notifications.show({
                title: "正在解析视频",
                message: "请稍候...",
                color: themeColor,
                loading: true,
                autoClose: false,
            });

            let sortedResults: Song[] = [];

            try {
                const loggedIn = await Services.IsLoggedIn();
                setIsLoggedIn(loggedIn);
                if (!loggedIn) {
                    notifications.update({
                        id: toastId,
                        title: "需要登录",
                        message: "请先通过扫码登录",
                        color: "blue",
                        loading: false,
                        autoClose: 3000,
                    });
                    openModal("loginModal");
                    setGlobalSearchTerm("");
                    return;
                }

                const searchResults = await Services.SearchBVID(bvid);
                sortedResults = [...searchResults].sort((a, b) => {
                    const aRemote = !a.id || a.id.trim() === "";
                    const bRemote = !b.id || b.id.trim() === "";
                    if (aRemote === bRemote) return 0;
                    return aRemote ? -1 : 1;
                });

                if (sortedResults.length === 0) {
                    try {
                        const audioProbe = await Services.ResolveBiliAudio(bvid);
                        sortedResults = [{
                            id: "",
                            bvid,
                            name: audioProbe.title || "未命名视频",
                            singer: (audioProbe as any).author || "",
                            singerId: "",
                            cover: audioProbe.cover || "",
                            sourceId: "",
                        } as Song];
                    } catch (e) {
                        // keep empty
                    }
                }

                let audioInfo: any = null;
                try {
                    audioInfo = await Services.ResolveBiliAudio(bvid);
                } catch (err) {
                    console.warn("[addFromRemote] ResolveBiliAudio failed, fallback to search result:", err);
                    if (sortedResults.length > 0) {
                        const first = sortedResults[0];
                        audioInfo = {
                            title: first.name,
                            cover: first.cover,
                            url: "",
                            expiresAt: "",
                            duration: 0,
                            author: first.singer,
                        };
                    }
                }

                setBvPreview({
                    bvid,
                    title: audioInfo?.title || "未命名视频",
                    cover: audioInfo?.cover || "",
                    url: audioInfo?.url || "",
                    expiresAt: (audioInfo?.expiresAt as any) || "",
                    duration: (audioInfo?.duration as any) || 0,
                });
                setBvSongName(audioInfo?.title || "未命名视频");
                setBvSinger(((audioInfo?.author as any) || "").replace(/\s+/g, " ").trim());
                setBvTargetFavId(selectedFavId || favorites[0]?.id || null);
                setBvModalOpen(true);

                notifications.update({
                    id: toastId,
                    title: "已解析",
                    message: "请选择歌单并编辑歌曲信息后确认",
                    color: "teal",
                    loading: false,
                    autoClose: 3000,
                });

                closeModal("globalSearchModal");
            } catch (err) {
                if (sortedResults.length > 0) {
                    setBvPreview({
                        bvid,
                        title: sortedResults[0]?.name || "未命名视频",
                        cover: sortedResults[0]?.cover || "",
                        url: "",
                        expiresAt: "",
                        duration: 0,
                    });
                    setBvSongName(sortedResults[0]?.name || "未命名视频");
                    setBvSinger((sortedResults[0]?.singer || "").replace(/\s+/g, " ").trim());
                    setBvTargetFavId(selectedFavId || favorites[0]?.id || null);
                    setBvModalOpen(true);
                }

                notifications.update({
                    id: toastId,
                    title: "解析失败",
                    message: err instanceof Error ? err.message : "未知错误",
                    color: "red",
                    loading: false,
                    autoClose: 4000,
                });
            } finally {
                setResolvingBV(false);
            }
        }, 100);
    }, [themeColor, selectedFavId, favorites, setGlobalSearchTerm, setBvPreview, setBvSongName, setBvSinger, setBvTargetFavId, setBvModalOpen, setResolvingBV, setIsLoggedIn, openModal, closeModal]);

    const resolveBVAndAdd = useCallback(async () => {
        const term = globalSearchTerm.trim();
        if (!term) return;

        const bvPattern = /BV[0-9A-Za-z]{10}/;
        if (!bvPattern.test(term) && !term.includes("bilibili.com")) {
            notifications.show({
                title: "输入格式错误",
                message: "请输入有效的 BV 号或 B站链接",
                color: "orange",
            });
            return;
        }

        setResolvingBV(true);
        const toastId = notifications.show({
            title: "正在解析视频",
            message: "请稍候...",
            color: themeColor,
            loading: true,
            autoClose: false,
        });

        let bvid = "";
        let sortedResults: Song[] = [];
        let audioInfo: any = null;

        try {
            const loggedIn = await Services.IsLoggedIn();
            setIsLoggedIn(loggedIn);
            if (!loggedIn) {
                notifications.update({
                    id: toastId,
                    title: "需要登录",
                    message: "请先通过扫码登录",
                    color: "blue",
                    loading: false,
                    autoClose: 3000,
                });
                openModal("loginModal");
                setGlobalSearchTerm("");
                return;
            }

            bvid = term.match(bvPattern)?.[0] || "";

            // 尝试获取搜索结果
            try {
                const searchResults = await Services.SearchBVID(bvid);
                sortedResults = [...searchResults].sort((a, b) => {
                    const aRemote = !a.id || a.id.trim() === "";
                    const bRemote = !b.id || b.id.trim() === "";
                    if (aRemote === bRemote) return 0;
                    return aRemote ? -1 : 1;
                });
            } catch (e) {
                console.warn("[resolveBVAndAdd] SearchBVID failed:", e);
                sortedResults = [];
            }

            // 尝试获取音频信息
            try {
                audioInfo = await Services.ResolveBiliAudio(term);
            } catch (err) {
                console.warn("[resolveBVAndAdd] ResolveBiliAudio failed:", err);
                // 如果没有得到结果，至少尝试用SearchBVID的结果
                if (sortedResults.length > 0) {
                    const first = sortedResults[0];
                    audioInfo = {
                        title: first.name,
                        cover: first.cover,
                        url: "",
                        expiresAt: "",
                        duration: 0,
                        author: first.singer,
                    };
                }
            }

            // 如果仍然没有任何结果，创建一个占位符
            if (!audioInfo && sortedResults.length === 0) {
                audioInfo = {
                    title: "未命名视频",
                    cover: "",
                    url: "",
                    expiresAt: "",
                    duration: 0,
                    author: "",
                };
            }
            setBvPreview({
                bvid,
                title: audioInfo?.title || "未命名视频",
                cover: audioInfo?.cover || "",
                url: audioInfo?.url || "",
                expiresAt: (audioInfo?.expiresAt as any) || "",
                duration: (audioInfo?.duration as any) || 0,
            });
            setBvSongName(audioInfo?.title || "未命名视频");
            setBvSinger(((audioInfo?.author as any) || "").replace(/\s+/g, " ").trim());
            setBvTargetFavId(selectedFavId || favorites[0]?.id || null);
            setBvModalOpen(true);

            notifications.update({
                id: toastId,
                title: "已解析",
                message: "请选择歌单并编辑歌曲信息后确认",
                color: "teal",
                loading: false,
                autoClose: 3000,
            });

            closeModal("globalSearchModal");
        } catch (err) {
            console.error("[resolveBVAndAdd] Unexpected error:", err);
            // 即使出错也尝试显示已有的数据
            if (sortedResults.length > 0 || audioInfo) {
                setBvPreview({
                    bvid,
                    title: audioInfo?.title || sortedResults[0]?.name || "未命名视频",
                    cover: audioInfo?.cover || sortedResults[0]?.cover || "",
                    url: audioInfo?.url || "",
                    expiresAt: (audioInfo?.expiresAt as any) || "",
                    duration: (audioInfo?.duration as any) || 0,
                });
                setBvSongName(audioInfo?.title || sortedResults[0]?.name || "未命名视频");
                setBvSinger(((audioInfo?.author as any) || sortedResults[0]?.singer || "").replace(/\s+/g, " ").trim());
                setBvTargetFavId(selectedFavId || favorites[0]?.id || null);
                setBvModalOpen(true);

                notifications.update({
                    id: toastId,
                    title: "部分解析成功",
                    message: "已获取基本信息，请编辑后确认",
                    color: "yellow",
                    loading: false,
                    autoClose: 3000,
                });
            } else {
                notifications.update({
                    id: toastId,
                    title: "解析失败",
                    message: err instanceof Error ? err.message : "未知错误",
                    color: "red",
                    loading: false,
                    autoClose: 4000,
                });
            }
        } finally {
            setResolvingBV(false);
        }
    }, [globalSearchTerm, themeColor, selectedFavId, favorites, setGlobalSearchTerm, setBvPreview, setBvSongName, setBvSinger, setBvTargetFavId, setBvModalOpen, setResolvingBV, setIsLoggedIn, openModal, closeModal]);

    return {
        searchResultClick,
        remoteSearch,
        addFromRemote,
        resolveBVAndAdd,
    };
};
