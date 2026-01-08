/**
 * useThemeManagement - 主题管理逻辑聚合
 * 将 App.tsx 中分散的主题编辑、应用和缓存逻辑集中到一个 Hook
 */

import { useCallback, useRef } from 'react';
import { useMantineColorScheme } from '@mantine/core';
import { Theme } from '../../types';
import { DEFAULT_THEMES } from '../../utils/constants';

interface UseThemeManagementProps {
    themes: Theme[];
    setThemes: (themes: Theme[]) => void;
    currentThemeId: string | null;
    setCurrentThemeId: (id: string | null) => void;
    // 所有主题状态设置函数
    setters: {
        setColorScheme: (v: 'light' | 'dark') => void;
        setThemeColor: (v: string) => void;
        setBackgroundColor: (v: string) => void;
        setBackgroundOpacity: (v: number) => void;
        setBackgroundImageUrl: (v: string) => void;
        setBackgroundBlur: (v: number) => void;
        setPanelColor: (v: string) => void;
        setPanelOpacity: (v: number) => void;
        setPanelBlur: (v: number) => void;
        setPanelRadius: (v: number) => void;
        setControlColor: (v: string) => void;
        setControlOpacity: (v: number) => void;
        setControlBlur: (v: number) => void;
        setTextColorPrimary: (v: string) => void;
        setTextColorSecondary: (v: string) => void;
        setFavoriteCardColor: (v: string) => void;
        setCardOpacity: (v: number) => void;
        setModalRadius: (v: number) => void;
        setNotificationRadius: (v: number) => void;
        setComponentRadius: (v: number) => void;
        setCoverRadius: (v: number) => void;
        setModalColor: (v: string) => void;
        setModalOpacity: (v: number) => void;
        setModalBlur: (v: number) => void;
        setWindowControlsPos: (v: string) => void;
    };
    skipPersistRef: React.MutableRefObject<boolean>;
}

export const useThemeManagement = ({
    themes,
    setThemes,
    currentThemeId,
    setCurrentThemeId,
    setters,
    skipPersistRef,
}: UseThemeManagementProps) => {
    const { setColorScheme } = useMantineColorScheme();

    // 从状态中提取自定义主题（非默认）
    const getCustomThemes = useCallback(() => {
        return themes.filter((t) => !t.isDefault);
    }, [themes]);

    // 保存自定义主题到 localStorage
    const saveCachedCustomThemes = useCallback((themesToCache: Theme[]) => {
        try {
            localStorage.setItem('half-beat.customThemes', JSON.stringify(themesToCache));
        } catch (e) {
            console.warn('保存自定义主题缓存失败', e);
        }
    }, []);

    // 应用主题到 UI（并跳过一次持久化防抖）
    const applyTheme = useCallback((theme: Theme) => {
        const backgroundBlurValue = theme.backgroundBlur ?? 0;
        const panelBlurValue = theme.panelBlur ?? 0;
        const panelRadiusValue = theme.panelRadius ?? 8;
        const modalRadiusValue = theme.modalRadius ?? 8;
        const notificationRadiusValue = theme.notificationRadius ?? 8;
        const windowControlsPosValue = theme.windowControlsPos ?? 'right';

        setCurrentThemeId(theme.id);
        skipPersistRef.current = true;

        setters.setColorScheme((theme.colorScheme as 'light' | 'dark') || 'dark');
        setters.setThemeColor(theme.themeColor || '#1f77f0');
        setters.setBackgroundColor(theme.backgroundColor || '#0a0e27');
        setters.setBackgroundOpacity(theme.backgroundOpacity ?? 1);
        setters.setBackgroundImageUrl(theme.backgroundImage || '');
        setters.setBackgroundBlur(backgroundBlurValue);
        setters.setPanelColor(theme.panelColor || '#1a1f3a');
        setters.setPanelOpacity(theme.panelOpacity ?? 0.6);
        setters.setPanelBlur(panelBlurValue);
        setters.setPanelRadius(panelRadiusValue);
        setters.setControlColor(theme.controlColor || theme.panelColor || '#2a2f4a');
        setters.setControlOpacity(theme.controlOpacity ?? 1);
        setters.setControlBlur(theme.controlBlur ?? 0);
        setters.setTextColorPrimary(theme.textColorPrimary || '#ffffff');
        setters.setTextColorSecondary(theme.textColorSecondary || '#909296');
        setters.setFavoriteCardColor(theme.favoriteCardColor || theme.panelColor || '#2a2f4a');
        setters.setCardOpacity(theme.cardOpacity ?? 0.5);
        setters.setModalRadius(modalRadiusValue);
        setters.setNotificationRadius(notificationRadiusValue);
        setters.setComponentRadius(theme.componentRadius ?? 6);
        setters.setCoverRadius(theme.coverRadius ?? 4);
        setters.setModalColor(theme.modalColor || theme.panelColor || '#1a1f3a');
        setters.setModalOpacity(theme.modalOpacity ?? 0.95);
        setters.setModalBlur(theme.modalBlur ?? 10);
        setters.setWindowControlsPos(windowControlsPosValue);
    }, [setCurrentThemeId, setters, skipPersistRef]);

    return {
        getCustomThemes,
        saveCachedCustomThemes,
        applyTheme,
    };
};
