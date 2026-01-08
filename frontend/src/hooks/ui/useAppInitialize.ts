/**
 * useAppInitialize Hook
 * 
 * 应用启动时的初始化逻辑集中管理
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../useAppStore';
import type { AppStore, AppActions } from '../../store/types';
import * as Services from '../../../wailsjs/go/services/Service';

interface InitProgressInfo {
    step: 'idle' | 'loading_user' | 'loading_theme' | 'loading_playlist' | 'initializing_player' | 'ready' | 'error';
    message: string;
    progress: number;
}

export interface UseAppInitializeOptions {
    onProgressChange?: (progress: InitProgressInfo) => void;
    enableAutoRestore?: boolean;
}

export function useAppInitialize(options: UseAppInitializeOptions = {}) {
    const {
        onProgressChange,
        enableAutoRestore = true,
    } = options;

    const [store, actions] = useAppStore() as [AppStore, AppActions];

    const initRef = useRef({
        isInitialized: false,
        isInitializing: false,
        abortController: null as AbortController | null,
    });

    const updateProgress = useCallback((step: InitProgressInfo['step'], message: string, progress: number) => {
        onProgressChange?.({
            step,
            message,
            progress,
        });
    }, [onProgressChange]);

    const loadUserInfo = useCallback(async (signal: AbortSignal) => {
        try {
            updateProgress('loading_user', '正在加载用户信息...', 10);
            if (signal.aborted) return false;

            const userInfo = await Services.GetUserInfo();
            if (userInfo) {
                actions.setUserInfo({
                    uid: (userInfo as any).uid || 0,
                    username: (userInfo as any).username || '未知用户',
                    face: (userInfo as any).face || '',
                    level: (userInfo as any).level || 0,
                    vipType: (userInfo as any).vipType || 0,
                });
                console.log('[useAppInitialize] 用户信息已加载');
                return true;
            }
            return false;
        } catch (err) {
            console.warn('[useAppInitialize] 加载用户信息失败:', err);
            return false;
        }
    }, [actions, updateProgress]);

    const loadThemeConfig = useCallback(async (signal: AbortSignal) => {
        try {
            updateProgress('loading_theme', '正在加载主题配置...', 30);
            if (signal.aborted) return false;

            const cachedTheme = localStorage.getItem('half-beat.theme');
            if (cachedTheme) {
                try {
                    const theme = JSON.parse(cachedTheme);
                    actions.applyTheme(theme);
                    return true;
                } catch (e) {
                    console.warn('[useAppInitialize] 本地主题缓存解析失败');
                }
            }

            const themes = await Services.GetThemes();
            if (themes && themes.length > 0) {
                const defaultTheme = themes.find((t: any) => t.isDefault);
                if (defaultTheme) {
                    actions.applyTheme(defaultTheme);
                    return true;
                }
            }
            return false;
        } catch (err) {
            console.warn('[useAppInitialize] 加载主题失败:', err);
            return false;
        }
    }, [actions, updateProgress]);

    const loadPlaylist = useCallback(async (signal: AbortSignal) => {
        try {
            updateProgress('loading_playlist', '正在加载播放列表...', 60);
            if (signal.aborted) return false;

            if (enableAutoRestore) {
                const cachedPlaylist = localStorage.getItem('half-beat.playlist');
                if (cachedPlaylist) {
                    try {
                        const playlist = JSON.parse(cachedPlaylist);
                        if (playlist.songs && Array.isArray(playlist.songs) && playlist.songs.length > 0) {
                            actions.setQueue(playlist.songs);
                            actions.setCurrentIndex(playlist.currentIndex || 0);
                            return true;
                        }
                    } catch (e) {
                        console.warn('[useAppInitialize] 本地播放列表解析失败');
                    }
                }
            }
            return false;
        } catch (err) {
            console.warn('[useAppInitialize] 加载播放列表失败:', err);
            return false;
        }
    }, [actions, enableAutoRestore, updateProgress]);

    const initializePlayerState = useCallback((signal: AbortSignal) => {
        try {
            updateProgress('initializing_player', '正在初始化播放器...', 85);
            if (signal.aborted) return false;

            if (store.player.queue.length === 0) {
                actions.setCurrentIndex(0);
                actions.setIsPlaying(false);
            }
            return true;
        } catch (err) {
            console.warn('[useAppInitialize] 初始化播放器状态失败:', err);
            return false;
        }
    }, [store.player.queue.length, actions, updateProgress]);

    const performInitialization = useCallback(async (signal: AbortSignal) => {
        try {
            if (initRef.current.isInitializing) return false;

            initRef.current.isInitializing = true;
            updateProgress('loading_user', '开始应用初始化...', 0);

            await loadUserInfo(signal);
            if (signal.aborted) throw new Error('Initialization aborted');

            await loadThemeConfig(signal);
            if (signal.aborted) throw new Error('Initialization aborted');

            await loadPlaylist(signal);
            if (signal.aborted) throw new Error('Initialization aborted');

            initializePlayerState(signal);
            if (signal.aborted) throw new Error('Initialization aborted');

            updateProgress('ready', '应用初始化完成', 100);
            initRef.current.isInitialized = true;
            console.log('[useAppInitialize] 应用初始化完成');

            return true;
        } catch (err) {
            if ((err as Error).message !== 'Initialization aborted') {
                console.error('[useAppInitialize] 初始化失败:', err);
                updateProgress('error', '应用初始化失败', 0);
            }
            return false;
        } finally {
            initRef.current.isInitializing = false;
        }
    }, [
        loadUserInfo,
        loadThemeConfig,
        loadPlaylist,
        initializePlayerState,
        updateProgress,
    ]);

    const triggerInit = useCallback(async () => {
        if (initRef.current.abortController) {
            initRef.current.abortController.abort();
        }
        initRef.current.abortController = new AbortController();
        return performInitialization(initRef.current.abortController.signal);
    }, [performInitialization]);

    const restart = useCallback(async () => {
        console.log('[useAppInitialize] 重新启动初始化流程');
        initRef.current.isInitialized = false;
        return triggerInit();
    }, [triggerInit]);

    useEffect(() => {
        if (!initRef.current.isInitialized && !initRef.current.isInitializing) {
            triggerInit();
        }

        return () => {
            if (initRef.current.abortController) {
                initRef.current.abortController.abort();
            }
        };
    }, [triggerInit]);

    return {
        initState: {
            isInitialized: initRef.current.isInitialized,
            isInitializing: initRef.current.isInitializing,
        },
        triggerInit,
        restart,
    };
}

export default useAppInitialize;
