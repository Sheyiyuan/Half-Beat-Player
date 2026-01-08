/**
 * useAppComputedState - 应用派生值计算
 * 集中所有需要 memo 和 useMemo 的派生值计算
 */

import { useMemo } from 'react';

interface UseAppComputedStateProps {
    duration: number;
    backgroundImageUrl: string;
    backgroundBlur: number;
    backgroundWithOpacity: string;
    derivedComponentRadius: number;
    derivedModalRadius: number;
    derivedNotificationRadius: number;
    derivedTextColorPrimary: string;
    themeColorLight: string;
    songs: any[];
    searchQuery: string;
}

export const useAppComputedState = ({
    duration,
    backgroundImageUrl,
    backgroundBlur,
    backgroundWithOpacity,
    derivedComponentRadius,
    derivedModalRadius,
    derivedNotificationRadius,
    derivedTextColorPrimary,
    themeColorLight,
    songs,
    searchQuery,
}: UseAppComputedStateProps) => {
    // 播放区间相关派生值
    const maxSkipLimit = duration > 0 ? duration : 1;

    // 背景样式
    const backgroundStyle = useMemo(() => ({
        backgroundColor: backgroundWithOpacity,
        backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed" as const,
        filter: backgroundBlur > 0 ? `blur(${backgroundBlur}px)` : undefined,
        transform: "none",
    }), [backgroundWithOpacity, backgroundImageUrl, backgroundBlur]);

    // Mantine 主题配置
    const mantineTheme = useMemo(() => ({
        defaultRadius: derivedComponentRadius,
        black: derivedTextColorPrimary,
        white: "#ffffff",
        components: {
            Text: { defaultProps: { color: derivedTextColorPrimary } },
            Title: { defaultProps: { color: derivedTextColorPrimary } },
            Modal: { defaultProps: { radius: derivedModalRadius } },
            Menu: { defaultProps: { radius: derivedModalRadius } },
            Notification: { defaultProps: { radius: derivedNotificationRadius } },
        },
    }), [derivedComponentRadius, derivedModalRadius, derivedNotificationRadius, derivedTextColorPrimary]);

    // 过滤的歌曲列表
    const filteredSongs = useMemo(() =>
        songs.filter((s) =>
            searchQuery === "" ||
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.singer.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        [songs, searchQuery]
    );

    return {
        maxSkipLimit,
        backgroundStyle,
        mantineTheme,
        filteredSongs,
    };
};
