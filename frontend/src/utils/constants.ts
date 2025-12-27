/**
 * 应用常量定义
 */

export const APP_VERSION = (import.meta as any).env?.VITE_APP_VERSION || 'dev';

export const DEFAULT_THEMES = [
    {
        id: 'light',
        name: '亮色',
        colorScheme: 'light' as const,
        themeColor: '#66ccff',
        backgroundColor: '#f8fafc',
        backgroundOpacity: 1,
        backgroundImage: '',
        panelColor: '#ffffff',
        panelOpacity: 0.92,
        isDefault: true,
        isReadOnly: true,
    },
    {
        id: 'dark',
        name: '暗色',
        colorScheme: 'dark' as const,
        themeColor: '#f4004f',
        backgroundColor: '#210b13ff',
        backgroundOpacity: 1,
        backgroundImage: '',
        panelColor: '#371f25ff',
        panelOpacity: 0.92,
        isDefault: true,
        isReadOnly: true,
    },
];

export const PLACEHOLDER_COVER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="rgba(0,0,0,0.5)" font-family="sans-serif" font-size="30" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3E封面%3C/text%3E%3C/svg%3E';
