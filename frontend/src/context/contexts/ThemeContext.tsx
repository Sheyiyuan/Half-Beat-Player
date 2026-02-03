/**
 * 主题 Context
 * 管理主题相关的所有状态：主题信息、颜色配置、效果配置、布局配置
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import {
    ThemeContextValue,
    ThemeInfo,
    ColorConfig,
    EffectsConfig,
    LayoutConfig,
    ThemeActions,
} from '../types/contexts';
import { Theme, convertTheme, convertThemes } from '../../types';
import { DEFAULT_THEMES } from '../../utils/constants';
import { normalizeThemeImageUrl } from '../../utils/image';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { setColorScheme: setMantineColorScheme } = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme('light');

    // ========== 初始化主题数据 ==========
    const getCachedThemes = (): Theme[] => {
        try {
            const saved = localStorage.getItem('half-beat.customThemes');
            if (saved) {
                const cached = JSON.parse(saved) as Theme[];
                return convertThemes(cached);
            }
        } catch (e) {
            console.warn('[ThemeContext] 读取缓存主题失败:', e);
        }
        return [];
    };

    const initialThemes = [...DEFAULT_THEMES, ...getCachedThemes()];

    const getInitialThemeId = (): string => {
        try {
            const saved = localStorage.getItem('half-beat.currentThemeId');
            if (saved && initialThemes.find(t => t.id === saved)) {
                return saved;
            }
        } catch (e) {
            console.warn('[ThemeContext] 读取 localStorage 失败:', e);
        }
        return computedColorScheme === "dark" ? "dark" : "light";
    };

    const initialThemeId = getInitialThemeId();
    const defaultThemeObj = initialThemes.find(t => t.id === initialThemeId) || DEFAULT_THEMES.find(t => t.id === "light");
    const defaultTheme = defaultThemeObj ? convertTheme(defaultThemeObj) : convertTheme(DEFAULT_THEMES[0]);

    // ========== 主题信息状态 ==========
    const [themes, setThemes] = useState<Theme[]>(convertThemes(initialThemes));
    const [currentThemeId, setCurrentThemeId] = useState<string | null>(defaultTheme.id);
    const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(
        (defaultTheme.colorScheme as 'light' | 'dark') || 'dark'
    );

    // ========== 颜色配置状态 ==========
    const [themeColor, setThemeColor] = useState(defaultTheme.themeColor || '#ffffff');
    const [backgroundColor, setBackgroundColor] = useState(defaultTheme.backgroundColor || '#ffffff');
    const [panelColor, setPanelColor] = useState(defaultTheme.panelColor || '#ffffff');
    const [controlColor, setControlColor] = useState(defaultTheme.controlColor || '#ffffff');
    const [textColorPrimary, setTextColorPrimary] = useState(defaultTheme.textColorPrimary || "#1a1b1e");
    const [textColorSecondary, setTextColorSecondary] = useState(defaultTheme.textColorSecondary || "#909296");
    const [favoriteCardColor, setFavoriteCardColor] = useState(defaultTheme.favoriteCardColor || '#ffffff');
    const [modalColor, setModalColor] = useState(defaultTheme.modalColor || '#ffffff');

    // ========== 效果配置状态 ==========
    const [backgroundOpacity, setBackgroundOpacity] = useState(defaultTheme.backgroundOpacity ?? 1);
    const [backgroundImageUrl, setBackgroundImageUrl] = useState(defaultTheme.backgroundImage || "");
    const [backgroundBlur, setBackgroundBlur] = useState(defaultTheme.backgroundBlur ?? 0);
    const [panelOpacity, setPanelOpacity] = useState(defaultTheme.panelOpacity ?? 0.92);
    const [panelBlur, setPanelBlur] = useState(defaultTheme.panelBlur ?? 0);
    const [controlOpacity, setControlOpacity] = useState(defaultTheme.controlOpacity ?? 1);
    const [controlBlur, setControlBlur] = useState(defaultTheme.controlBlur ?? 0);
    const [cardOpacity, setCardOpacity] = useState(defaultTheme.cardOpacity ?? 1);
    const [modalOpacity, setModalOpacity] = useState(defaultTheme.modalOpacity ?? 1);
    const [modalBlur, setModalBlur] = useState(defaultTheme.modalBlur ?? 0);

    // ========== 布局配置状态 ==========
    const [panelRadius, setPanelRadius] = useState(defaultTheme.panelRadius ?? 8);
    const [componentRadius, setComponentRadius] = useState(defaultTheme.componentRadius ?? 8);
    const [modalRadius, setModalRadius] = useState(defaultTheme.modalRadius ?? 12);
    const [notificationRadius, setNotificationRadius] = useState(defaultTheme.notificationRadius ?? 8);
    const [coverRadius, setCoverRadius] = useState(defaultTheme.coverRadius ?? 8);
    const [windowControlsPos, setWindowControlsPos] = useState<LayoutConfig['windowControlsPos']>(
        (defaultTheme.windowControlsPos as 'left' | 'right' | 'hidden') || 'right'
    );

    // ========== 主题应用操作 ==========
    const applyTheme = useCallback((theme: Theme) => {
        if (!theme) return;

        setThemeColor(theme.themeColor || '#ffffff');
        setBackgroundColor(theme.backgroundColor || '#ffffff');
        setBackgroundOpacity(theme.backgroundOpacity ?? 1);
        setBackgroundImageUrl(normalizeThemeImageUrl(theme.backgroundImage || ""));
        setBackgroundBlur(theme.backgroundBlur ?? 0);
        setPanelColor(theme.panelColor || '#ffffff');
        setPanelOpacity(theme.panelOpacity ?? 0.92);
        setPanelBlur(theme.panelBlur ?? 0);
        setPanelRadius(theme.panelRadius ?? 8);
        setControlColor(theme.controlColor || theme.panelColor || "#ffffff");
        setControlOpacity(theme.controlOpacity ?? 1);
        setControlBlur(theme.controlBlur ?? 0);
        setTextColorPrimary(theme.textColorPrimary || (computedColorScheme === 'dark' ? '#ffffff' : '#1a1b1e'));
        setTextColorSecondary(theme.textColorSecondary || (computedColorScheme === 'dark' ? '#a6a7ab' : '#909296'));
        setFavoriteCardColor(theme.favoriteCardColor || theme.panelColor || "#ffffff");
        setCardOpacity(theme.cardOpacity ?? 1);
        setComponentRadius(theme.componentRadius ?? 8);
        setModalRadius(theme.modalRadius ?? 12);
        setNotificationRadius(theme.notificationRadius ?? 8);
        setCoverRadius(theme.coverRadius ?? 8);
        setModalColor(theme.modalColor || theme.panelColor || "#ffffff");
        setModalOpacity(theme.modalOpacity ?? 1);
        setModalBlur(theme.modalBlur ?? 0);
        setWindowControlsPos((theme.windowControlsPos as 'left' | 'right' | 'hidden') || "right");

        const scheme = (theme.colorScheme as 'light' | 'dark') || 'dark';
        setColorScheme(scheme);
        setCurrentThemeId(theme.id);

        // 应用到 Mantine
        setMantineColorScheme(scheme);

        // 保存到 localStorage
        localStorage.setItem('half-beat.currentThemeId', theme.id);
    }, [computedColorScheme, setMantineColorScheme]);

    // ========== 颜色设置操作 ==========
    const setColorSchemeWithMantine = useCallback((scheme: 'light' | 'dark') => {
        setColorScheme(scheme);
        setMantineColorScheme(scheme);
    }, [setMantineColorScheme]);

    const setBackgroundImageUrlSafe = useCallback((url: string) => {
        setBackgroundImageUrl(normalizeThemeImageUrl(url));
    }, []);

    // ========== 稳定的 Actions 对象 ==========
    const actions: ThemeActions = useMemo(() => ({
        // 主题管理
        setThemes,
        setCurrentThemeId,
        applyTheme,

        // 颜色设置
        setThemeColor,
        setColorScheme: setColorSchemeWithMantine,
        setBackgroundColor,
        setPanelColor,
        setControlColor,
        setTextColorPrimary,
        setTextColorSecondary,
        setFavoriteCardColor,
        setModalColor,

        // 效果设置
        setBackgroundOpacity,
        setBackgroundImageUrl: setBackgroundImageUrlSafe,
        setBackgroundBlur,
        setPanelOpacity,
        setPanelBlur,
        setControlOpacity,
        setControlBlur,
        setCardOpacity,
        setModalOpacity,
        setModalBlur,

        // 布局设置
        setPanelRadius,
        setComponentRadius,
        setModalRadius,
        setNotificationRadius,
        setCoverRadius,
        setWindowControlsPos,
    }), [applyTheme, setColorSchemeWithMantine, setBackgroundImageUrlSafe]);

    // ========== 状态对象 ==========
    const theme: ThemeInfo = useMemo(() => ({
        themes,
        currentThemeId,
        colorScheme,
    }), [themes, currentThemeId, colorScheme]);

    const colors: ColorConfig = useMemo(() => ({
        themeColor,
        backgroundColor,
        panelColor,
        controlColor,
        textColorPrimary,
        textColorSecondary,
        favoriteCardColor,
        modalColor,
    }), [themeColor, backgroundColor, panelColor, controlColor, textColorPrimary, textColorSecondary, favoriteCardColor, modalColor]);

    const effects: EffectsConfig = useMemo(() => ({
        backgroundOpacity,
        backgroundImageUrl,
        backgroundBlur,
        panelOpacity,
        panelBlur,
        controlOpacity,
        controlBlur,
        cardOpacity,
        modalOpacity,
        modalBlur,
    }), [backgroundOpacity, backgroundImageUrl, backgroundBlur, panelOpacity, panelBlur, controlOpacity, controlBlur, cardOpacity, modalOpacity, modalBlur]);

    const layout: LayoutConfig = useMemo(() => ({
        panelRadius,
        componentRadius,
        modalRadius,
        notificationRadius,
        coverRadius,
        windowControlsPos,
    }), [panelRadius, componentRadius, modalRadius, notificationRadius, coverRadius, windowControlsPos]);

    // ========== Context Value ==========
    const contextValue: ThemeContextValue = useMemo(() => ({
        theme,
        colors,
        effects,
        layout,
        actions,
    }), [theme, colors, effects, layout, actions]);

    // ========== 同步 Mantine 颜色方案 ==========
    useEffect(() => {
        if (colorScheme) {
            setMantineColorScheme(colorScheme);
        }
    }, [colorScheme, setMantineColorScheme]);

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
};

// ========== Hook ==========
export const useThemeContext = (): ThemeContextValue => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useThemeContext must be used within ThemeProvider');
    }
    return context;
};

export default ThemeContext;