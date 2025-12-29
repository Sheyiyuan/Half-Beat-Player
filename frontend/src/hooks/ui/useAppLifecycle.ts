import { useEffect } from "react";
import type { MutableRefObject } from "react";
import * as Services from "../../../wailsjs/go/services/Service";
import { DEFAULT_THEMES } from "../../utils/constants";
import type { Theme, Favorite, Song } from "../../types";
import { convertSongs, convertFavorites } from "../../types";
import type { ModalStates } from './useModalManager';

interface UseAppLifecycleParams {
    userInfo: any;
    setUserInfo: (u: any) => void;
    setIsLoggedIn: (v: boolean) => void;
    saveCachedCustomThemes: (themes: Theme[]) => void;
    setSetting: (s: any) => void;
    setVolume: (v: number) => void;
    setPlayMode: (v: any) => void;
    setThemes: (t: Theme[]) => void;
    setCurrentThemeId: (id: string) => void;
    setThemeColor: (v: string) => void;
    setBackgroundColor: (v: string) => void;
    setBackgroundOpacity: (v: number) => void;
    setBackgroundImageUrlSafe: (v: string) => void;
    setPanelColor: (v: string) => void;
    setPanelOpacity: (v: number) => void;
    settingsLoadedRef: MutableRefObject<boolean>;
    modalsSettingsModal: boolean;
    setCacheSize: (v: number) => void;
    openModal: (name: keyof ModalStates) => void;
    setStatus: (v: string) => void;
    setSongs: (list: Song[]) => void;
    setFavorites: (list: Favorite[]) => void;
    setQueue: (list: Song[]) => void;
    setCurrentIndex: (idx: number) => void;
    setCurrentSong: (song: Song | null) => void;
    setSelectedFavId: (id: string | null) => void;
    setting: any;
    skipPersistRef: MutableRefObject<boolean>;
}

