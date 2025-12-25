import { useMemo } from 'react';

interface UiDerivedProps {
    themeColor: string;
    backgroundColor: string;
    backgroundOpacity: number;
    panelColor: string;
    panelOpacity: number;
}

function toRgba(color: string, alpha: number) {
    const a = Math.min(1, Math.max(0, alpha));
    if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        const normalized = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
        if (normalized.length === 6) {
            const r = parseInt(normalized.slice(0, 2), 16);
            const g = parseInt(normalized.slice(2, 4), 16);
            const b = parseInt(normalized.slice(4, 6), 16);
            if (![r, g, b].some((v) => Number.isNaN(v))) {
                return `rgba(${r}, ${g}, ${b}, ${a})`;
            }
        }
    }
    return color;
}

function lightenHex(hex: string, percent: number) {
    const num = parseInt(hex.replace('#', ''), 16);
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
    panelColor,
    panelOpacity,
}: UiDerivedProps) {
    const backgroundWithOpacity = useMemo(
        () => toRgba(backgroundColor, backgroundOpacity),
        [backgroundColor, backgroundOpacity]
    );

    const panelBackground = useMemo(
        () => toRgba(panelColor, panelOpacity),
        [panelColor, panelOpacity]
    );

    const themeColorLight = useMemo(() => lightenHex(themeColor, 40), [themeColor]);

    return { backgroundWithOpacity, panelBackground, themeColorLight };
}
