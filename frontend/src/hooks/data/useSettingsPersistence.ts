import { useEffect, useRef } from 'react';
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
    const settingsLoadedRef = useRef(false);

    /**
     * 持久化设置到后端
     */
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

    // 自动保存设置（防抖）
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
    }, [playMode, volume, themeColor, backgroundColor, backgroundOpacity, backgroundImageUrl, panelOpacity]);

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

    return {
        persistSettings,
        settingsLoadedRef,
    };
};
