/**
 * 主题管理 Hook
 * 管理应用主题、颜色方案和背景设置
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import type { Theme } from '../../types';
import { storage, STORAGE_KEYS } from '../../utils/storage';
import { DEFAULT_THEMES } from '../../utils/constants';
import { normalizeThemeImageUrl } from '../../utils/image';

export interface UseThemeReturn {
    // 主题列表
    themes: Theme[];
    currentThemeId: string;
    defaultThemes: Theme[];

    // 颜色设置
    themeColor: string;
    backgroundColor: string;
    backgroundOpacity: number;
    backgroundImageUrl: string;
    panelColor: string;
    panelOpacity: number;
    computedColorScheme: string;

    // 操作方法
    setThemes: React.Dispatch<React.SetStateAction<Theme[]>>;
    setCurrentThemeId: React.Dispatch<React.SetStateAction<string>>;
    setThemeColor: React.Dispatch<React.SetStateAction<string>>;
    setBackgroundColor: React.Dispatch<React.SetStateAction<string>>;
    setBackgroundOpacity: React.Dispatch<React.SetStateAction<number>>;
    setBackgroundImageUrl: React.Dispatch<React.SetStateAction<string>>;
    setPanelColor: React.Dispatch<React.SetStateAction<string>>;
    setPanelOpacity: React.Dispatch<React.SetStateAction<number>>;

    applyTheme: (theme: Theme) => void;
    setBackgroundImageUrlSafe: (url: string) => void;
}

export const useTheme = () => {
    const { setColorScheme } = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme('light');
    const skipPersistRef = useRef(false);

    const [themes, setThemes] = useState<Theme[]>(DEFAULT_THEMES);
    const [currentThemeId, setCurrentThemeId] = useState<string>('light');
    const [themeColor, setThemeColor] = useState<string>('#228be6');
    const [backgroundColor, setBackgroundColor] = useState<string>(
        computedColorScheme === 'dark' ? '#0b1021' : '#f8fafc'
    );
    const [backgroundOpacity, setBackgroundOpacity] = useState<number>(1);
    const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('');
    const [panelColor, setPanelColor] = useState<string>(
        computedColorScheme === 'dark' ? '#1f2937' : '#ffffff'
    );
    const [panelOpacity, setPanelOpacity] = useState<number>(0.92);

    // 应用主题
    const applyTheme = useCallback((theme: Theme) => {
        skipPersistRef.current = true;
        setCurrentThemeId(theme.id);
        setThemeColor(theme.themeColor || '#ffffff');
        setBackgroundColor(theme.backgroundColor || '#ffffff');
        setBackgroundOpacity(theme.backgroundOpacity ?? 1);
        setBackgroundImageUrl(normalizeThemeImageUrl(theme.backgroundImage || ''));
        setPanelColor(theme.panelColor || '#ffffff');
        setPanelOpacity(theme.panelOpacity ?? 0.92);
        if (theme.colorScheme && (theme.colorScheme === 'light' || theme.colorScheme === 'dark')) {
            setColorScheme(theme.colorScheme as 'light' | 'dark');
        }
    }, [setColorScheme]);

    // 安全设置背景图片（直接设置，不需要避免重复）
    const setBackgroundImageUrlSafe = useCallback((url: string) => {
        setBackgroundImageUrl(normalizeThemeImageUrl(url));
    }, []);

    // 缓存自定义主题
    const loadCachedCustomThemes = useCallback((): Theme[] | null => {
        return storage.get<Theme[]>(STORAGE_KEYS.CUSTOM_THEMES);
    }, []);

    const saveCachedCustomThemes = useCallback((themesToCache: Theme[]) => {
        storage.set(STORAGE_KEYS.CUSTOM_THEMES, themesToCache);
    }, []);

    const getCustomThemesFromState = useCallback((allThemes: Theme[]) => {
        return allThemes.filter((t) => !t.isDefault && !t.isReadOnly);
    }, []);

    return {
        themes,
        currentThemeId,
        defaultThemes: DEFAULT_THEMES,
        themeColor,
        backgroundColor,
        backgroundOpacity,
        backgroundImageUrl,
        panelColor,
        panelOpacity,
        computedColorScheme,

        setThemes,
        setCurrentThemeId,
        setThemeColor,
        setBackgroundColor,
        setBackgroundOpacity,
        setBackgroundImageUrl,
        setPanelColor,
        setPanelOpacity,

        applyTheme,
        setBackgroundImageUrlSafe,
        loadCachedCustomThemes,
        saveCachedCustomThemes,
        getCustomThemesFromState,
    };
};
