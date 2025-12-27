import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { MantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { Theme } from '../types';
import { DEFAULT_THEMES } from '../utils/constants';

// ========== 类型定义 ==========
export interface ThemeState {
    themes: Theme[];
    currentThemeId: string | null;
    themeColor: string;
    backgroundColor: string;
    backgroundOpacity: number;
    backgroundImageUrl: string;
    panelColor: string;
    panelOpacity: number;
    computedColorScheme: MantineColorScheme;
}

export interface ThemeActions {
    setThemes: (themes: Theme[]) => void;
    setCurrentThemeId: (id: string | null) => void;
    setThemeColor: (color: string) => void;
    setBackgroundColor: (color: string) => void;
    setBackgroundOpacity: (opacity: number) => void;
    setBackgroundImageUrl: (url: string) => void;
    setPanelColor: (color: string) => void;
    setPanelOpacity: (opacity: number) => void;

    // 工具方法
    applyTheme: (theme: Theme) => void;
    setBackgroundImageUrlSafe: (url: string) => void;
}

export interface ThemeContextValue {
    state: ThemeState;
    actions: ThemeActions;
}

// ========== Context 创建 ==========
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ========== Provider 组件 ==========
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // 获取 Mantine 计算的颜色方案
    const computedColorScheme = useComputedColorScheme('light');

    // ========== State ==========
    const defaultTheme = computedColorScheme === "dark" ? DEFAULT_THEMES.find(t => t.id === "dark")! : DEFAULT_THEMES.find(t => t.id === "light")!;

    const [themes, setThemes] = useState<Theme[]>(DEFAULT_THEMES);
    const [currentThemeId, setCurrentThemeId] = useState<string | null>(defaultTheme.id);
    const [themeColor, setThemeColor] = useState(defaultTheme.themeColor);
    const [backgroundColor, setBackgroundColor] = useState(defaultTheme.backgroundColor);
    const [backgroundOpacity, setBackgroundOpacity] = useState(defaultTheme.backgroundOpacity);
    const [backgroundImageUrl, setBackgroundImageUrl] = useState(defaultTheme.backgroundImage || "");
    const [panelColor, setPanelColor] = useState(defaultTheme.panelColor);
    const [panelOpacity, setPanelOpacity] = useState(defaultTheme.panelOpacity);

    // ========== Actions ==========

    /**
     * 应用主题
     */
    const applyTheme = useCallback((theme: Theme) => {
        setThemeColor(theme.themeColor);
        setBackgroundColor(theme.backgroundColor);
        setBackgroundOpacity(theme.backgroundOpacity);
        // 使用后端模型字段名 backgroundImage
        setBackgroundImageUrl(theme.backgroundImage || "");
        setPanelColor(theme.panelColor);
        setPanelOpacity(theme.panelOpacity);
        setCurrentThemeId(theme.id);

        // 保存到 localStorage
        localStorage.setItem('currentThemeId', theme.id);
        localStorage.setItem('themeColor', theme.themeColor);
        localStorage.setItem('backgroundColor', theme.backgroundColor);
        localStorage.setItem('backgroundOpacity', theme.backgroundOpacity.toString());
        localStorage.setItem('backgroundImageUrl', theme.backgroundImage || "");
        localStorage.setItem('panelColor', theme.panelColor);
        localStorage.setItem('panelOpacity', theme.panelOpacity.toString());
    }, []);

    /**
     * 安全设置背景图片 URL
     */
    const setBackgroundImageUrlSafe = useCallback((url: string) => {
        const trimmedUrl = url.trim();

        // 验证 URL 格式：允许 http://, https://, 和 data: URLs
        if (trimmedUrl &&
            !trimmedUrl.startsWith('http://') &&
            !trimmedUrl.startsWith('https://') &&
            !trimmedUrl.startsWith('data:')) {
            console.warn('Invalid background image URL:', trimmedUrl);
            return;
        }

        setBackgroundImageUrl(trimmedUrl);
        localStorage.setItem('backgroundImageUrl', trimmedUrl);
    }, []);

    // ========== Effect: 从 localStorage 加载主题设置 ==========
    useEffect(() => {
        const savedThemeColor = localStorage.getItem('themeColor');
        const savedBackgroundColor = localStorage.getItem('backgroundColor');
        const savedBackgroundOpacity = localStorage.getItem('backgroundOpacity');
        const savedBackgroundImageUrl = localStorage.getItem('backgroundImageUrl');
        const savedPanelColor = localStorage.getItem('panelColor');
        const savedPanelOpacity = localStorage.getItem('panelOpacity');
        const savedThemeId = localStorage.getItem('currentThemeId');

        if (savedThemeColor) setThemeColor(savedThemeColor);
        if (savedBackgroundColor) setBackgroundColor(savedBackgroundColor);
        if (savedBackgroundOpacity) setBackgroundOpacity(parseFloat(savedBackgroundOpacity));
        if (savedBackgroundImageUrl !== null) setBackgroundImageUrl(savedBackgroundImageUrl);
        if (savedPanelColor) setPanelColor(savedPanelColor);
        if (savedPanelOpacity) setPanelOpacity(parseFloat(savedPanelOpacity));
        if (savedThemeId) setCurrentThemeId(savedThemeId);
    }, []);

    // 当主题列表或当前主题为空时，自动应用默认主题，避免空白/残留背景
    useEffect(() => {
        const themeList = themes.length ? themes : DEFAULT_THEMES;
        const savedThemeId = localStorage.getItem('currentThemeId');
        const targetTheme = themeList.find(t => t.id === (savedThemeId || currentThemeId))
            || themeList[0]
            || DEFAULT_THEMES[0];

        if (!currentThemeId || currentThemeId !== targetTheme.id || backgroundImageUrl !== (targetTheme.backgroundImage || "")) {
            applyTheme(targetTheme);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [themes]);

    // ========== Context Value ==========
    const value: ThemeContextValue = {
        state: {
            themes,
            currentThemeId,
            themeColor,
            backgroundColor,
            backgroundOpacity,
            backgroundImageUrl,
            panelColor,
            panelOpacity,
            computedColorScheme,
        },
        actions: {
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
        },
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// ========== Hook ==========
export const useThemeContext = (): ThemeContextValue => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useThemeContext must be used within ThemeProvider');
    }
    return context;
};
