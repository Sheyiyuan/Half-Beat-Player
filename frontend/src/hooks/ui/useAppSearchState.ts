/**
 * useAppSearchState - 应用搜索和 BV 解析状态管理
 * 将 App.tsx 中分散的搜索、BV、设置等状态集中管理
 */

import { useState } from 'react';
import { Song } from '../../types';

export const useAppSearchState = () => {
    // ========== 搜索相关 ==========
    const [searchQuery, setSearchQuery] = useState("");
    const [globalSearchTerm, setGlobalSearchTerm] = useState("");
    const [selectedFavId, setSelectedFavId] = useState<string | null>(null);
    const [remoteResults, setRemoteResults] = useState<Song[]>([]);
    const [remoteLoading, setRemoteLoading] = useState(false);

    // ========== BV 模态创建歌单名称 ==========
    const [newFavName, setNewFavName] = useState("");

    // ========== 设置相关 ==========
    const [cacheSize, setCacheSize] = useState(0);

    // ========== 应用状态 ==========
    const [status, setStatus] = useState<string>("加载中...");

    return {
        // 搜索相关
        searchQuery,
        setSearchQuery,
        globalSearchTerm,
        setGlobalSearchTerm,
        selectedFavId,
        setSelectedFavId,
        remoteResults,
        setRemoteResults,
        remoteLoading,
        setRemoteLoading,

        // BV 模态
        newFavName,
        setNewFavName,

        // 设置相关
        cacheSize,
        setCacheSize,

        // 应用状态
        status,
        setStatus,
    };
};
