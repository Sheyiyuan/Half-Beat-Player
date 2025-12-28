import { useEffect, useRef, useCallback } from 'react';
import type { PlayerSetting } from '../../types';
import * as Services from '../../../wailsjs/go/services/Service';

interface UseSettingsPersistenceProps {
    setting: PlayerSetting | null;
    playMode: string;
    volume: number;
    currentThemeId: string;
    themeColor: string;
    backgroundColor: string;
    backgroundOpacity: number;
    backgroundImageUrl: string;
    panelOpacity: number;
    setSetting: (setting: PlayerSetting) => void;
    skipPersistRef: React.MutableRefObject<boolean>;
}

export const useSettingsPersistence = ({
    setting,
    playMode,
    volume,
    currentThemeId,
    themeColor,
    backgroundColor,
    backgroundOpacity,
    backgroundImageUrl,
    panelOpacity,
    setSetting,
    skipPersistRef,
}: UseSettingsPersistenceProps) => {
    // 标记设置是否已完成加载，供其他模块判断
    const settingsLoadedRef = useRef(false);
    // 使用 ref 同步最新的设置状态，立即同步而非依赖 useEffect
    const settingsRef = useRef({ setting, playMode, volume, currentThemeId, themeColor, backgroundColor, backgroundOpacity, backgroundImageUrl, panelOpacity });
    // 立即同步更新 ref，不等待 useEffect
    settingsRef.current = { setting, playMode, volume, currentThemeId, themeColor, backgroundColor, backgroundOpacity, backgroundImageUrl, panelOpacity };

    /**
     * 持久化设置到后端
     */
    const persistSettings = useCallback(async (partial: Partial<PlayerSetting>) => {
        // 初始化阶段或未加载完成时不进行保存
        if (skipPersistRef.current || !settingsLoadedRef.current) {
            return;
        }
        const s = settingsRef.current;
        const next = {
            id: s.setting?.id ?? 1,
            playMode: s.playMode,
            defaultVolume: s.volume,
            themes: s.setting?.themes ?? "",
            currentThemeId: s.currentThemeId,
            themeColor: s.themeColor,
            backgroundColor: s.backgroundColor,
            backgroundOpacity: s.backgroundOpacity,
            backgroundImage: s.backgroundImageUrl,
            panelOpacity: s.panelOpacity,
            updatedAt: new Date().toISOString(),
            ...partial,
        } as PlayerSetting;
        setSetting(next);
        try {
            await Services.SavePlayerSetting(next as any);
        } catch (err) {
            console.error("保存设置失败", err);
        }
    }, [setSetting]);

    // 自动保存设置（防抖）
    useEffect(() => {
        // 跳过初始化期间或设置未加载完成时的保存
        if (skipPersistRef.current || !settingsLoadedRef.current) {
            return;
        }
        // 使用 setTimeout 防抖
        const timeoutId = setTimeout(() => {
            persistSettings({});
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [playMode, volume, currentThemeId, themeColor, backgroundColor, backgroundOpacity, backgroundImageUrl, panelOpacity, skipPersistRef, persistSettings]);

    // 关闭软件时：同步设置到后端并清理前端缓存
    useEffect(() => {
        const handleBeforeUnload = async () => {
            // 显式保护：初始化或未加载完成时不保存
            if (skipPersistRef.current || !settingsLoadedRef.current) {
                return;
            }
            try {
                await persistSettings({});
            } catch { }
            try {
                localStorage.removeItem("half-beat.userInfo");
                localStorage.removeItem("half-beat.customThemes");
            } catch { }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [persistSettings]);

    return {
        persistSettings,
        settingsLoadedRef,
    };
};
