import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Theme } from '../types';
import { MantineColorScheme, useComputedColorScheme } from '@mantine/core';

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
    const [themes, setThemes] = useState<Theme[]>([]);
    const [currentThemeId, setCurrentThemeId] = useState<string | null>(null);
    const [themeColor, setThemeColor] = useState("#339af0");
    const [backgroundColor, setBackgroundColor] = useState(computedColorScheme === "dark" ? "#1a1b1e" : "#f8fafc");
    const [backgroundOpacity, setBackgroundOpacity] = useState(1.0);
    const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
    const [panelColor, setPanelColor] = useState(computedColorScheme === "dark" ? "#25262b" : "#ffffff");
    const [panelOpacity, setPanelOpacity] = useState(0.95);

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
        if (savedBackgroundImageUrl) setBackgroundImageUrl(savedBackgroundImageUrl);
        if (savedPanelColor) setPanelColor(savedPanelColor);
        if (savedPanelOpacity) setPanelOpacity(parseFloat(savedPanelOpacity));
        if (savedThemeId) setCurrentThemeId(savedThemeId);
    }, []);

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
