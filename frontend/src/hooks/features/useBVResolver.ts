/**
 * BV 号解析 Hook
 * 管理 Bilibili 视频解析，支持搜索本地和远程结果
 */

import { useState, useCallback } from 'react';
import * as Services from '../../../wailsjs/go/services/Service';
import { notifications } from '@mantine/notifications';
import { Song } from '../../types';

export interface BVPreview {
    bvid: string;
    title: string;
    cover: string;
    url: string;
    expiresAt: string;
    duration: number;
    isLocal: boolean; // 标记是否来自本地数据库
}

export interface UseBVResolverReturn {
    bvPreview: BVPreview | null;
    bvModalOpen: boolean;
    bvSearchResults: Song[]; // 本地搜索结果
    bvSongName: string;
    bvSinger: string;
    bvTargetFavId: string | null;
    resolvingBV: boolean;
    sliceStart: number;
    sliceEnd: number;

    setBvPreview: React.Dispatch<React.SetStateAction<BVPreview | null>>;
    setBvModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setBvSearchResults: React.Dispatch<React.SetStateAction<Song[]>>;
    setBvSongName: React.Dispatch<React.SetStateAction<string>>;
    setBvSinger: React.Dispatch<React.SetStateAction<string>>;
    setBvTargetFavId: React.Dispatch<React.SetStateAction<string | null>>;
    setResolvingBV: React.Dispatch<React.SetStateAction<boolean>>;
    setSliceStart: React.Dispatch<React.SetStateAction<number>>;
    setSliceEnd: React.Dispatch<React.SetStateAction<number>>;

    resolveBV: (input: string) => Promise<void>;
    resetBVState: () => void;
}

export const useBVResolver = () => {
    const [bvPreview, setBvPreview] = useState<BVPreview | null>(null);
    const [bvModalOpen, setBvModalOpen] = useState(false);
    const [bvSearchResults, setBvSearchResults] = useState<Song[]>([]);
    const [bvSongName, setBvSongName] = useState('');
    const [bvSinger, setBvSinger] = useState('');
    const [bvTargetFavId, setBvTargetFavId] = useState<string | null>(null);
    const [resolvingBV, setResolvingBV] = useState(false);
    const [sliceStart, setSliceStart] = useState(0);
    const [sliceEnd, setSliceEnd] = useState(0);

    // 解析 BV 号，同时搜索本地和远程
    const resolveBV = useCallback(async (input: string) => {
        if (!input.trim()) {
            notifications.show({
                title: '输入为空',
                message: '请输入 BV 号',
                color: 'orange',
            });
            return;
        }

        setResolvingBV(true);
        try {
            // 提取 BV 号
            const bvPattern = /BV[0-9A-Za-z]{10}/;
            const bvMatch = input.match(bvPattern);
            if (!bvMatch) {
                notifications.show({
                    title: '格式错误',
                    message: '请输入有效的 BV 号',
                    color: 'orange',
                });
                setResolvingBV(false);
                return;
            }

            const bvid = bvMatch[0];

            // 1. 搜索本地和远程
            const searchResults = await Services.SearchBVID(bvid);
            setBvSearchResults(searchResults);

            // 2. 获取音频信息以更新预览
            const result = await Services.ResolveBiliAudio(bvid);
            setBvPreview({
                bvid,
                title: result.title,
                cover: result.cover,
                url: result.url,
                expiresAt: result.expiresAt,
                duration: result.duration || 0,
                isLocal: false, // 总是从B站获取最新音频
            });
            setBvSongName(result.title);
            setBvModalOpen(true);
        } catch (error) {
            console.error('解析 BV 号失败:', error);
            notifications.show({
                title: '解析失败',
                message: error instanceof Error ? error.message : '未知错误',
                color: 'red',
            });
        } finally {
            setResolvingBV(false);
        }
    }, []);

    // 重置状态
    const resetBVState = useCallback(() => {
        setBvPreview(null);
        setBvModalOpen(false);
        setBvSearchResults([]);
        setBvSongName('');
        setBvSinger('');
        setBvTargetFavId(null);
        setSliceStart(0);
        setSliceEnd(0);
    }, []);

    return {
        bvPreview,
        bvModalOpen,
        bvSearchResults,
        bvSongName,
        bvSinger,
        bvTargetFavId,
        resolvingBV,
        sliceStart,
        sliceEnd,

        setBvPreview,
        setBvModalOpen,
        setBvSearchResults,
        setBvSongName,
        setBvSinger,
        setBvTargetFavId,
        setResolvingBV,
        setSliceStart,
        setSliceEnd,

        resolveBV,
        resetBVState,
    };
};