export const useAppLifecycle = ({
    userInfo,
    setUserInfo,
    setIsLoggedIn,
    saveCachedCustomThemes,
    setSetting,
    setVolume,
    setPlayMode,
    setThemes,
    setCurrentThemeId,
    setThemeColor,
    setBackgroundColor,
    setBackgroundOpacity,
    setBackgroundImageUrlSafe,
    setPanelColor,
    setPanelOpacity,
    settingsLoadedRef,
    modalsSettingsModal,
    setCacheSize,
    openModal,
    setStatus,
    setSongs,
    setFavorites,
    setQueue,
    setCurrentIndex,
    setCurrentSong,
    setSelectedFavId,
    setting,
    skipPersistRef,
}: UseAppLifecycleParams) => {
    // 初始设置和主题加载
    useEffect(() => {
        // 跳过初始化期间的持久化，等待设置加载完成
        skipPersistRef.current = true;

        if (!window.go?.services?.Service?.GetPlayerSetting) {
            console.warn("Wails runtime not ready, skipping settings load");
            settingsLoadedRef.current = true;
            return;
        }

        try {
            const cachedUserInfo = localStorage.getItem("half-beat.userInfo");
            if (cachedUserInfo) {
                setUserInfo(JSON.parse(cachedUserInfo));
            }
        } catch (e) {
            console.warn("恢复用户信息失败:", e);
        }

        Services.IsLoggedIn()
            .then((loggedIn) => {
                setIsLoggedIn(loggedIn);
                if (loggedIn && !userInfo) {
                    Services.GetUserInfo()
                        .then((info) => {
                            setUserInfo(info);
                            localStorage.setItem("half-beat.userInfo", JSON.stringify(info));
                        })
                        .catch((err) => console.warn("自动获取用户信息失败:", err));
                }
            })
            .catch((err) => {
                setIsLoggedIn(false);
                console.warn("检查登录状态失败:", err);
            });

        const themesPromise = Services.GetThemes();

        Promise.all([Services.GetPlayerSetting(), themesPromise])
            .then(([s, customThemesList]) => {
                const customThemes = customThemesList || [];
                saveCachedCustomThemes(customThemes);
                setSetting(s as any);
                setVolume(s.config?.defaultVolume ?? 0.5);

                // 验证并设置播放模式，移除旧的 "order" 模式
                const validModes = ['loop', 'random', 'single'];
                const savedMode = s.config?.playMode as string;
                const mode = validModes.includes(savedMode) ? savedMode : 'loop';
                setPlayMode(mode as any);

                const allThemes = [...DEFAULT_THEMES, ...customThemes];
                setThemes(allThemes);

                // 优先从后端配置获取当前主题 ID，如果没有则尝试从 localStorage 获取
                const preferredThemeId = s.config?.currentThemeId || localStorage.getItem('half-beat.currentThemeId') || "light";
                const targetTheme = allThemes.find((t: Theme) => t.id === preferredThemeId) || allThemes[0] || DEFAULT_THEMES[0];

                // 如果后端记录的主题不存在（例如旧的自定义主题被删除），回退到默认主题并更新后端设置
                if (targetTheme.id !== preferredThemeId) {
                    Services.SetCurrentTheme(targetTheme.id).catch((err) => console.warn("SetCurrentTheme fallback failed", err));
                }

                // 只设置当前主题 ID，ThemeContext 中的 Effect 会自动应用主题的所有字段
                setCurrentThemeId(targetTheme.id);

                // 设置加载完成，允许后续持久化
                skipPersistRef.current = false;
                settingsLoadedRef.current = true;
            })
            .catch((e) => {
                console.warn("加载设置失败", e);
                skipPersistRef.current = false;
                settingsLoadedRef.current = true;
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 设置弹窗打开时刷新缓存大小
    useEffect(() => {
        if (modalsSettingsModal) {
            (async () => {
                try {
                    const size = await Services.GetAudioCacheSize();
                    setCacheSize(size);
                } catch (e) {
                    console.warn("获取缓存大小失败", e);
                }
            })();
        }
    }, [modalsSettingsModal, setCacheSize]);

    // 初始化数据、登录、Seed、播放列表/历史恢复
    useEffect(() => {
        (async () => {
            try {
                setStatus("正在加载...");

                const loggedIn = await Services.IsLoggedIn();
                setIsLoggedIn(loggedIn);
                // 仅记录登陆状态，不自动弹出登陆模态框
                // 需要登陆时由具体功能模块在操作时主动弹出
                if (loggedIn) {
                    try {
                        const info = await Services.GetUserInfo();
                        setUserInfo(info);
                        localStorage.setItem("half-beat.userInfo", JSON.stringify(info));
                    } catch (e) {
                        console.warn("获取用户信息失败:", e);
                    }
                }

                try {
                    await Services.Seed();
                } catch (seedErr) {
                    console.warn("Seed 失败", seedErr);
                }

                const [songList, favList] = await Promise.all([
                    Services.ListSongs(),
                    Services.ListFavorites(),
                ]);

                const songsWithCache = convertSongs(songList).map((song) => {
                    try {
                        const cacheKey = `half-beat.song.${song.id}`;
                        const cached = localStorage.getItem(cacheKey);
                        if (cached) {
                            const cacheData = JSON.parse(cached);
                            return {
                                ...song,
                                skipStartTime: cacheData.skipStartTime ?? song.skipStartTime,
                                skipEndTime: cacheData.skipEndTime ?? song.skipEndTime,
                            };
                        }
                    } catch (err) {
                        console.warn(`恢复歌曲 ${song.id} 缓存失败:`, err);
                    }
                    return song;
                });

                setSongs(convertSongs(songsWithCache));
                setFavorites(convertFavorites(favList));

                try {
                    const savedPlaylist = await Services.GetPlaylist();
                    if (savedPlaylist && savedPlaylist.queue) {
                        const queueIds = JSON.parse(savedPlaylist.queue || "[]");
                        if (queueIds.length > 0) {
                            const restoredQueue = queueIds
                                .map((id: string) => songsWithCache.find((s) => s.id === id))
                                .filter(Boolean) as Song[];

                            if (restoredQueue.length > 0) {
                                setQueue(restoredQueue);
                                const validIndex = Math.min(savedPlaylist.currentIndex || 0, restoredQueue.length - 1);
                                setCurrentIndex(validIndex);
                                setCurrentSong(restoredQueue[validIndex]);
                                setStatus("播放列表已恢复");
                                return;
                            }
                        }
                    }
                } catch (playlistErr) {
                    console.warn("恢复播放列表失败", playlistErr);
                }

                try {
                    const history = await Services.GetPlayHistory();
                    if (history && history.songId) {
                        const lastSong = songsWithCache.find((s) => s.id === history.songId);
                        if (lastSong) {
                            if (history.favoriteId) {
                                const favIdx = favList.findIndex((f) => f.id === history.favoriteId);
                                if (favIdx >= 0) {
                                    setSelectedFavId(history.favoriteId);
                                }
                            }
                            const songIdx = songsWithCache.findIndex((s) => s.id === history.songId);
                            if (songIdx >= 0) {
                                setQueue(songsWithCache);
                                setCurrentIndex(songIdx);
                                setCurrentSong(lastSong);
                                return;
                            }
                        }
                    }
                } catch (historyErr) {
                    console.warn("恢复播放历史失败", historyErr);
                }

                if (songsWithCache.length) {
                    setQueue(songsWithCache);
                    setCurrentIndex(0);
                    setCurrentSong(songsWithCache[0]);
                }
                setStatus(songsWithCache.length ? "就绪" : "请添加歌曲");
            } catch (e: any) {
                console.error(e);
                setStatus(`错误: ${e?.message ?? String(e)}`);
            }
        })();
    }, [setting, openModal, setIsLoggedIn, setUserInfo, setSongs, setFavorites, setSetting, setVolume, setQueue, setCurrentIndex, setCurrentSong, setSelectedFavId, setStatus]);
};
