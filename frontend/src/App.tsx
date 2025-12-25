import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Palette, Search, Settings as SettingsIcon } from "lucide-react";
import { ActionIcon, AspectRatio, Badge, Box, Button, Flex, Group, Image, Modal, NumberInput, Paper, RangeSlider, ScrollArea, Select, Slider, Stack, Text, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import * as Services from "../wailsjs/go/services/Service";
import { Favorite, LyricMapping, PlayerSetting, Song, Theme, SongClass } from "./types";
import ThemeManagerModal from "./components/ThemeManagerModal";
import ThemeEditorModal from "./components/ThemeEditorModal";
import SongDetailCard from "./components/SongDetailCard";
import CurrentPlaylistCard from "./components/CurrentPlaylistCard";
import FavoriteListCard from "./components/FavoriteListCard";
import PlayerBar from "./components/PlayerBar";
import AddToFavoriteModal from "./components/AddToFavoriteModal";
import PlaylistModal from "./components/PlaylistModal";
import LoginModal from "./components/LoginModal";
import { TopBar } from "./components/TopBar";
import MainLayout from "./components/MainLayout";
import ControlsPanel from "./components/ControlsPanel";

// Hooks
import { useAudioPlayer, usePlaylist, useAudioInterval } from "./hooks/player";
import { useSongs, useFavorites, useSongCache } from "./hooks/data";
import { useAuth, useBVResolver, useFavoriteActions } from "./hooks/features";
import { useHitokoto } from "./hooks/ui";
// Contexts
import { useThemeContext, useModalContext } from "./context";

// Utils
import { formatTime, formatTimeLabel, parseTimeLabel } from "./utils/time";
import { APP_VERSION, PLACEHOLDER_COVER, DEFAULT_THEMES } from "./utils/constants";

// Declare window.go for Wails runtime
declare global {
    interface Window {
        go?: any;
    }
}

const App: React.FC = () => {
    // ========== Hooks ==========
    // 播放器相关
    const playlist = usePlaylist();
    const { queue, currentIndex, currentSong, playMode, setQueue, setCurrentIndex, setCurrentSong, setPlayMode } = playlist;

    const audioPlayer = useAudioPlayer(currentSong);
    const { audioRef, state: audioState, actions: audioActions, setIsPlaying, setProgress, setDuration } = audioPlayer;
    const { isPlaying, progress, duration, volume } = audioState;
    const { play, pause, seek, setVolume } = audioActions;

    const interval = useAudioInterval(currentSong, duration, progress);
    const { intervalRef, intervalStart, intervalEnd, intervalLength, progressInInterval } = interval;

    // 数据管理
    const songsHook = useSongs();
    const { songs, setSongs, loadSongs, refreshSongs } = songsHook;

    const favoritesHook = useFavorites();
    const { favorites, setFavorites, loadFavorites, refreshFavorites } = favoritesHook;

    const songCache = useSongCache();
    const { updateSongWithCache } = songCache;

    // 功能模块
    const { state: themeState, actions: themeActions } = useThemeContext();
    const {
        themes, currentThemeId, themeColor, backgroundColor, backgroundOpacity,
        backgroundImageUrl, panelColor, panelOpacity, computedColorScheme,
    } = themeState;
    const {
        setThemes, setCurrentThemeId, setThemeColor, setBackgroundColor,
        setBackgroundOpacity, setBackgroundImageUrl, setPanelColor, setPanelOpacity,
        applyTheme, setBackgroundImageUrlSafe,
    } = themeActions;

    const auth = useAuth();
    const { isLoggedIn, userInfo, loginModalOpened, setIsLoggedIn, setUserInfo, setLoginModalOpened, checkLoginStatus, getUserInfo } = auth;

    const bvResolver = useBVResolver();
    const {
        bvPreview, bvModalOpen, bvSongName, bvSinger, bvTargetFavId, resolvingBV,
        sliceStart, sliceEnd, isSlicePreviewing, slicePreviewPosition,
        setBvPreview, setBvModalOpen, setBvSongName, setBvSinger, setBvTargetFavId,
        setSliceStart, setSliceEnd, setIsSlicePreviewing, setSlicePreviewPosition,
        resolveBV, resetBVState
    } = bvResolver;

    const hitokoto = useHitokoto();

    // ========== Refs ==========
    const playingRef = useRef<string | null>(null);
    const playbackRetryRef = useRef<Map<string, number>>(new Map());
    const prevSongIdRef = useRef<string | null>(null);
    const sliceAudioRef = useRef<HTMLAudioElement | null>(null);
    const settingsLoadedRef = useRef(false);
    const skipPersistRef = useRef(false);
    const fileDraftInputRef = useRef<HTMLInputElement | null>(null);

    // ========== 模态框管理 ==========
    const { modals, openModal, closeModal } = useModalContext();

    // ========== 核心应用状态 ==========
    const [setting, setSetting] = useState<PlayerSetting | null>(null);
    const [lyric, setLyric] = useState<LyricMapping | null>(null);
    const [status, setStatus] = useState<string>("加载中...");
    
    // 搜索相关
    const [searchQuery, setSearchQuery] = useState("");
    const [globalSearchTerm, setGlobalSearchTerm] = useState("");
    const [selectedFavId, setSelectedFavId] = useState<string | null>(null);
    const [remoteResults, setRemoteResults] = useState<Song[]>([]);
    const [remoteLoading, setRemoteLoading] = useState(false);
    
    // 设置相关
    const [cacheSize, setCacheSize] = useState(0);

    // ========== 收藏夹管理状态 ==========
    // 创建收藏夹
    const [createFavName, setCreateFavName] = useState("新歌单");
    const [createFavMode, setCreateFavMode] = useState<"blank" | "duplicate" | "importMine" | "importFid">("blank");
    const [duplicateSourceId, setDuplicateSourceId] = useState<string | null>(null);
    const [importFid, setImportFid] = useState("");
    const [confirmDeleteFavId, setConfirmDeleteFavId] = useState<string | null>(null);

    // 编辑收藏夹
    const [editingFavId, setEditingFavId] = useState<string | null>(null);
    const [editingFavName, setEditingFavName] = useState("");

    // ========== 下载管理状态 ==========
    const [isDownloaded, setIsDownloaded] = useState<boolean>(false);
    const [confirmDeleteDownloaded, setConfirmDeleteDownloaded] = useState<boolean>(false);
    const [downloadedSongIds, setDownloadedSongIds] = useState<Set<string>>(new Set());
    const [managingSong, setManagingSong] = useState<Song | null>(null);
    const [confirmRemoveSongId, setConfirmRemoveSongId] = useState<string | null>(null);

    // ========== 主题编辑器状态 ==========
    const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
    const [newThemeName, setNewThemeName] = useState<string>("");
    const [colorSchemeDraft, setColorSchemeDraft] = useState<"light" | "dark">("light");
    const [themeColorDraft, setThemeColorDraft] = useState<string>("#228be6");
    const [backgroundColorDraft, setBackgroundColorDraft] = useState<string>(computedColorScheme === "dark" ? "#0b1021" : "#f8fafc");
    const [backgroundOpacityDraft, setBackgroundOpacityDraft] = useState<number>(1);
    const [backgroundImageUrlDraft, setBackgroundImageUrlDraft] = useState<string>("");
    const [panelOpacityDraft, setPanelOpacityDraft] = useState<number>(0.92);
    const [panelColorDraft, setPanelColorDraft] = useState<string>("#ffffff");
    const [savingTheme, setSavingTheme] = useState(false);

    // ========== Hook 实例（依赖上述状态） ==========
    const favoriteActions = useFavoriteActions({
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
    });

    // ========== 派生值和辅助函数 ==========
    const setBackgroundImageUrlDraftSafe = useCallback((url: string) => {
        setBackgroundImageUrlDraft(prev => (prev === url ? prev : url));
    }, []);

    // 播放区间相关派生值（从 useAudioInterval hook 获取）
    const maxSkipLimit = duration > 0 ? duration : 1;

    // 同步区间值到 ref，确保音频事件处理中总能获取最新值
    useEffect(() => {
        intervalRef.current = { start: intervalStart, end: intervalEnd, length: intervalLength };
    }, [intervalStart, intervalEnd, intervalLength]);

    // 检查当前歌曲是否已下载
    useEffect(() => {
        (async () => {
            try {
                if (currentSong?.id) {
                    const downloaded = await Services.IsSongDownloaded(currentSong.id);
                    setIsDownloaded(!!downloaded);
                } else {
                    setIsDownloaded(false);
                }
            } catch (e) {
                console.warn("检查下载状态失败", e);
                setIsDownloaded(false);
            }
        })();
    }, [currentSong]);

    // 批量检查所有歌曲的下载状态
    useEffect(() => {
        (async () => {
            if (songs.length === 0) {
                setDownloadedSongIds(new Set());
                return;
            }
            try {
                const results = await Promise.all(
                    songs.map(async (song) => {
                        try {
                            const downloaded = await Services.IsSongDownloaded(song.id);
                            return downloaded ? song.id : null;
                        } catch {
                            return null;
                        }
                    })
                );
                const downloadedIds = new Set(results.filter((id): id is string => id !== null));
                setDownloadedSongIds(downloadedIds);
            } catch (e) {
                console.warn("批量检查下载状态失败", e);
            }
        })();
    }, [songs]);

    type GlobalSearchResult = { kind: "song"; song: Song } | { kind: "favorite"; favorite: Favorite };

    const normalizeText = (value?: string | null) => (value || "").toLowerCase();

    // 主题缓存辅助函数
    const saveCachedCustomThemes = useCallback((themesToCache: Theme[]) => {
        try {
            localStorage.setItem('customThemes', JSON.stringify(themesToCache));
        } catch (e) {
            console.warn('保存自定义主题缓存失败', e);
        }
    }, []);

    const toRgba = (color: string, alpha: number) => {
        const a = Math.min(1, Math.max(0, alpha));
        if (color.startsWith("#")) {
            const hex = color.replace("#", "");
            const normalized = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
            if (normalized.length === 6) {
                const r = parseInt(normalized.slice(0, 2), 16);
                const g = parseInt(normalized.slice(2, 4), 16);
                const b = parseInt(normalized.slice(4, 6), 16);
                if (![r, g, b].some((v) => Number.isNaN(v))) {
                    return `rgba(${r}, ${g}, ${b}, ${a})`;
                }
            }
        }
        return color;
    };

    const backgroundWithOpacity = useMemo(
        () => toRgba(backgroundColor, backgroundOpacity),
        [backgroundColor, backgroundOpacity]
    );

    const panelBackground = useMemo(() => toRgba(panelColor, panelOpacity), [panelColor, panelOpacity]);

    const lightenHex = (hex: string, percent: number) => {
        const num = parseInt(hex.replace("#", ""), 16);
        const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * (percent / 100)));
        const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * (percent / 100)));
        const b = Math.min(255, Math.floor((num & 0x0000FF) + (255 - (num & 0x0000FF)) * (percent / 100)));
        return `rgb(${r}, ${g}, ${b})`;
    };
    const themeColorLight = useMemo(() => lightenHex(themeColor, 40), [themeColor]);

    const persistSettings = async (partial: Partial<PlayerSetting>) => {
        const next = {
            id: setting?.id ?? 1,
            playMode,
            defaultVolume: volume,
            themes: setting?.themes ?? "",
            currentThemeId: currentThemeId,
            themeColor,
            backgroundColor,
            backgroundOpacity,
            backgroundImage: backgroundImageUrl,
            panelOpacity,
            updatedAt: new Date().toISOString(),
            ...partial,
        } as PlayerSetting;
        setSetting(next);
        try {
            await Services.SavePlayerSetting(next as any);
        } catch (err) {
            console.error("保存设置失败", err);
        }
    };

    useEffect(() => {
        if (!settingsLoadedRef.current) return;
        if (skipPersistRef.current) {
            skipPersistRef.current = false;
            return;
        }
        // 使用 setTimeout 防抖，避免频繁保存
        const timeoutId = setTimeout(() => {
            persistSettings({});
        }, 500); // 500ms 防抖延迟
        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [themeColor, backgroundColor, backgroundOpacity, backgroundImageUrl, panelOpacity]);

    // 关闭软件时：同步设置到后端并清理前端缓存
    useEffect(() => {
        const handleBeforeUnload = async () => {
            try {
                await persistSettings({});
            } catch { }
            try {
                localStorage.removeItem("tomorin.userInfo");
                localStorage.removeItem("tomorin.customThemes");
            } catch { }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!window.go?.services?.Service?.GetPlayerSetting) {
            console.warn("Wails runtime not ready, skipping settings load");
            settingsLoadedRef.current = true;
            return;
        }

        // 尝试从 localStorage 恢复用户信息
        try {
            const cachedUserInfo = localStorage.getItem("tomorin.userInfo");
            if (cachedUserInfo) {
                setUserInfo(JSON.parse(cachedUserInfo));
            }
        } catch (e) {
            console.warn("恢复用户信息失败:", e);
        }

        // 检查登录状态并尝试恢复
        Services.IsLoggedIn().then(loggedIn => {
            setIsLoggedIn(loggedIn);
            if (loggedIn && !userInfo) {
                // 已登录但没有加载用户信息，尝试获取
                Services.GetUserInfo()
                    .then(info => {
                        setUserInfo(info);
                        localStorage.setItem("tomorin.userInfo", JSON.stringify(info));
                    })
                    .catch(err => console.warn("自动获取用户信息失败:", err));
            }
        }).catch(err => {
            setIsLoggedIn(false);
            console.warn("检查登录状态失败:", err);
        });

        // 启动时始终从后端读取配置（不再优先本地缓存）
        const themesPromise = Services.GetThemes();

        Promise.all([Services.GetPlayerSetting(), themesPromise])
            .then(([s, customThemesList]) => {
                const customThemes = customThemesList || [];
                // 可选择：同步到本地缓存以便前端快速显示，但不作为数据源
                saveCachedCustomThemes(customThemes);
                setSetting(s as any);
                setVolume(s.defaultVolume ?? 0.5);
                setPlayMode((s.playMode as any) ?? "order");

                // 合并默认主题和自定义主题
                const allThemes = [...defaultThemes, ...customThemes];
                setThemes(allThemes);
                setCurrentThemeId(s.currentThemeId || "light");

                // 从当前主题加载颜色设置
                const currentTheme = allThemes.find((t: Theme) => t.id === (s.currentThemeId || "light"));
                if (currentTheme) {
                    setThemeColor(currentTheme.themeColor);
                    setBackgroundColor(currentTheme.backgroundColor);
                    setBackgroundOpacity(currentTheme.backgroundOpacity);
                    setBackgroundImageUrlSafe(currentTheme.backgroundImage);
                    setPanelColor(currentTheme.panelColor);
                    setPanelOpacity(currentTheme.panelOpacity);
                }
                settingsLoadedRef.current = true;
            })
            .catch((e) => {
                console.warn("加载设置失败", e);
                settingsLoadedRef.current = true;
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 当设置打开时，刷新缓存大小
    useEffect(() => {
        if (modals.settingsModal) {
            (async () => {
                try {
                    const size = await Services.GetAudioCacheSize();
                    setCacheSize(size);
                } catch (e) {
                    console.warn("获取缓存大小失败", e);
                }
            })();
        }
    }, [modals.settingsModal]);

    useEffect(() => {
        (async () => {
            try {
                setStatus("正在加载...");

                // 检查登录状态
                const loggedIn = await Services.IsLoggedIn();
                setIsLoggedIn(loggedIn);
                if (!loggedIn) {
                    openModal("loginModal");
                } else {
                    try {
                        const info = await Services.GetUserInfo();
                        setUserInfo(info);
                        localStorage.setItem("tomorin.userInfo", JSON.stringify(info));
                    } catch (e) {
                        console.warn("获取用户信息失败:", e);
                    }
                }

                // 确保数据库有默认歌单
                try {
                    await Services.Seed();
                } catch (seedErr) {
                    console.warn("Seed 失败", seedErr);
                }

                const [songList, favList] = await Promise.all([
                    Services.ListSongs(),
                    Services.ListFavorites(),
                ]);

                // 从 localStorage 恢复缓存的播放时间设置
                const songsWithCache = songList.map(song => {
                    try {
                        const cacheKey = `tomorin.song.${song.id}`;
                        const cached = localStorage.getItem(cacheKey);
                        if (cached) {
                            const cacheData = JSON.parse(cached);
                            // 使用缓存的值覆盖数据库的值（缓存更新更及时）
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

                setSongs(songsWithCache);
                setFavorites(favList);

                if (!setting) {
                    setSetting({ defaultVolume: 0.5 } as any);
                    setVolume(0.5);
                }

                // 尝试恢复播放列表和播放位置
                try {
                    const savedPlaylist = await Services.GetPlaylist();
                    if (savedPlaylist && savedPlaylist.queue) {
                        const queueIds = JSON.parse(savedPlaylist.queue || "[]");
                        if (queueIds.length > 0) {
                            // 根据保存的 ID 列表重建播放列表（使用带缓存的歌曲）
                            const restoredQueue = queueIds
                                .map((id: string) => songsWithCache.find((s) => s.id === id))
                                .filter(Boolean);

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

                // 尝试恢复上次播放的歌单和歌曲（向后兼容）
                try {
                    const history = await Services.GetPlayHistory();
                    if (history && history.songId) {
                        // 尝试找到上次播放的歌曲
                        const lastSong = songsWithCache.find((s) => s.id === history.songId);
                        if (lastSong) {
                            // 如果有记录的歌单ID，尝试使用该歌单
                            if (history.favoriteId) {
                                const favIdx = favList.findIndex((f) => f.id === history.favoriteId);
                                if (favIdx >= 0) {
                                    setSelectedFavId(history.favoriteId);
                                    // 该歌单的歌曲通过别的地方加载
                                }
                            }
                            // 直接跳到上次播放的歌曲
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

                // 如果没有恢复历史，则使用默认行为
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
    }, [setting]);

    // 自动保存播放列表到后端
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

    useEffect(() => {
        if (!currentSong) return;
        try {
            Services.GetLyricMapping(currentSong.id)
                .then(setLyric)
                .catch(() => setLyric(null));
        } catch (e) {
            console.warn("获取歌词失败", e);
            setLyric(null);
        }
    }, [currentSong]);

    useEffect(() => {
        const audio = (audioRef.current ||= new Audio());
        audio.crossOrigin = "anonymous";
        audio.volume = volume;

        const handleError = (e: ErrorEvent | Event) => {
            console.error("音频加载错误:", e);
            const errorMsg = audio.error ? `${audio.error.code}: ${audio.error.message}` : "未知错误";
            console.warn("音频错误详情", {
                code: audio.error?.code,
                message: audio.error?.message,
                networkState: audio.networkState,
                readyState: audio.readyState,
                currentSrc: audio.currentSrc,
            });

            // AbortError 通常表示播放被中止或快速切歌，不需要处理
            if (audio.error && audio.error.code === 1) {
                console.log("播放被中止（快速切歌），跳过重试");
                return;
            }

            // 如果是本地文件 404，说明文件已被删除，应该清除本地 URL 并重新获取
            const isLocalUrl = currentSong?.streamUrl?.includes('127.0.0.1:9999/local');
            if (isLocalUrl && currentSong?.bvid) {
                console.log("本地文件加载失败，清除本地 URL 并重新获取网络地址...");
                setStatus("本地文件不可用，正在重新获取...");
                // 清除本地 URL
                const clearedSong = {
                    ...currentSong,
                    streamUrl: '',
                    streamUrlExpiresAt: new Date().toISOString(),
                };
                Services.UpsertSongs([clearedSong as any]).then(() => {
                    Services.ListSongs().then(setSongs);
                }).catch(console.error);
                // 延迟后重试播放
                setTimeout(() => {
                    if (currentSong && playingRef.current === currentSong.id) {
                        playSong(currentSong, queue);
                    }
                }, 500);
                return;
            }

            // 如果是网络错误（通常是 403），尝试刷新 URL，但限制重试次数
            if (audio.error && audio.error.code === 2 && currentSong?.bvid) {
                const count = (playbackRetryRef.current.get(currentSong.id) ?? 0) + 1;
                playbackRetryRef.current.set(currentSong.id, count);
                console.log(`检测到网络错误（可能是 403），第 ${count} 次尝试刷新播放地址...`);
                if (count > 3) {
                    const msg = "播放地址刷新失败，请稍后重试";
                    setStatus(msg);
                    setIsPlaying(false);
                    notifications.show({ title: "播放失败", message: msg, color: "red" });
                    return;
                }
                setStatus("播放地址失效，正在刷新...");
                // 延迟一下再刷新，避免立即重试
                setTimeout(() => {
                    if (currentSong && playingRef.current === currentSong.id) {
                        playSong(currentSong, queue);
                    }
                }, 500);
                return;
            }

            // 如果是源不支持/URL 无效，直接停止并提示，避免循环
            if (audio.error && audio.error.code === 4) {
                const msg = "音频源不可用或格式不支持";
                setStatus(msg);
                setIsPlaying(false);
                notifications.show({ title: "播放失败", message: msg, color: "red" });
                return;
            }

            setStatus(`音频错误: ${errorMsg}`);
            notifications.show({ title: "音频加载失败", message: errorMsg, color: "red" });
        };

        audio.addEventListener("error", handleError);

        const onTime = () => {
            const t = audio.currentTime;
            const { start, end } = intervalRef.current;
            if (t < start) {
                audio.currentTime = start;
                setProgress(start);
                return;
            }
            if (t > end) {
                audio.pause();
                setIsPlaying(false);
                audio.currentTime = start;
                setProgress(end);
                return;
            }
            setProgress(t);
        };
        const onLoaded = () => {
            const loadedDuration = audio.duration || 0;
            setDuration(loadedDuration);

            // 如果当前歌曲的 skipEndTime 为 0，自动设置为实际时长
            if (currentSong && loadedDuration > 0 && currentSong.skipEndTime === 0) {
                const updatedSong = {
                    ...currentSong,
                    skipEndTime: loadedDuration,
                } as any;
                setCurrentSong(updatedSong);

                // 自动保存到数据库
                Services.UpsertSongs([updatedSong]).catch((err) => {
                    console.warn("自动保存结束时间失败:", err);
                });
            }
        };
        const onEnded = () => {
            // 如果在区间内播放完，直接停；否则按队列跳下一首
            const { start, end } = intervalRef.current;
            if (audio.currentTime >= end) {
                audio.pause();
                setIsPlaying(false);
                audio.currentTime = start;
                setProgress(start);
                return;
            }
            if (queue.length > 0 && currentIndex < queue.length - 1) {
                const nextIndex = currentIndex + 1;
                setCurrentIndex(nextIndex);
                setCurrentSong(queue[nextIndex]);
            } else {
                setIsPlaying(false);
            }
        };
        audio.addEventListener("timeupdate", onTime);
        audio.addEventListener("loadedmetadata", onLoaded);
        audio.addEventListener("ended", onEnded);
        return () => {
            audio.removeEventListener("error", handleError);
            audio.removeEventListener("timeupdate", onTime);
            audio.removeEventListener("loadedmetadata", onLoaded);
            audio.removeEventListener("ended", onEnded);
        };
    }, [queue, currentIndex, volume]);

    // 当歌曲切换时，更新参考 ID（简化逻辑，避免复杂的自动重置）
    useEffect(() => {
        prevSongIdRef.current = currentSong?.id ?? null;
    }, [currentSong?.id]);

    // 监听 currentSong 变化：设置音频源和重置进度
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentSong) {
            if (audio) {
                audio.pause();
                audio.src = "";
            }
            return;
        }

        // 更换歌曲时重置该歌曲的重试计数，防止旧状态泄漏
        playbackRetryRef.current.delete(currentSong.id);

        // 检查 URL 是否存在和有效
        if (!currentSong.streamUrl) {
            setStatus("当前歌曲缺少播放地址，正在尝试获取...");
            // 尝试刷新 URL
            if (currentSong.bvid) {
                playSong(currentSong, queue);
            } else {
                setIsPlaying(false);
                audio.pause();
            }
            return;
        }

        // 检查 URL 是否过期（本地文件除外）
        const isLocalUrl = currentSong.streamUrl?.includes('127.0.0.1:9999/local');
        if (!isLocalUrl) {
            const exp = (currentSong as any).streamUrlExpiresAt;
            const isExpired = exp && new Date(exp).getTime() <= Date.now() + 60_000;
            if (isExpired && currentSong.bvid) {
                console.log("URL 已过期，正在刷新...");
                setStatus("播放地址已过期，正在刷新...");
                playSong(currentSong, queue);
                return;
            }
        }

        // 防止并发播放：如果正在播放其他歌曲，先停止
        if (playingRef.current && playingRef.current !== currentSong.id) {
            console.log(`停止播放 ${playingRef.current}，切换到 ${currentSong.id}`);
            audio.pause();
            audio.src = "";
        }

        console.log("设置音频源:", currentSong.streamUrl);
        playingRef.current = currentSong.id;
        audio.src = currentSong.streamUrl;
        audio.currentTime = 0; // 新歌曲时重置进度
        const onPlaying = () => {
            if (currentSong?.id) {
                playbackRetryRef.current.delete(currentSong.id);
            }
        };
        audio.addEventListener("playing", onPlaying, { once: true });
    }, [currentSong?.id, currentSong?.streamUrl, currentSong?.bvid, queue]);

    // 监听 isPlaying 变化：控制播放/暂停
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentSong) return;

        if (isPlaying) {
            // 等待音频可以播放后再播放
            const onCanPlay = () => {
                audio.removeEventListener("canplay", onCanPlay);
                audio.play().catch((e) => {
                    console.error("播放失败:", e);
                    const count = (playbackRetryRef.current.get(currentSong.id) ?? 0) + 1;
                    playbackRetryRef.current.set(currentSong.id, count);
                    if (count >= 3) {
                        setIsPlaying(false);
                        setStatus(`无法播放: ${e}`);
                        notifications.show({ title: "播放失败", message: String(e), color: "red" });
                    }
                });
            };
            audio.addEventListener("canplay", onCanPlay, { once: true });
            // 如果已经可以播放，直接播放
            if (audio.readyState >= 2) {
                audio.play().catch((e) => {
                    console.error("播放失败:", e);
                    const count = (playbackRetryRef.current.get(currentSong.id) ?? 0) + 1;
                    playbackRetryRef.current.set(currentSong.id, count);
                    if (count >= 3) {
                        setIsPlaying(false);
                        setStatus(`无法播放: ${e}`);
                        notifications.show({ title: "播放失败", message: String(e), color: "red" });
                    }
                });
            }
        } else {
            audio.pause();
        }
    }, [isPlaying, currentSong]);

    const playSong = async (song: Song, list?: Song[]) => {
        const targetList = list ?? queue;
        const idx = targetList.findIndex((s) => s.id === song.id);
        setQueue(targetList);
        setCurrentIndex(idx >= 0 ? idx : 0);

        let toPlay = song;
        // 优先使用本地缓存：如果存在本地文件，直接走本地代理URL
        try {
            const localUrl = await Services.GetLocalAudioURL(song.id);
            if (localUrl) {
                console.log("找到本地缓存文件，使用本地 URL:", localUrl);
                toPlay = {
                    ...song,
                    streamUrl: localUrl,
                    // 本地文件不需要过期，给一个很远的未来时间
                    streamUrlExpiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
                    updatedAt: new Date().toISOString()
                } as any;
                // 不保存到数据库，只是临时使用，避免保存过时的本地 URL 引用
                setCurrentSong(toPlay);
                setIsPlaying(true);
                // 保存播放历史
                const currentFavId = selectedFavId || "";
                if (toPlay.id) {
                    Services.SavePlayHistory(currentFavId, toPlay.id).catch((e) => {
                        console.warn("保存播放历史失败", e);
                    });
                }
                return;
            }
        } catch (e) {
            console.warn('检查本地缓存失败', e);
        }
        const exp: any = (song as any).streamUrlExpiresAt;
        // 检查是否需要刷新URL：无URL、已过期、或不是代理URL（本地文件除外）
        const isLocalUrl = song.streamUrl?.includes('127.0.0.1:9999/local');
        const isProxyUrl = song.streamUrl?.includes('127.0.0.1:9999/audio');
        const expired = !isLocalUrl && (!song.streamUrl || !isProxyUrl || (exp && new Date(exp).getTime() <= Date.now() + 60_000));

        if (expired && song.bvid) {
            try {
                console.log("URL 过期或缺失，正在获取新的播放地址:", song.bvid);
                setStatus(`正在获取播放地址: ${song.name}`);
                const playInfo = await Services.GetPlayURL(song.bvid, 0);
                console.log("获取到播放信息:", playInfo);

                if (!playInfo || !playInfo.ProxyURL) {
                    console.error("playInfo缺少ProxyURL:", playInfo);
                    throw new Error("无法获取代理播放地址");
                }

                toPlay = {
                    ...song,
                    streamUrl: playInfo.ProxyURL,
                    streamUrlExpiresAt: playInfo.ExpiresAt,
                    updatedAt: new Date().toISOString()
                } as any;
                console.log("已更新 streamUrl:", playInfo.ProxyURL);
                console.log("过期时间:", playInfo.ExpiresAt);

                await Services.UpsertSongs([toPlay as any]);
                const refreshed = await Services.ListSongs();
                setSongs(refreshed);
                setStatus("就绪");
            } catch (e) {
                const errorMsg = e instanceof Error ? e.message : '未知错误';
                console.error("获取播放地址失败:", errorMsg);
                notifications.show({ title: '获取播放地址失败', message: errorMsg, color: 'red' });
                setStatus(`错误: ${errorMsg}`);
                setIsPlaying(false);
                return; // 停止播放
            }
        }

        setCurrentSong(toPlay);
        setIsPlaying(true);

        // 保存播放历史：记录当前歌单（如果存在）和歌曲
        const currentFavId = selectedFavId || "";
        if (toPlay.id) {
            Services.SavePlayHistory(currentFavId, toPlay.id).catch((e) => {
                console.warn("保存播放历史失败", e);
            });
        }
    };

    const playNext = () => {
        if (playMode === "single") {
            const audio = audioRef.current;
            if (audio) {
                audio.currentTime = 0;
                audio.play().catch(console.error);
            }
        } else if (queue.length > 0) {
            let nextIdx = currentIndex + 1;
            if (playMode === "random") {
                nextIdx = Math.floor(Math.random() * queue.length);
            } else if (nextIdx >= queue.length) {
                nextIdx = 0;
            }
            setCurrentIndex(nextIdx);
            const nextSong = queue[nextIdx];
            setCurrentSong(nextSong);
            // 自动播放下一首
            setIsPlaying(true);
            playSong(nextSong, queue);
        }
    };

    const playPrev = () => {
        if (queue.length > 0) {
            let prevIdx = currentIndex - 1;
            if (prevIdx < 0) prevIdx = queue.length - 1;
            setCurrentIndex(prevIdx);
            const prevSong = queue[prevIdx];
            setCurrentSong(prevSong);
            // 自动播放上一首
            setIsPlaying(true);
            playSong(prevSong, queue);
        }
    };

    const togglePlay = async () => {
        const audio = audioRef.current;
        if (!audio || !currentSong?.streamUrl) return;
        const target = Math.max(intervalStart, Math.min(audio.currentTime || 0, intervalEnd));
        audio.currentTime = target;
        if (audio.paused) {
            await audio.play();
            setIsPlaying(true);
        } else {
            audio.pause();
            setIsPlaying(false);
        }
    };

    const changeVolume = (v: number) => {
        const audio = audioRef.current;
        const clamped = Math.min(1, Math.max(0, v));
        setVolume(clamped);
        if (audio) audio.volume = clamped;
    };

    const compressImageToWebp = async (
        file: File,
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.7
    ): Promise<string> => {
        return new Promise((resolve, reject) => {
            // 避免 Mantine 的 Image 组件遮蔽全局 Image 构造函数
            const img = new window.Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                try {
                    const { width, height } = img;
                    let targetW = width;
                    let targetH = height;
                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        targetW = Math.round(width * ratio);
                        targetH = Math.round(height * ratio);
                    }
                    const canvas = document.createElement("canvas");
                    canvas.width = targetW;
                    canvas.height = targetH;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) {
                        URL.revokeObjectURL(url);
                        reject(new Error("无法创建画布上下文"));
                        return;
                    }
                    ctx.drawImage(img, 0, 0, targetW, targetH);
                    // 使用 toDataURL 而不是 toBlob，直接返回 DataURL
                    const dataUrl = canvas.toDataURL("image/jpeg", quality);
                    URL.revokeObjectURL(url);
                    resolve(dataUrl);
                } catch (err) {
                    URL.revokeObjectURL(url);
                    reject(new Error(`图片压缩失败: ${String(err)}`));
                }
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error("图片加载失败"));
            };
            img.src = url;
        });
    };

    const loadBackgroundFile = async (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (value: string) => void
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const compressed = await compressImageToWebp(file);
            setter(compressed);
        } catch (err) {
            console.error("压缩图片失败", err);
        } finally {
            e.target.value = "";
        }
    };

    const handleBackgroundFileDraft = (e: React.ChangeEvent<HTMLInputElement>) => {
        void loadBackgroundFile(e, setBackgroundImageUrlDraftSafe);
    };

    const addSong = async () => {
        const name = prompt("歌曲名") || "新歌曲";
        const streamUrl = prompt("音频地址 (可选)") || "";
        const newSong = {
            id: "",
            bvid: "",
            name,
            singer: "",
            singerId: "",
            cover: "",
            streamUrl,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await Services.UpsertSongs([newSong as any]);
        const refreshed = await Services.ListSongs();
        setSongs(refreshed);
        if (!currentSong && refreshed.length) {
            playSong(refreshed[0], refreshed);
        }
    };

    const saveLyric = async (value: string) => {
        if (!currentSong) return;
        const next = {
            id: currentSong.id,
            lyric: value,
            offsetMs: lyric?.offsetMs ?? 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await Services.SaveLyricMapping(next as any);
        setLyric(next as any);
    };

    const saveLyricOffset = async (offset: number) => {
        if (!currentSong) return;
        const next = {
            id: currentSong.id,
            lyric: lyric?.lyric ?? "",
            offsetMs: offset,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await Services.SaveLyricMapping(next as any);
        setLyric(next as any);
    };

    const updateStreamUrl = async (url: string) => {
        if (!currentSong) return;
        const updated = { ...currentSong, streamUrl: url };
        await Services.UpsertSongs([updated as any]);
        const refreshed = await Services.ListSongs();
        setSongs(refreshed);
        setCurrentSong(updated as any);
    };

    const createFavorite = () => {
        setCreateFavName("新歌单");
        setCreateFavMode("blank");
        setDuplicateSourceId(null);
        setImportFid("");
        openModal("createFavModal");
    };

    const handleDeleteFavorite = (id: string) => favoriteActions.deleteFavorite(id, setConfirmDeleteFavId);

    const handleEditFavorite = (fav: Favorite) => favoriteActions.editFavorite(fav, setEditingFavId, setEditingFavName);

    const handleSaveEditFavorite = () => favoriteActions.saveEditFavorite(editingFavId, editingFavName);

    const handleSubmitCreateFavorite = () => favoriteActions.createFavorite({
        name: createFavName,
        mode: createFavMode,
        duplicateSourceId,
        importFid,
        selectedMyFavId: null, // TODO: 需要添加这个状态
    });

    const addCurrentToFavorite = async (favId: string) => {
        if (!currentSong) return;
        const target = favorites.find((f) => f.id === favId);
        if (!target) return;
        const next = {
            ...target,
            songIds: [...target.songIds, { id: 0, songId: currentSong.id, favoriteId: favId }],
        };
        await Services.SaveFavorite(next as any);
        setFavorites(await Services.ListFavorites());
    };

    const playSingleSong = async (song: Song, songFavorite?: Favorite) => {
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
    };

    const playFavorite = (fav: Favorite) => {
        const idSet = new Set(fav.songIds.map((s) => s.songId));
        const list = songs.filter((s) => idSet.has(s.id));
        if (list.length === 0) return;
        // 播放歌单时，替换整个播放列表
        setQueue(list);
        setCurrentIndex(0);
        playSong(list[0], list);
    };

    const filteredSongs = songs.filter((s) =>
        searchQuery === "" || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.singer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const currentFav = selectedFavId ? (favorites.find((f) => f.id === selectedFavId) ?? null) : null;
    const currentFavSongs = currentFav
        ? songs.filter((s) => currentFav.songIds.some((ref) => ref.songId === s.id))
        : [];

    const globalSearchResults: GlobalSearchResult[] = useMemo(() => {
        const term = globalSearchTerm.trim().toLowerCase();
        if (!term) return [];
        const songMatches = songs
            .filter((s) => {
                const name = normalizeText(s.name);
                const singer = normalizeText(s.singer);
                const bvid = normalizeText(s.bvid);
                const singerId = normalizeText(s.singerId);
                return name.includes(term) || singer.includes(term) || bvid.includes(term) || singerId.includes(term);
            })
            .map((song) => ({ kind: "song" as const, song }));
        const favoriteMatches = favorites
            .filter((f) => {
                const fid = normalizeText(f.id);
                const title = normalizeText(f.title);
                return fid.includes(term) || title.includes(term);
            })
            .map((favorite) => ({ kind: "favorite" as const, favorite }));
        return [...songMatches, ...favoriteMatches];
    }, [globalSearchTerm, songs, favorites]);

    const backgroundStyle = useMemo(() => ({
        overflow: "hidden",
        backgroundColor: backgroundWithOpacity,
        backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
    }), [backgroundWithOpacity, backgroundImageUrl]);
    const applyThemeToUi = (theme: Theme) => {
        setCurrentThemeId(theme.id);
        if (theme.colorScheme) {
            setColorScheme(theme.colorScheme as "light" | "dark");
        }
        skipPersistRef.current = true;
        setThemeColor(theme.themeColor);
        setBackgroundColor(theme.backgroundColor);
        setBackgroundOpacity(theme.backgroundOpacity);
        setBackgroundImageUrlSafe(theme.backgroundImage);
        setPanelColor(theme.panelColor);
        setPanelOpacity(theme.panelOpacity);
    };

    const handleSelectTheme = (theme: Theme) => {
        applyThemeToUi(theme);
        Services.SetCurrentTheme(theme.id).catch(err => console.error("SetCurrentTheme failed", err));
    };

    const handleEditTheme = (theme: Theme) => {
        setEditingThemeId(theme.id);
        setNewThemeName(theme.name);
        setColorSchemeDraft((theme.colorScheme as "light" | "dark") || "light");
        setThemeColorDraft(theme.themeColor);
        setBackgroundColorDraft(theme.backgroundColor);
        setBackgroundOpacityDraft(theme.backgroundOpacity);
        setBackgroundImageUrlDraftSafe(theme.backgroundImage);
        setPanelColorDraft(theme.panelColor);
        setPanelOpacityDraft(theme.panelOpacity);
        openModal("themeEditorModal");
    };

    const handleDeleteTheme = async (id: string) => {
        await Services.DeleteTheme(id);
        const currentCustomThemes = getCustomThemesFromState(themes);
        const nextCustom = currentCustomThemes.filter((t) => t.id !== id);
        saveCachedCustomThemes(nextCustom);
        setThemes([...defaultThemes, ...nextCustom]);
    };

    const handleCreateThemeClick = () => {
        setEditingThemeId(null);
        setNewThemeName("");
        setColorSchemeDraft(computedColorScheme);
        setThemeColorDraft("#228be6");
        setBackgroundColorDraft(computedColorScheme === "dark" ? "#0b1021" : "#f8fafc");
        setBackgroundOpacityDraft(1);
        setBackgroundImageUrlDraftSafe("");
        setPanelColorDraft(computedColorScheme === "dark" ? "#1f2937" : "#ffffff");
        setPanelOpacityDraft(0.92);
        openModal("themeEditorModal");
    };

    const handleSubmitTheme = async () => {
        setSavingTheme(true);
        const toastId = notifications.show({
            title: editingThemeId ? "正在保存主题" : "正在创建主题",
            message: "请稍候...",
            color: themeColorDraft,
            loading: true,
            autoClose: false,
        });
        try {
            if (editingThemeId) {
                const editingTheme = themes.find(t => t.id === editingThemeId);
                const updatedTheme: Theme = {
                    id: editingThemeId,
                    name: newThemeName || "未命名主题",
                    colorScheme: colorSchemeDraft,
                    themeColor: themeColorDraft,
                    backgroundColor: backgroundColorDraft,
                    backgroundOpacity: backgroundOpacityDraft,
                    backgroundImage: backgroundImageUrlDraft,
                    panelColor: panelColorDraft,
                    panelOpacity: panelOpacityDraft,
                    isDefault: editingTheme?.isDefault || false,
                    isReadOnly: false,
                };
                await Services.UpdateTheme(updatedTheme);
                const currentCustomThemes = getCustomThemesFromState(themes);
                const nextCustom = currentCustomThemes.map((t) => (t.id === editingThemeId ? updatedTheme : t));
                saveCachedCustomThemes(nextCustom);
                setThemes([...defaultThemes, ...nextCustom]);
                if (currentThemeId === editingThemeId) {
                    applyThemeToUi(updatedTheme);
                }
                notifications.update({
                    id: toastId,
                    title: "主题已保存",
                    message: updatedTheme.name,
                    color: "teal",
                    loading: false,
                    autoClose: 1500,
                });
            } else {
                const newTheme: Theme = {
                    id: "",
                    name: newThemeName || "未命名主题",
                    colorScheme: colorSchemeDraft,
                    themeColor: themeColorDraft,
                    backgroundColor: backgroundColorDraft,
                    backgroundOpacity: backgroundOpacityDraft,
                    backgroundImage: backgroundImageUrlDraft,
                    panelColor: panelColorDraft,
                    panelOpacity: panelOpacityDraft,
                    isDefault: false,
                    isReadOnly: false,
                };
                const createdTheme = await Services.CreateTheme(newTheme);
                const currentCustomThemes = getCustomThemesFromState(themes);
                const nextCustom = [...currentCustomThemes, createdTheme];
                saveCachedCustomThemes(nextCustom);
                setThemes([...defaultThemes, ...nextCustom]);
                notifications.update({
                    id: toastId,
                    title: "主题已创建",
                    message: createdTheme.name,
                    color: "teal",
                    loading: false,
                    autoClose: 1500,
                });
            }
            closeModal("themeEditorModal");
            setEditingThemeId(null);
            setNewThemeName("");
        } catch (err) {
            notifications.update({
                id: toastId,
                title: editingThemeId ? "保存失败" : "创建失败",
                message: `${err}`,
                color: "red",
                loading: false,
                autoClose: 3000,
            });
        } finally {
            setSavingTheme(false);
        }
    };

    const handleCloseThemeEditor = () => {
        closeModal("themeEditorModal");
        setEditingThemeId(null);
        setNewThemeName("");
        // 清空草稿状态
        setBackgroundImageUrlDraft("");
    };

    const handleClearBackgroundImageDraft = () => {
        console.log('handleClearBackgroundImageDraft 被调用，URL长度:', backgroundImageUrlDraft?.length || 0);
        // 注意：在 Wails 中 window.confirm 可能不工作，直接清除背景图
        console.log('开始清除背景图');
        setBackgroundImageUrlDraft("");
        console.log('背景图已设置为空字符串');
    };

    const handleIntervalChange = (start: number, end: number) => {
        if (!currentSong) return;
        const updated = {
            ...currentSong,
            skipStartTime: start,
            skipEndTime: end,
        } as any;

        // 1. 立即同步更新 currentSong
        setCurrentSong(updated);

        // 2. 立即同步更新 songs 列表
        setSongs(prevSongs =>
            prevSongs.map(s => s.id === updated.id ? updated : s)
        );

        // 3. 立即同步更新 queue
        setQueue(prevQueue =>
            prevQueue.map(s => s.id === updated.id ? updated : s)
        );

        // 4. 立即写入 localStorage 缓存
        try {
            const cacheKey = `tomorin.song.${updated.id}`;
            localStorage.setItem(cacheKey, JSON.stringify({
                skipStartTime: updated.skipStartTime,
                skipEndTime: updated.skipEndTime,
                updatedAt: new Date().toISOString()
            }));
        } catch (err) {
            console.warn("写入缓存失败:", err);
        }

        // 5. 防抖异步持久化到数据库（500ms 后保存）
        const saveKey = `interval_${updated.id}`;
        const existingTimer = saveTimerRef.current.get(saveKey);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        const timer = setTimeout(() => {
            Services.UpsertSongs([updated]).catch((err) => {
                console.error("保存播放区间失败:", err);
            });
            saveTimerRef.current.delete(saveKey);
        }, 500);

        saveTimerRef.current.set(saveKey, timer);
    };

    const handleSkipStartChange = (value: number) => {
        if (!currentSong) return;
        const updated = {
            ...currentSong,
            skipStartTime: value,
        } as any;

        // 1. 立即同步更新 currentSong
        setCurrentSong(updated);

        // 2. 立即同步更新 songs 列表
        setSongs(prevSongs =>
            prevSongs.map(s => s.id === updated.id ? updated : s)
        );

        // 3. 立即同步更新 queue
        setQueue(prevQueue =>
            prevQueue.map(s => s.id === updated.id ? updated : s)
        );

        // 4. 立即写入 localStorage 缓存
        try {
            const cacheKey = `tomorin.song.${updated.id}`;
            localStorage.setItem(cacheKey, JSON.stringify({
                skipStartTime: updated.skipStartTime,
                skipEndTime: updated.skipEndTime,
                updatedAt: new Date().toISOString()
            }));
        } catch (err) {
            console.warn("写入缓存失败:", err);
        }

        // 5. 防抖异步持久化到数据库（500ms 后保存）
        const saveKey = `start_${updated.id}`;
        const existingTimer = saveTimerRef.current.get(saveKey);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        const timer = setTimeout(() => {
            Services.UpsertSongs([updated]).catch((err) => {
                console.error("保存起始时间失败:", err);
            });
            saveTimerRef.current.delete(saveKey);
        }, 500);

        saveTimerRef.current.set(saveKey, timer);
    };

    const handleSkipEndChange = (value: number) => {
        if (!currentSong) return;
        const updated = {
            ...currentSong,
            skipEndTime: value,
        } as any;

        // 1. 立即同步更新 currentSong
        setCurrentSong(updated);

        // 2. 立即同步更新 songs 列表
        setSongs(prevSongs =>
            prevSongs.map(s => s.id === updated.id ? updated : s)
        );

        // 3. 立即同步更新 queue
        setQueue(prevQueue =>
            prevQueue.map(s => s.id === updated.id ? updated : s)
        );

        // 4. 立即写入 localStorage 缓存
        try {
            const cacheKey = `tomorin.song.${updated.id}`;
            localStorage.setItem(cacheKey, JSON.stringify({
                skipStartTime: updated.skipStartTime,
                skipEndTime: updated.skipEndTime,
                updatedAt: new Date().toISOString()
            }));
        } catch (err) {
            console.warn("写入缓存失败:", err);
        }

        // 5. 防抖异步持久化到数据库（500ms 后保存）
        const saveKey = `end_${updated.id}`;
        const existingTimer = saveTimerRef.current.get(saveKey);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        const timer = setTimeout(() => {
            Services.UpsertSongs([updated]).catch((err) => {
                console.error("保存结束时间失败:", err);
            });
            saveTimerRef.current.delete(saveKey);
        }, 500);

        saveTimerRef.current.set(saveKey, timer);
    };

    const handleStreamUrlChange = (value: string) => {
        updateStreamUrl(value);
    };

    const handlePlayModeToggle = () => setPlayMode(playMode === "order" ? "random" : playMode === "random" ? "single" : "order");

    const handleDownload = async () => {
        if (!currentSong) {
            notifications.show({ title: '无法操作', message: '未选择歌曲', color: 'red' });
            return;
        }
        await handleDownloadSong(currentSong);
    };

    const handleDownloadSong = async (song: Song) => {
        if (!song) {
            notifications.show({ title: '无法操作', message: '未选择歌曲', color: 'red' });
            return;
        }
        const isAlreadyDownloaded = downloadedSongIds.has(song.id);
        // 已下载则打开管理弹窗，未下载则直接下载
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
            // 更新下载状态
            setDownloadedSongIds(prev => new Set([...prev, song.id]));
            if (currentSong?.id === song.id) {
                setIsDownloaded(true);
            }
        } catch (e: any) {
            const msg = e?.message ?? String(e);
            notifications.show({ title: '下载失败', message: msg, color: 'red' });
            setStatus(`下载失败: ${msg}`);
        }
    };

    const handleDownloadAllFavorite = async (fav: Favorite) => {
        if (!fav || fav.songIds.length === 0) {
            notifications.show({ title: '无法操作', message: '歌单为空', color: 'red' });
            return;
        }
        // 过滤出未下载的歌曲
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
    };


    const handleOpenDownloadedFile = async () => {
        if (!managingSong) return;
        try {
            await Services.OpenDownloadedFile(managingSong.id);
        } catch (e: any) {
            notifications.show({ title: '打开失败', message: e?.message ?? String(e), color: 'red' });
        }
    };

    const handleDeleteDownloadedFile = async () => {
        if (!managingSong) return;
        try {
            await Services.DeleteDownloadedSong(managingSong.id);
            // 更新下载状态
            setDownloadedSongIds(prev => {
                const next = new Set(prev);
                next.delete(managingSong.id);
                return next;
            });
            if (currentSong?.id === managingSong.id) {
                setIsDownloaded(false);
            }
            closeModal("downloadModal");
            setConfirmDeleteDownloaded(false);
            setManagingSong(null);
            notifications.show({ title: '已删除下载文件', color: 'green' });
        } catch (e: any) {
            notifications.show({ title: '删除失败', message: e?.message ?? String(e), color: 'red' });
        }
    };

    const handleAddSongToFavorite = (song: Song) => {
        setCurrentSong(song);
        openModal("addFavoriteModal");
    };

    const handleRemoveSongFromPlaylist = async (song: Song) => {
        if (!currentFav) return;
        try {
            const updatedFav = {
                ...currentFav,
                songIds: currentFav.songIds.filter(ref => ref.songId !== song.id),
            };
            await Services.SaveFavorite(updatedFav as any);
            const refreshedFavs = await Services.ListFavorites();
            setFavorites(refreshedFavs);
            setConfirmRemoveSongId(null);
            notifications.show({ title: '已移出歌单', message: song.name, color: 'green' });
        } catch (e: any) {
            notifications.show({ title: '移出失败', message: e?.message ?? String(e), color: 'red' });
        }
    };

    const handleAddToFavoriteFromModal = (fav: Favorite) => {
        setStatus(`已添加到歌单: ${fav.title}`);
        closeModal("addFavoriteModal");
    };

    const handlePlaylistSelect = (song: Song, index: number) => {
        setCurrentIndex(index);
        setCurrentSong(song);
        closeModal("playlistModal");
    };

    const handlePlaylistReorder = (fromIndex: number, toIndex: number) => {
        const newQueue = [...queue];
        const [movedItem] = newQueue.splice(fromIndex, 1);
        newQueue.splice(toIndex, 0, movedItem);
        setQueue(newQueue);

        // 更新当前播放索引
        if (currentIndex === fromIndex) {
            setCurrentIndex(toIndex);
        } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
            setCurrentIndex(currentIndex - 1);
        } else if (fromIndex > currentIndex && toIndex <= currentIndex) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePlaylistRemove = (index: number) => {
        const newQueue = queue.filter((_, i) => i !== index);
        setQueue(newQueue);

        // 如果删除的是当前播放的歌曲
        if (index === currentIndex) {
            if (newQueue.length === 0) {
                setCurrentSong(null);
                setIsPlaying(false);
            } else if (index >= newQueue.length) {
                // 删除的是最后一首，播放前一首
                const newIndex = newQueue.length - 1;
                setCurrentIndex(newIndex);
                setCurrentSong(newQueue[newIndex]);
            } else {
                // 播放同一位置的下一首
                setCurrentSong(newQueue[index]);
            }
        } else if (index < currentIndex) {
            // 删除的在当前播放之前，索引减1
            setCurrentIndex(currentIndex - 1);
        }
        // 如果删除的在当前播放之后，索引不变
    };

    const handleSearchResultClick = (result: GlobalSearchResult) => {
        if (result.kind === "song") {
            playSingleSong(result.song);
        } else {
            setSelectedFavId(result.favorite.id);
            playFavorite(result.favorite);
        }
        closeModal("globalSearchModal");
    };

    const handleRemoteSearch = async () => {
        const term = globalSearchTerm.trim();
        if (!term) return;
        // Skip if it's a BV or URL -> 走解析
        const bvPattern = /BV[0-9A-Za-z]{10}/;
        if (bvPattern.test(term) || term.includes('bilibili.com')) {
            await handleResolveBVAndAdd();
            return;
        }
        setRemoteLoading(true);
        try {
            const list = await Services.SearchBiliVideos(term, 1, 10);
            setRemoteResults(list);
        } catch (e) {
            notifications.show({ title: '搜索失败', message: e instanceof Error ? e.message : '未知错误', color: 'red' });
        } finally {
            setRemoteLoading(false);
        }
    };

    const handleAddFromRemote = async (item: Song) => {
        setGlobalSearchTerm(item.bvid || item.name || '');
        await handleResolveBVAndAdd();
    };

    const handleResolveBVAndAdd = async () => {
        const term = globalSearchTerm.trim();
        if (!term) return;

        // Check if input looks like a BV ID or URL
        const bvPattern = /BV[0-9A-Za-z]{10}/;
        if (!bvPattern.test(term) && !term.includes('bilibili.com')) {
            notifications.show({
                title: '输入格式错误',
                message: '请输入有效的 BV 号或 B站链接',
                color: 'orange',
            });
            return;
        }

        setResolvingBV(true);
        const toastId = notifications.show({
            title: '正在解析视频',
            message: '请稍候...',
            color: themeColor,
            loading: true,
            autoClose: false,
        });

        try {
            // Check if logged in
            const loggedIn = await Services.IsLoggedIn();
            setIsLoggedIn(loggedIn);
            if (!loggedIn) {
                notifications.update({
                    id: toastId,
                    title: '需要登录',
                    message: '请先通过扫码登录',
                    color: 'blue',
                    loading: false,
                    autoClose: 3000,
                });
                openModal("loginModal");
                setGlobalSearchTerm('');
                return;
            }

            const audioInfo = await Services.ResolveBiliAudio(term);
            const bvid = term.match(bvPattern)?.[0] || '';

            setBvPreview({
                bvid,
                title: audioInfo.title || '未命名视频',
                cover: audioInfo.cover || '',
                url: audioInfo.url,
                expiresAt: audioInfo.expiresAt as any,
                duration: (audioInfo as any).duration || 0,
            });
            setBvSongName(audioInfo.title || '未命名视频');
            setBvSinger(((audioInfo as any).author || '').replace(/\s+/g, ' ').trim());
            setBvTargetFavId(selectedFavId || favorites[0]?.id || null);
            setBvModalOpen(true);

            notifications.update({
                id: toastId,
                title: '已解析',
                message: '请选择歌单并编辑歌曲信息后确认',
                color: 'teal',
                loading: false,
                autoClose: 3000,
            });

            closeModal("globalSearchModal");
        } catch (err) {
            notifications.update({
                id: toastId,
                title: '解析失败',
                message: err instanceof Error ? err.message : '未知错误',
                color: 'red',
                loading: false,
                autoClose: 3000,
            });
        } finally {
            setResolvingBV(false);
        }
    };

    const handleSlicePreviewPlay = async () => {
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
        // 停止在 end 处，由 timeupdate 监听负责
    };

    const handleConfirmBVAdd = async () => {
        if (!bvPreview) return;
        const targetFavId = bvTargetFavId || favorites[0]?.id || null;
        const start = Math.max(0, sliceStart);
        // 如果用户设置了片段，使用片段的 end；否则使用歌曲总时长
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

            // 找到刚添加的歌曲用于加入歌单
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
    };

    useEffect(() => {
        if (!bvPreview) return;
        const duration = bvPreview.duration && bvPreview.duration > 0 ? bvPreview.duration : 0;
        setSliceStart(0);
        setSliceEnd(duration || 0);
        setSlicePreviewPosition(0);
        if (sliceAudioRef.current && bvPreview.url) {
            sliceAudioRef.current.src = bvPreview.url;
        }
    }, [bvPreview]);

    useEffect(() => {
        const audio = sliceAudioRef.current;
        if (!audio) return;
        const onTime = () => {
            if (isSlicePreviewing && sliceEnd > 0 && audio.currentTime >= sliceEnd - 0.05) {
                audio.pause();
                setIsSlicePreviewing(false);
            }
            setSlicePreviewPosition(audio.currentTime || 0);
        };
        audio.addEventListener("timeupdate", onTime);
        return () => {
            audio.removeEventListener("timeupdate", onTime);
        };
    }, [isSlicePreviewing, sliceEnd]);

    useEffect(() => {
        if (!isSlicePreviewing) return;
        const audio = sliceAudioRef.current;
        if (audio) {
            audio.currentTime = Math.max(0, sliceStart);
        }
    }, [sliceStart, isSlicePreviewing]);

    useEffect(() => {
        if (bvModalOpen) return;
        const audio = sliceAudioRef.current;
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
        setIsSlicePreviewing(false);
        setSlicePreviewPosition(0);
    }, [bvModalOpen]);

    return (
        <Box h="100vh" w="100vw" style={backgroundStyle}>
            {/* 顶部右侧设置按钮移动到工具栏，避免与主题按钮重叠 */}
            <ThemeManagerModal
                opened={modals.themeModal}
                onClose={() => closeModal("themeModal")}
                themes={themes}
                currentThemeId={currentThemeId}
                onSelectTheme={handleSelectTheme}
                onEditTheme={handleEditTheme}
                onDeleteTheme={handleDeleteTheme}
                onCreateTheme={handleCreateThemeClick}
                accentColor={themeColor}
            />

            <ThemeEditorModal
                opened={modals.themeEditorModal}
                onClose={handleCloseThemeEditor}
                onCancel={handleCloseThemeEditor}
                editingThemeId={editingThemeId}
                newThemeName={newThemeName}
                onNameChange={setNewThemeName}
                colorSchemeDraft={colorSchemeDraft}
                onColorSchemeChange={setColorSchemeDraft}
                themeColorDraft={themeColorDraft}
                onThemeColorChange={setThemeColorDraft}
                backgroundColorDraft={backgroundColorDraft}
                onBackgroundColorChange={setBackgroundColorDraft}
                backgroundOpacityDraft={backgroundOpacityDraft}
                onBackgroundOpacityChange={setBackgroundOpacityDraft}
                backgroundImageUrlDraft={backgroundImageUrlDraft}
                onBackgroundImageChange={setBackgroundImageUrlDraftSafe}
                onClearBackgroundImage={handleClearBackgroundImageDraft}
                panelColorDraft={panelColorDraft}
                onPanelColorChange={setPanelColorDraft}
                panelOpacityDraft={panelOpacityDraft}
                onPanelOpacityChange={setPanelOpacityDraft}
                onSubmit={handleSubmitTheme}
                savingTheme={savingTheme}
                fileInputRef={fileDraftInputRef}
                onBackgroundFileChange={handleBackgroundFileDraft}
            />

            <AddToFavoriteModal
                opened={modals.addFavoriteModal}
                onClose={() => closeModal("addFavoriteModal")}
                favorites={favorites}
                currentSong={currentSong}
                themeColor={themeColor}
                onAdd={handleAddToFavoriteFromModal}
            />

            <PlaylistModal
                opened={modals.playlistModal}
                onClose={() => closeModal("playlistModal")}
                queue={queue}
                currentIndex={currentIndex}
                themeColorHighlight={themeColorLight}
                onSelect={handlePlaylistSelect}
                onReorder={handlePlaylistReorder}
                onRemove={handlePlaylistRemove}
            />

            <Modal
                opened={modals.editFavModal}
                onClose={() => closeModal("editFavModal")}
                title="编辑歌单"
                centered
                size="sm"
            >
                <Stack gap="md">
                    <TextInput
                        label="歌单名称"
                        value={editingFavName}
                        onChange={(e) => setEditingFavName(e.currentTarget.value)}
                        placeholder="输入歌单名称"
                    />
                    <Group justify="flex-end" gap="sm">
                        <Button variant="subtle" color={themeColor} onClick={() => closeModal("editFavModal")}>
                            取消
                        </Button>
                        <Button color={themeColor} onClick={handleSaveEditFavorite}>
                            保存
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <LoginModal
                opened={modals.loginModal}
                onClose={() => closeModal("loginModal")}
                onLoginSuccess={async () => {
                    closeModal("loginModal");
                    try {
                        const info = await Services.GetUserInfo();
                        setUserInfo(info);
                        localStorage.setItem("tomorin.userInfo", JSON.stringify(info));
                        setStatus(`已登录: ${info.username}`);
                        notifications.show({
                            title: "登录成功",
                            message: `欢迎回来，${info.username}！`,
                            color: "green",
                        });
                    } catch (e) {
                        console.error("获取用户信息失败:", e);
                        setStatus("已登录");
                    }
                }}
            />

            {/* 设置弹窗 */}
            <Modal
                opened={modals.settingsModal}
                onClose={() => closeModal("settingsModal")}
                size="md"
                centered
                title="设置"
                overlayProps={{ blur: 10, opacity: 0.35 }}
            >
                <Stack gap="md">
                    <Text fw={600}>软件信息</Text>
                    <Text>Tomorin Player v{APP_VERSION}</Text>
                    <Text size="sm" c="dimmed">更好的 bilibili 音乐播放器</Text>

                    <Text fw={600} mt="sm">缓存</Text>
                    <Group>
                        <Button variant="default" onClick={async () => {
                            try {
                                await Services.Logout();
                            } catch { }
                            try {
                                localStorage.removeItem("tomorin.userInfo");
                            } catch { }
                            setUserInfo(null);
                            notifications.show({ title: "已清除登录缓存", message: "需要重新扫码登录", color: "green" });
                        }}>清除登录缓存</Button>
                        <Button variant="default" onClick={() => {
                            try {
                                // 置空主题缓存，促使下次加载走远端
                                localStorage.removeItem("tomorin.customThemes");
                                saveCachedCustomThemes([]);
                            } catch { }
                            notifications.show({ title: "已清除主题缓存", message: "已重置到默认主题", color: "green" });
                        }}>清除主题缓存</Button>
                        <Button variant="default" onClick={async () => {
                            try {
                                await Services.OpenDownloadsFolder();
                            } catch (e: any) {
                                notifications.show({ title: "打开失败", message: e?.message ?? String(e), color: "red" });
                            }
                        }}>在文件管理器中打开下载目录</Button>
                        <Button variant="default" onClick={async () => {
                            try {
                                await Services.ClearAudioCache();
                                setCacheSize(0);
                                notifications.show({ title: "已清除音乐缓存", message: "已删除所有离线音乐文件", color: "green" });
                            } catch (e) {
                                notifications.show({ title: "清除缓存失败", message: e instanceof Error ? e.message : "未知错误", color: "red" });
                            }
                        }}>清除音乐缓存 ({(cacheSize / 1024 / 1024).toFixed(2)} MB)</Button>
                        <Button color={themeColor} onClick={async () => {
                            try {
                                await Services.Logout();
                            } catch { }
                            try {
                                localStorage.clear();
                            } catch { }
                            setCacheSize(0);
                            setUserInfo(null);
                            notifications.show({ title: "已清除所有缓存", message: "请重新配置与登录", color: "green" });
                        }}>清除所有缓存</Button>
                    </Group>

                </Stack>
            </Modal>

            {/* 下载管理弹窗 */}
            <Modal
                opened={modals.downloadModal}
                onClose={() => { closeModal("downloadModal"); setConfirmDeleteDownloaded(false); setManagingSong(null); }}
                size="sm"
                centered
                title="下载文件管理"
                overlayProps={{ blur: 10, opacity: 0.35 }}
            >
                <Stack gap="md">
                    <Text fw={600}>{managingSong?.name || '未选择歌曲'}</Text>
                    <Group justify="space-between">
                        <Button variant="default" onClick={handleOpenDownloadedFile}>在文件管理器中打开</Button>
                        <Group gap="xs">
                            {!confirmDeleteDownloaded ? (
                                <Button variant="light" color="red" onClick={() => setConfirmDeleteDownloaded(true)}>删除下载文件</Button>
                            ) : (
                                <Button color="red" onClick={handleDeleteDownloadedFile}>确认删除</Button>
                            )}
                        </Group>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={modals.createFavModal}
                onClose={() => closeModal("createFavModal")}
                title="新建歌单"
                centered
                size="md"
                overlayProps={{ blur: 10, opacity: 0.35 }}
            >
                <Stack gap="sm">
                    <TextInput
                        label="歌单名称"
                        value={createFavName}
                        onChange={(e) => setCreateFavName(e.currentTarget.value)}
                        placeholder="输入歌单名"
                    />
                    <Select
                        label="创建方式"
                        data={[
                            { value: "blank", label: "新建空白歌单" },
                            { value: "duplicate", label: "复制已有歌单" },
                            { value: "importMine", label: "导入登录收藏夹 (需登录)" },
                            { value: "importFid", label: "通过 fid 导入公开收藏夹" },
                        ]}
                        value={createFavMode}
                        onChange={(val) => setCreateFavMode((val as any) || "blank")}
                    />
                    {createFavMode === "duplicate" && (
                        <Select
                            label="选择要复制的歌单"
                            placeholder={favorites.length ? "选择歌单" : "暂无歌单"}
                            data={favorites.map((f) => ({ value: f.id, label: `${f.title} (${f.songIds.length} 首)` }))}
                            value={duplicateSourceId}
                            onChange={(val) => setDuplicateSourceId(val)}
                            searchable
                            clearable
                        />
                    )}
                    {createFavMode === "importFid" && (
                        <TextInput
                            label="收藏夹 fid"
                            placeholder="输入 fid"
                            value={importFid}
                            onChange={(e) => setImportFid(e.currentTarget.value)}
                        />
                    )}
                    {createFavMode === "importMine" && (
                        <Text size="xs" c="dimmed">需要已登录 B 站账号。当前实现暂未接入后端接口。</Text>
                    )}
                    <Group justify="flex-end" mt="sm">
                        <Button variant="default" onClick={() => setCreateFavModalOpen(false)}>取消</Button>
                        <Button color={themeColor} onClick={handleSubmitCreateFavorite}>确认</Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={modals.globalSearchModal}
                onClose={() => closeModal("globalSearchModal")}
                size="lg"
                centered
                radius="md"
                padding="lg"
                title="搜索视频 (BV 号或链接)"
                overlayProps={{ blur: 10, opacity: 0.35 }}
            >
                <Stack gap="md">
                    <TextInput
                        placeholder="输入 BV 号或完整链接，如 BV1xx... 或 https://www.bilibili.com/video/BV..."
                        value={globalSearchTerm}
                        onChange={(e) => setGlobalSearchTerm(e.currentTarget.value)}
                        leftSection={<Search size={14} />}
                        leftSectionPointerEvents="none"
                        autoFocus
                        disabled={resolvingBV}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !resolvingBV) {
                                if (globalSearchResults.length > 0) {
                                    handleSearchResultClick(globalSearchResults[0]);
                                } else {
                                    handleResolveBVAndAdd();
                                }
                            }
                        }}
                    />
                    <ScrollArea h={380} type="auto">
                        {globalSearchResults.length === 0 && remoteResults.length === 0 ? (
                            <Stack gap="md" align="center" py="xl">
                                <Text c="dimmed" size="sm" ta="center">
                                    输入 BV 号或完整链接解析视频音频
                                </Text>
                                <Text c="dimmed" size="xs" ta="center">
                                    本地已有歌曲也会显示在这里
                                </Text>
                                {globalSearchTerm.trim() && (
                                    <Paper withBorder p="md" w="100%">
                                        <Group justify="space-between">
                                            <Stack gap={4}>
                                                <Text size="sm" fw={500}>解析并添加到歌单</Text>
                                                <Text size="xs" c="dimmed" lineClamp={1}>{globalSearchTerm}</Text>
                                            </Stack>
                                            <ActionIcon
                                                size="lg"
                                                variant="filled"
                                                color={themeColor}
                                                onClick={handleResolveBVAndAdd}
                                                loading={resolvingBV}
                                                disabled={resolvingBV}
                                            >
                                                <Search size={16} />
                                            </ActionIcon>
                                        </Group>
                                    </Paper>
                                )}
                                {globalSearchTerm.trim() && (
                                    <Button onClick={handleRemoteSearch} loading={remoteLoading} disabled={remoteLoading} variant="light">
                                        从 B站搜索：{globalSearchTerm}
                                    </Button>
                                )}
                            </Stack>
                        ) : (
                            <Stack gap="xs">
                                {globalSearchResults.map((item) => (
                                    <Paper
                                        key={item.kind === "song" ? `song-${item.song.id}` : `fav-${item.favorite.id}`}
                                        withBorder
                                        p="sm"
                                        shadow="xs"
                                        style={{ cursor: "pointer" }}
                                        onClick={() => handleSearchResultClick(item)}
                                    >
                                        <Group justify="space-between" align="flex-start">
                                            <Stack gap={4} style={{ flex: 1 }}>
                                                <Text fw={600} size="sm" lineClamp={1}>
                                                    {item.kind === "song" ? item.song.name || "未命名视频" : item.favorite.title || "未命名收藏夹"}
                                                </Text>
                                                <Text size="xs" c="dimmed" lineClamp={1}>
                                                    {item.kind === "song"
                                                        ? item.song.singer || item.song.singerId || "未知 UP"
                                                        : `fid: ${item.favorite.id} · 曲目数: ${item.favorite.songIds.length}`}
                                                </Text>
                                                {item.kind === "song" && item.song.bvid ? (
                                                    <Text size="xs" c="dimmed">BV: {item.song.bvid}</Text>
                                                ) : null}
                                            </Stack>
                                            <Badge color={item.kind === "song" ? "blue" : "violet"} variant="light">
                                                {item.kind === "song" ? "视频" : "收藏夹"}
                                            </Badge>
                                        </Group>
                                    </Paper>
                                ))}
                                {remoteResults.map((s) => (
                                    <Paper key={`remote-${s.bvid}-${s.name}`} withBorder p="sm" shadow="xs">
                                        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
                                            <AspectRatio ratio={16 / 9} w={120}>
                                                <Image
                                                    src={s.cover || undefined}
                                                    alt={s.name}
                                                    fit="cover"
                                                    radius="sm"
                                                    fallbackSrc="https://via.placeholder.com/160x90?text=No+Cover"
                                                />
                                            </AspectRatio>
                                            <Stack gap={4} style={{ flex: 1 }}>
                                                <Text fw={600} size="sm" lineClamp={1}>{s.name || '未命名视频'}</Text>
                                                <Text size="xs" c="dimmed" lineClamp={2}>{s.singer || '未知 UP'} · BV: {s.bvid}</Text>
                                            </Stack>
                                            <Group gap="xs">
                                                <Badge color="grape" variant="light">B站</Badge>
                                                <Button size="xs" variant="filled" onClick={() => handleAddFromRemote(s)}>添加到歌单</Button>
                                            </Group>
                                        </Group>
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </ScrollArea>
                </Stack>
            </Modal>

            <Modal
                opened={bvModalOpen}
                onClose={() => setBvModalOpen(false)}
                size="lg"
                centered
                title="添加到歌单"
                overlayProps={{ blur: 10, opacity: 0.35 }}
            >
                {bvPreview ? (
                    <Stack gap="md">
                        <AspectRatio ratio={16 / 9} w="100%">
                            {bvPreview.bvid ? (
                                <iframe
                                    title="bilibili-preview"
                                    src={`https://player.bilibili.com/player.html?bvid=${bvPreview.bvid}&high_quality=1&as_wide=1&autoplay=0`}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                                    allowFullScreen
                                    style={{ border: 0, width: "100%", height: "100%", borderRadius: 12 }}
                                />
                            ) : (
                                <Image
                                    src={bvPreview.cover || undefined}
                                    alt={bvPreview.title}
                                    fit="cover"
                                    w="100%"
                                    radius="md"
                                    fallbackSrc="https://via.placeholder.com/640x360?text=No+Cover"
                                />
                            )}
                        </AspectRatio>
                        <Stack gap="xs">
                            <Text fw={600}>{bvPreview.title}</Text>
                            <Text size="sm" c="dimmed">BV: {bvPreview.bvid}</Text>
                            <Text size="sm" c="dimmed">时长: {formatTime(bvPreview.duration)}</Text>
                        </Stack>
                        <Stack gap="xs">
                            <Text fw={600}>切片预览</Text>
                            <RangeSlider
                                min={0}
                                max={Math.max(bvPreview.duration || 0, sliceEnd || 0, 1)}
                                step={0.1}
                                value={[sliceStart, sliceEnd]}
                                onChange={([startVal, endVal]) => {
                                    const limit = bvPreview.duration && bvPreview.duration > 0 ? bvPreview.duration : Math.max(endVal, startVal);
                                    const safeStart = Math.max(0, Math.min(startVal, endVal, limit));
                                    const safeEnd = Math.max(safeStart, Math.min(endVal, limit));
                                    setSliceStart(safeStart);
                                    setSliceEnd(safeEnd);
                                    const nextPos = Math.min(Math.max(slicePreviewPosition, safeStart), safeEnd || safeStart);
                                    setSlicePreviewPosition(nextPos);
                                    if (isSlicePreviewing && sliceAudioRef.current) {
                                        sliceAudioRef.current.currentTime = nextPos;
                                    }
                                }}
                                label={(value) => formatTime(Number(value))}
                                color={themeColor}
                            />
                            <Slider
                                min={sliceStart}
                                max={Math.max(sliceEnd || sliceStart || 0, sliceStart + 0.1, 0.1)}
                                step={0.1}
                                value={slicePreviewPosition}
                                onChange={(value) => {
                                    const safe = Math.min(Math.max(value, sliceStart), Math.max(sliceEnd || sliceStart, sliceStart));
                                    setSlicePreviewPosition(safe);
                                    if (sliceAudioRef.current) {
                                        sliceAudioRef.current.currentTime = safe;
                                    }
                                }}
                                label={(value) => formatTime(Number(value))}
                                color={themeColor}
                            />
                            <Group gap="xs" align="flex-end">
                                <NumberInput
                                    label="开始 (秒)"
                                    min={0}
                                    max={Math.max(bvPreview.duration || 0, sliceEnd || 0, 1)}
                                    step={0.5}
                                    value={sliceStart}
                                    onChange={(value) => {
                                        const v = Number(value) || 0;
                                        const limit = bvPreview.duration && bvPreview.duration > 0 ? bvPreview.duration : Math.max(sliceEnd, v);
                                        const safeStart = Math.max(0, Math.min(v, limit));
                                        const safeEnd = Math.max(safeStart, Math.min(sliceEnd, limit));
                                        setSliceStart(safeStart);
                                        setSliceEnd(safeEnd);
                                        const nextPos = Math.min(Math.max(slicePreviewPosition, safeStart), safeEnd || safeStart);
                                        setSlicePreviewPosition(nextPos);
                                        if (isSlicePreviewing && sliceAudioRef.current) {
                                            sliceAudioRef.current.currentTime = nextPos;
                                        }
                                    }}
                                    formatter={(val) => (val === undefined || val === null ? "0" : `${val}`)}
                                />
                                <NumberInput
                                    label="结束 (秒)"
                                    min={0}
                                    max={Math.max(bvPreview.duration || 0, sliceEnd || 0, 1)}
                                    step={0.5}
                                    value={sliceEnd}
                                    onChange={(value) => {
                                        const v = Number(value) || 0;
                                        const limit = bvPreview.duration && bvPreview.duration > 0 ? bvPreview.duration : Math.max(v, sliceStart);
                                        const safeEnd = Math.max(sliceStart, Math.min(v, limit));
                                        setSliceEnd(safeEnd);
                                        const nextPos = Math.min(Math.max(slicePreviewPosition, sliceStart), safeEnd || sliceStart);
                                        setSlicePreviewPosition(nextPos);
                                        if (isSlicePreviewing && sliceAudioRef.current) {
                                            sliceAudioRef.current.currentTime = nextPos;
                                        }
                                    }}
                                    formatter={(val) => (val === undefined || val === null ? "0" : `${val}`)}
                                />
                                <Button variant="light" onClick={handleSlicePreviewPlay} disabled={!bvPreview.url} color={themeColor}>
                                    {isSlicePreviewing ? '停止预览' : '预览片段'}
                                </Button>
                            </Group>
                            <Text size="xs" c="dimmed">基于音频流实时预览，播放到结束时间自动停止。</Text>
                            <audio ref={sliceAudioRef} style={{ display: "none" }} />
                        </Stack>
                        <Stack gap="xs">
                            <Select
                                label="加入歌单"
                                placeholder={favorites.length === 0 ? '暂无歌单' : '选择歌单'}
                                data={favorites.map((f) => ({ value: f.id, label: f.title }))}
                                value={bvTargetFavId}
                                onChange={(val) => setBvTargetFavId(val)}
                                clearable={favorites.length === 0}
                            />
                            <Group align="flex-end" wrap="nowrap" gap="xs">
                                <TextInput
                                    label="新建歌单"
                                    placeholder="输入名称后点击创建"
                                    value={newFavName}
                                    onChange={(e) => setNewFavName(e.currentTarget.value)}
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    variant="light"
                                    onClick={async () => {
                                        const name = newFavName.trim();
                                        if (!name) return;
                                        try {
                                            await Services.SaveFavorite({ id: '', title: name, songIds: [] } as any);
                                            const refreshedFavs = await Services.ListFavorites();
                                            setFavorites(refreshedFavs);
                                            const targetId = refreshedFavs.find((f) => f.title === name)?.id || refreshedFavs[refreshedFavs.length - 1]?.id || null;
                                            setBvTargetFavId(targetId);
                                            notifications.show({ title: '已创建歌单', message: name, color: 'green' });
                                            setNewFavName('');
                                        } catch (error) {
                                            notifications.show({ title: '创建歌单失败', message: String(error), color: 'red' });
                                        }
                                    }}
                                >
                                    创建
                                </Button>
                            </Group>
                            <TextInput
                                label="歌曲名"
                                value={bvSongName}
                                onChange={(e) => setBvSongName(e.currentTarget.value)}
                            />
                            <TextInput
                                label="歌手"
                                value={bvSinger}
                                onChange={(e) => setBvSinger(e.currentTarget.value)}
                                placeholder="默认使用视频 UP/联合投稿"
                            />
                        </Stack>
                        <Group justify="flex-end">
                            <Button variant="default" onClick={() => setBvModalOpen(false)}>
                                取消
                            </Button>
                            <Button color={themeColor} onClick={handleConfirmBVAdd}>
                                确认添加
                            </Button>
                        </Group>
                    </Stack>
                ) : (
                    <Text c="dimmed">暂无预览数据</Text>
                )}
            </Modal>

            <Flex direction="column" h="100%" gap="sm" p="sm" style={{ overflow: "hidden" }}>
                <TopBar
                    userInfo={userInfo}
                    hitokoto={hitokoto}
                    onSearchClick={() => {
                        setGlobalSearchTerm("");
                        openModal("globalSearchModal");
                    }}
                    onThemeClick={() => {
                        setThemeColorDraft(themeColor);
                        setBackgroundColorDraft(backgroundColor);
                        setBackgroundOpacityDraft(backgroundOpacity);
                        setBackgroundImageUrlDraftSafe(backgroundImageUrl);
                        setPanelColorDraft(panelColor);
                        setPanelOpacityDraft(panelOpacity);
                        openModal("themeModal");
                    }}
                    onSettingsClick={() => openModal("settingsModal")}
                    onLoginClick={() => openModal("loginModal")}
                    onLogout={() => {
                        setUserInfo(null);
                        setStatus("已退出登录");
                    }}
                />

                <MainLayout
                    currentSong={currentSong}
                    panelBackground={panelBackground}
                    themeColor={themeColor}
                    computedColorScheme={computedColorScheme}
                    placeholderCover={PLACEHOLDER_COVER}
                    maxSkipLimit={maxSkipLimit}
                    formatTime={formatTime}
                    formatTimeLabel={formatTimeLabel}
                    parseTimeLabel={parseTimeLabel}
                    onIntervalChange={handleIntervalChange}
                    onSkipStartChange={handleSkipStartChange}
                    onSkipEndChange={handleSkipEndChange}
                    onStreamUrlChange={handleStreamUrlChange}
                    currentFav={currentFav}
                    currentFavSongs={currentFavSongs}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onPlaySong={playSong}
                    onAddSong={addSong}
                    downloadedSongIds={downloadedSongIds}
                    onDownloadSong={handleDownloadSong}
                    onAddSongToFavorite={handleAddSongToFavorite}
                    onRemoveSongFromPlaylist={handleRemoveSongFromPlaylist}
                    confirmRemoveSongId={confirmRemoveSongId}
                    onToggleConfirmRemove={setConfirmRemoveSongId}
                    onPlayAll={() => {
                        if (currentFav) {
                            playFavorite(currentFav);
                        }
                    }}
                    onDownloadAll={() => {
                        if (currentFav) {
                            handleDownloadAllFavorite(currentFav);
                        }
                    }}
                    favorites={favorites}
                    selectedFavId={selectedFavId}
                    onSelectFavorite={(id) => {
                        setSelectedFavId(id);
                        setConfirmDeleteFavId(null);
                    }}
                    onPlayFavorite={playFavorite}
                    onPlaySongInFavorite={(song) => {
                        const fav = currentFav || favorites.find(f => f.songIds.some(ref => ref.songId === song.id));
                        playSingleSong(song, fav);
                    }}
                    onAddCurrentToFavorite={addCurrentToFavorite}
                    onCreateFavorite={createFavorite}
                    onEditFavorite={handleEditFavorite}
                    onDeleteFavorite={handleDeleteFavorite}
                    onToggleConfirmDelete={setConfirmDeleteFavId}
                    confirmDeleteFavId={confirmDeleteFavId}
                />

                <ControlsPanel
                    themeColor={themeColor}
                    computedColorScheme={computedColorScheme}
                    currentSong={currentSong}
                    cover={currentSong?.cover}
                    progressInInterval={progressInInterval}
                    intervalStart={intervalStart}
                    intervalLength={intervalLength}
                    duration={duration}
                    formatTime={formatTime}
                    seek={seek}
                    playPrev={playPrev}
                    togglePlay={togglePlay}
                    playNext={playNext}
                    isPlaying={isPlaying}
                    playMode={playMode}
                    onTogglePlayMode={handlePlayModeToggle}
                    onAddToFavorite={() => openModal("addFavoriteModal")}
                    onShowPlaylist={() => openModal("playlistModal")}
                    onDownload={handleDownload}
                    isDownloaded={isDownloaded}
                    volume={volume}
                    changeVolume={changeVolume}
                    songsCount={songs.length}
                    panelBackground={panelBackground}
                />
            </Flex>
        </Box>
    );
};

export default App;
