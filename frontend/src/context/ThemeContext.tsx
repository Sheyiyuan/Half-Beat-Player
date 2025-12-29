import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { MantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { Theme, convertTheme, convertThemes } from '../types';
import { DEFAULT_THEMES } from '../utils/constants';

// ========== 类型定义 ==========
export interface ThemeState {
    themes: Theme[];
    currentThemeId: string | null;
    themeColor: string;
    backgroundColor: string;
    backgroundOpacity: number;
    backgroundImageUrl: string;
    backgroundBlur: number;
    panelColor: string;
    panelOpacity: number;
    panelBlur: number;
    panelRadius: number;
    controlColor: string;
    controlOpacity: number;
    controlBlur: number;
    textColorPrimary: string;
    textColorSecondary: string;
    favoriteCardColor: string;
    cardOpacity: number;
    componentRadius: number;
    modalRadius: number;
    notificationRadius: number;
    coverRadius: number;
    modalColor: string;
    modalOpacity: number;
    modalBlur: number;
    windowControlsPos: string;
    colorScheme: string;
    computedColorScheme: MantineColorScheme;
}

export interface ThemeActions {
    setThemes: (themes: Theme[]) => void;
    setCurrentThemeId: (id: string | null) => void;
    setThemeColor: (color: string) => void;
    setBackgroundColor: (color: string) => void;
    setBackgroundOpacity: (opacity: number) => void;
    setBackgroundImageUrl: (url: string) => void;
    setBackgroundBlur: (blur: number) => void;
    setPanelColor: (color: string) => void;
    setPanelOpacity: (opacity: number) => void;
    setPanelBlur: (blur: number) => void;
    setPanelRadius: (radius: number) => void;
    setControlColor: (color: string) => void;
    setControlOpacity: (opacity: number) => void;
    setControlBlur: (blur: number) => void;
    setTextColorPrimary: (color: string) => void;
    setTextColorSecondary: (color: string) => void;
    setFavoriteCardColor: (color: string) => void;
    setCardOpacity: (opacity: number) => void;
    setComponentRadius: (radius: number) => void;
    setModalRadius: (radius: number) => void;
    setNotificationRadius: (radius: number) => void;
    setCoverRadius: (radius: number) => void;
    setModalColor: (color: string) => void;
    setModalOpacity: (opacity: number) => void;
    setModalBlur: (blur: number) => void;
    setWindowControlsPos: (pos: string) => void;
    setColorScheme: (scheme: string) => void;

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

    // ========== 初始化数据 ==========
    // 从 localStorage 读取缓存的自定义主题
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

    useEffect(() => {
        // 清理旧的 localStorage 键，避免与带前缀的新键冲突
        const oldKeys = ['customThemes', 'currentThemeId', 'userInfo'];
        oldKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`[ThemeContext] 已清理旧缓存键: ${key}`);
            }
        });
    }, []);

    // 优先从 localStorage 读取，否则使用系统偏好
    const getInitialThemeId = (allThemes: (Theme | typeof DEFAULT_THEMES[number])[]): string => {
        try {
            const saved = localStorage.getItem('half-beat.currentThemeId');
            if (saved && allThemes.find(t => t.id === saved)) {
                return saved;
            }
        } catch (e) {
            console.warn('[ThemeContext] 读取 localStorage 失败:', e);
        }
        const fallback = computedColorScheme === "dark" ? "dark" : "light";
        return fallback;
    };

    const initialThemeId = getInitialThemeId(initialThemes);
    const defaultThemeObj = initialThemes.find(t => t.id === initialThemeId) || DEFAULT_THEMES.find(t => t.id === "light");
    const defaultTheme = defaultThemeObj ? convertTheme(defaultThemeObj) : convertTheme(DEFAULT_THEMES[0]);

    const [themes, setThemes] = useState<Theme[]>(convertThemes(initialThemes));
    const [currentThemeId, setCurrentThemeId] = useState<string | null>(defaultTheme.id);
    const [themeColor, setThemeColor] = useState(defaultTheme.themeColor || '#ffffff');
    const [backgroundColor, setBackgroundColor] = useState(defaultTheme.backgroundColor || '#ffffff');
    const [backgroundOpacity, setBackgroundOpacity] = useState(defaultTheme.backgroundOpacity ?? 1);
    const [backgroundImageUrl, setBackgroundImageUrl] = useState(defaultTheme.backgroundImage || "");
    const [backgroundBlur, setBackgroundBlur] = useState(defaultTheme.backgroundBlur ?? 0);
    const [panelColor, setPanelColor] = useState(defaultTheme.panelColor || '#ffffff');
    const [panelOpacity, setPanelOpacity] = useState(defaultTheme.panelOpacity ?? 0.92);
    const [panelBlur, setPanelBlur] = useState(defaultTheme.panelBlur ?? 0);
    const [panelRadius, setPanelRadius] = useState(defaultTheme.panelRadius ?? 8);
    const [controlColor, setControlColor] = useState(defaultTheme.controlColor || '#ffffff');
    const [controlOpacity, setControlOpacity] = useState(defaultTheme.controlOpacity ?? 1);
    const [controlBlur, setControlBlur] = useState(defaultTheme.controlBlur ?? 0);
    const [textColorPrimary, setTextColorPrimary] = useState(defaultTheme.textColorPrimary || "#1a1b1e");
    const [textColorSecondary, setTextColorSecondary] = useState(defaultTheme.textColorSecondary || "#909296");
    const [favoriteCardColor, setFavoriteCardColor] = useState(defaultTheme.favoriteCardColor || '#ffffff');
    const [cardOpacity, setCardOpacity] = useState(defaultTheme.cardOpacity ?? 1);
    const [componentRadius, setComponentRadius] = useState(defaultTheme.componentRadius ?? 8);
    const [modalRadius, setModalRadius] = useState(defaultTheme.modalRadius ?? 12);
    const [notificationRadius, setNotificationRadius] = useState(defaultTheme.notificationRadius ?? 8);
    const [coverRadius, setCoverRadius] = useState(defaultTheme.coverRadius ?? 8);
    const [modalColor, setModalColor] = useState(defaultTheme.modalColor || '#ffffff');
    const [modalOpacity, setModalOpacity] = useState(defaultTheme.modalOpacity ?? 1);
    const [modalBlur, setModalBlur] = useState(defaultTheme.modalBlur ?? 0);
    const [windowControlsPos, setWindowControlsPos] = useState(defaultTheme.windowControlsPos || "right");
    const [colorScheme, setColorScheme] = useState(defaultTheme.colorScheme || "dark");

    // ========== Actions ==========

    /**
     * 应用主题
     */
    const applyTheme = useCallback((theme: Theme) => {
        if (!theme) return;

        setThemeColor(theme.themeColor || '#ffffff');
        setBackgroundColor(theme.backgroundColor || '#ffffff');
        setBackgroundOpacity(theme.backgroundOpacity ?? 1);
        setBackgroundImageUrl(theme.backgroundImage || "");
        setBackgroundBlur(theme.backgroundBlur ?? 0);
        setPanelColor(theme.panelColor || '#ffffff');
        setPanelOpacity(theme.panelOpacity ?? 0.92);
        setPanelBlur(theme.panelBlur ?? 0);
        setPanelRadius(theme.panelRadius ?? 8);

        // 容错处理：如果旧缓存中没有这些字段，使用合理的默认值
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
        setWindowControlsPos(theme.windowControlsPos || "right");
        setColorScheme(theme.colorScheme || "dark");
        setCurrentThemeId(theme.id);

        // 只保存主题 ID 到 localStorage，避免字段污染
        localStorage.setItem('half-beat.currentThemeId', theme.id);
    }, [computedColorScheme, setCurrentThemeId]);

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
        localStorage.setItem('half-beat.backgroundImageUrl', trimmedUrl);
    }, []);

    // ========== Effect: 清理旧的 localStorage 字段 ==========
    useEffect(() => {
        // 清理旧的污染字段
        const fieldsToClean = [
            'themeColor', 'backgroundColor', 'backgroundOpacity', 'backgroundImageUrl',
            'panelColor', 'panelOpacity', 'currentThemeId', 'customThemes'
        ];
        fieldsToClean.forEach(field => {
            try {
                localStorage.removeItem(field);
            } catch (e) {
                // 忽略错误
            }
        });
    }, []);

    // ========== Effect: 当 themes 或 currentThemeId 改变时，自动应用主题 ==========
    useEffect(() => {
        if (themes.length === 0) return;

        // 查找当前主题
        let targetTheme = themes.find(t => t.id === currentThemeId);

        // 如果当前主题不存在，使用第一个主题
        if (!targetTheme) {
            targetTheme = themes[0];
            setCurrentThemeId(targetTheme.id);
            return;  // 等待 setCurrentThemeId 完成后再应用
        }

        // 应用主题
        applyTheme(targetTheme);
    }, [themes, currentThemeId, applyTheme]);

    // ========== Context Value ==========
    const value: ThemeContextValue = {
        state: {
            themes,
            currentThemeId,
            themeColor,
            backgroundColor,
            backgroundOpacity,
            backgroundImageUrl,
            backgroundBlur,
            panelColor,
            panelOpacity,
            panelBlur,
            panelRadius,
            controlColor,
            controlOpacity,
            controlBlur,
            textColorPrimary,
            textColorSecondary,
            favoriteCardColor,
            cardOpacity,
            componentRadius,
            modalRadius,
            notificationRadius,
            coverRadius,
            modalColor,
            modalOpacity,
            modalBlur,
            windowControlsPos,
            colorScheme,
            computedColorScheme,
        },
        actions: {
            setThemes,
            setCurrentThemeId,
            setThemeColor,
            setBackgroundColor,
            setBackgroundOpacity,
            setBackgroundImageUrl,
            setBackgroundBlur,
            setPanelColor,
            setPanelOpacity,
            setPanelBlur,
            setPanelRadius,
            setControlColor,
            setControlOpacity,
            setControlBlur,
            setTextColorPrimary,
            setTextColorSecondary,
            setFavoriteCardColor,
            setCardOpacity,
            setComponentRadius,
            setModalRadius,
            setNotificationRadius,
            setCoverRadius,
            setModalColor,
            setModalOpacity,
            setModalBlur,
            setWindowControlsPos,
            setColorScheme,
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
