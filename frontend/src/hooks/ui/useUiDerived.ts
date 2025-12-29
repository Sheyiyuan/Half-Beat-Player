import { useMemo } from 'react';

interface UiDerivedProps {
    themeColor: string;
    backgroundColor: string;
    backgroundOpacity: number;
    backgroundImageUrl?: string;
    panelColor: string;
    panelOpacity: number;
    panelBlur?: number;
    panelRadius?: number;
    controlColor?: string;
    controlOpacity?: number;
    controlBlur?: number;
    textColorPrimary?: string;
    textColorSecondary?: string;
    favoriteCardColor?: string;
    cardOpacity?: number;
    modalRadius?: number;
    notificationRadius?: number;
    componentRadius?: number;
    coverRadius?: number;
    modalColor?: string;
    modalOpacity?: number;
    modalBlur?: number;
}

function toRgba(color: string, alpha: number) {
    if (!color) return 'rgba(0, 0, 0, 0)';
    const a = Math.min(1, Math.max(0, alpha));

    // 如果是 CSS 变量，我们无法在 JS 中轻松解析，但我们可以尝试包装它
    // 这种方法在某些浏览器中有效，但在 WebKit 中可能不稳定
    if (typeof color === 'string' && color.startsWith('var(')) {
        return `color-mix(in srgb, ${color}, transparent ${Math.round((1 - a) * 100)}%)`;
    }

    // 如果已经是 rgba(r, g, b, a) 或 rgba(r g b / a)
    if (typeof color === 'string' && (color.includes('rgba') || color.includes('/'))) {
        const match = color.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+[\d.]+)?\)/);
        if (match) {
            return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${a})`;
        }
    }

    // 如果是 rgb(r, g, b)
    if (typeof color === 'string' && color.startsWith('rgb')) {
        const match = color.match(/rgb\((\d+)[,\s]+(\d+)[,\s]+(\d+)\)/);
        if (match) {
            return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${a})`;
        }
    }

    if (typeof color === 'string' && color.startsWith('#')) {
        let hex = color.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map((c) => c + c).join('');
        }
        if (hex.length === 6 || hex.length === 8) {
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            if (![r, g, b].some((v) => Number.isNaN(v))) {
                return `rgba(${r}, ${g}, ${b}, ${a})`;
            }
        }
    }

    // 兜底处理：如果是纯色名称，尝试转换为 rgba
    if (typeof color === 'string') {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = color;
            const resolved = ctx.fillStyle; // 得到 hex
            if (resolved && resolved.startsWith('#')) {
                return toRgba(resolved, a);
            }
        }
    }

    return color;
}

function lightenHex(hex: string, percent: number) {
    if (!hex || typeof hex !== 'string') return '#000000';
    const cleanHex = hex.startsWith('#') ? hex.replace('#', '') : hex;
    const num = parseInt(cleanHex, 16);
    if (isNaN(num)) return hex;

    const r0 = num >> 16;
    const g0 = (num >> 8) & 0x00ff;
    const b0 = num & 0x0000ff;
    const r = Math.min(255, Math.floor(r0 + (255 - r0) * (percent / 100)));
    const g = Math.min(255, Math.floor(g0 + (255 - g0) * (percent / 100)));
    const b = Math.min(255, Math.floor(b0 + (255 - b0) * (percent / 100)));
    return `rgb(${r}, ${g}, ${b})`;
}

export function useUiDerived({
    themeColor,
    backgroundColor,
    backgroundOpacity,
    backgroundImageUrl = '',
    panelColor,
    panelOpacity,
    panelBlur = 0,
    panelRadius = 8,
    controlColor,
    controlOpacity = 1,
    controlBlur = 0,
    textColorPrimary = '#1a1b1e',
    textColorSecondary = '#909296',
    favoriteCardColor,
    cardOpacity = 1,
    modalRadius = 8,
    notificationRadius = 8,
    componentRadius = 8,
    coverRadius = 8,
    modalColor,
    modalOpacity = 1,
    modalBlur = 0,
}: UiDerivedProps) {
    // 确保 blur 是有效的数字
    const safePanelBlur = typeof panelBlur === 'number' ? panelBlur : 0;
    const safeControlBlur = typeof controlBlur === 'number' ? controlBlur : 0;

    const backgroundWithOpacity = useMemo(
        () => toRgba(backgroundColor, backgroundOpacity),
        [backgroundColor, backgroundOpacity]
    );

    const panelBackground = useMemo(
        () => toRgba(panelColor, panelOpacity),
        [panelColor, panelOpacity]
    );

    const controlBackground = useMemo(
        () => toRgba(controlColor || panelColor, controlOpacity),
        [controlColor, panelColor, controlOpacity]
    );

    const favoriteCardBackground = useMemo(
        () => toRgba(favoriteCardColor || panelColor, cardOpacity),
        [favoriteCardColor, panelColor, cardOpacity]
    );

    const modalBackground = useMemo(
        () => toRgba(modalColor || panelColor, modalOpacity),
        [modalColor, panelColor, modalOpacity]
    );

    const safeModalBlur = typeof modalBlur === 'number' ? modalBlur : 0;

    const modalStyles = useMemo(
        () => ({
            backgroundColor: modalBackground,
            backdropFilter: safeModalBlur > 0 ? `blur(${safeModalBlur}px)` : undefined,
            WebkitBackdropFilter: safeModalBlur > 0 ? `blur(${safeModalBlur}px)` : undefined,
        }),
        [modalBackground, safeModalBlur]
    );

    const themeColorLight = useMemo(() => lightenHex(themeColor, 40), [themeColor]);

    const panelStyles = useMemo(
        () => ({
            borderRadius: `${panelRadius}px`,
            // 注入 CSS 变量供 .glass-panel 类使用
            '--glass-bg-image': backgroundImageUrl ? `url(${backgroundImageUrl})` : 'none',
            '--glass-blur': `${safePanelBlur}px`,
            '--glass-opacity': backgroundImageUrl ? '1' : '0',
            '--glass-panel-color': panelBackground,
            '--text-color-primary': textColorPrimary,
            '--text-color-secondary': textColorSecondary,
            // 依然保留 backdrop-filter 作为增强（如果支持的话）
            backdropFilter: safePanelBlur > 0 ? `blur(${safePanelBlur}px)` : undefined,
            WebkitBackdropFilter: safePanelBlur > 0 ? `blur(${safePanelBlur}px)` : undefined,
            position: 'relative' as const,
            overflow: 'hidden' as const,
        }),
        [safePanelBlur, panelRadius, backgroundImageUrl, panelBackground, textColorPrimary, textColorSecondary]
    );

    const controlStyles = useMemo(
        () => ({
            backgroundColor: controlBackground,
            backdropFilter: safeControlBlur > 0 ? `blur(${safeControlBlur}px)` : undefined,
            WebkitBackdropFilter: safeControlBlur > 0 ? `blur(${safeControlBlur}px)` : undefined,
        }),
        [controlBackground, safeControlBlur]
    );

    return {
        backgroundWithOpacity,
        panelBackground,
        controlBackground,
        favoriteCardBackground,
        modalBackground,
        themeColorLight,
        panelStyles,
        controlStyles,
        modalStyles,
        componentRadius,
        coverRadius,
        modalRadius,
        notificationRadius,
        textColorPrimary,
        textColorSecondary
    };
}
