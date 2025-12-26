import { useState } from "react";
import { notifications } from "@mantine/notifications";
import * as Services from "../../../wailsjs/go/services/Service";
import type { Song } from "../../types";

interface UseFidImportOptions {
    themeColor: string;
    songs: Song[];
    onStatusChange?: (status: string) => void;
}

interface ImportResult {
    newSongs: Song[];
    existingSongs: Song[];
    totalCount: number;
    collectionTitle?: string; // 收藏夹标题
}

/**
 * fid 导入收藏夹功能封装
 * 
 * 功能:
 * 1. 验证 fid 格式
 * 2. 从 B站 API 获取收藏夹内容
 * 3. 解析 BVID 获取歌曲详情
 * 4. 过滤已存在的歌曲
 * 5. 返回新增和已存在的歌曲列表
 */
export function useFidImport({ themeColor, songs, onStatusChange }: UseFidImportOptions) {
    const [isImporting, setIsImporting] = useState(false);

    /**
     * 验证 fid 格式
     */
    const validateFid = (fid: string): number | null => {
        const trimmed = fid.trim();
        if (!trimmed) {
            notifications.show({
                title: "请输入 fid",
                message: "收藏夹 fid 不能为空",
                color: "orange",
            });
            return null;
        }

        const parsed = Number(trimmed);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            notifications.show({
                title: "fid 格式不正确",
                message: "请输入有效的数字 ID",
                color: "red",
            });
            return null;
        }

        return parsed;
    };

    /**
     * 从 B站 API 获取收藏夹 BVID 列表
     */
    const fetchFavoriteBVIDs = async (mediaID: number): Promise<{ bvid: string; title?: string; cover?: string }[]> => {
        try {
            const result = await Services.GetFavoriteCollectionBVIDs(mediaID);

            if (!result || result.length === 0) {
                throw new Error("收藏夹为空或不存在");
            }

            return result.map(item => ({
                bvid: item.bvid,
                title: item.title,
                cover: item.cover,
            }));
        } catch (error) {
            const errMsg = String(error);
            if (errMsg.includes("不存在") || errMsg.includes("无权限")) {
                throw new Error("收藏夹不存在或无权限访问");
            } else if (errMsg.includes("为空")) {
                throw new Error("收藏夹为空");
            }
            throw error;
        }
    };

    /**
     * 解析 BVID 获取歌曲详情
     */
    const parseBVID = async (bvid: string): Promise<Song | null> => {
        try {
            const result = await Services.ResolveBiliAudio(bvid);

            return {
                id: bvid,
                bvid: bvid,
                name: result.title || bvid,
                singer: result.author || "",
                singerId: "",
                cover: result.cover || "",
                streamUrl: "",
                streamUrlExpiresAt: new Date().toISOString(),
                lyric: "",
                lyricOffset: 0,
                skipStartTime: 0,
                skipEndTime: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            } as Song;
        } catch (error) {
            console.error(`解析 ${bvid} 失败:`, error);
            return null;
        }
    };

    /**
     * 批量解析 BVID
     */
    const parseBVIDs = async (
        bvids: { bvid: string; title?: string; cover?: string }[]
    ): Promise<{ newSongs: Song[]; existingSongs: Song[] }> => {
        const newSongs: Song[] = [];
        const existingSongs: Song[] = [];

        for (let i = 0; i < bvids.length; i++) {
            const { bvid, title, cover } = bvids[i];

            // 更新进度
            onStatusChange?.(`正在解析 ${i + 1}/${bvids.length}: ${bvid}`);

            // 检查是否已存在
            const existing = songs.find(s => s.bvid === bvid);
            if (existing) {
                existingSongs.push(existing);
                continue;
            }

            // 如果 API 返回了标题和封面，优先使用（避免额外请求）
            if (title && cover) {
                newSongs.push({
                    id: bvid,
                    bvid,
                    name: title,
                    singer: "",
                    singerId: "",
                    cover,
                    streamUrl: "",
                    streamUrlExpiresAt: new Date().toISOString(),
                    lyric: "",
                    lyricOffset: 0,
                    skipStartTime: 0,
                    skipEndTime: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                } as Song);
            } else {
                // 否则调用解析 API 获取详细信息
                const song = await parseBVID(bvid);
                if (song) {
                    newSongs.push(song);
                }
            }

            // 避免请求过快
            if (i < bvids.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        return { newSongs, existingSongs };
    };

    /**
     * 导入收藏夹
     */
    const importFromFid = async (fid: string): Promise<ImportResult | null> => {
        // 验证 fid
        const mediaID = validateFid(fid);
        if (mediaID === null) {
            return null;
        }

        setIsImporting(true);
        const toastId = notifications.show({
            title: "正在导入...",
            message: "正在获取收藏夹信息",
            color: themeColor,
            loading: true,
            autoClose: false,
        });

        try {
            // Step 1: 获取收藏夹信息（标题）
            onStatusChange?.("正在获取收藏夹信息...");
            let collectionTitle = "";
            try {
                const collectionInfo = await Services.GetFavoriteCollectionInfo(mediaID);
                collectionTitle = collectionInfo.title || "";
                console.log('[useFidImport] 收藏夹信息:', collectionInfo);
            } catch (error) {
                console.warn('[useFidImport] 获取收藏夹信息失败，继续导入:', error);
            }

            // Step 2: 获取 BVID 列表
            onStatusChange?.("正在获取收藏夹内容...");
            const bvids = await fetchFavoriteBVIDs(mediaID);

            notifications.update({
                id: toastId,
                message: `找到 ${bvids.length} 个视频，开始解析...`,
            });

            // Step 3: 批量解析 BVID
            const { newSongs, existingSongs } = await parseBVIDs(bvids);

            // Step 4: 显示结果
            notifications.update({
                id: toastId,
                title: "导入完成",
                message: `新增 ${newSongs.length} 首，已存在 ${existingSongs.length} 首`,
                color: "green",
                loading: false,
                autoClose: 3000,
            });

            onStatusChange?.("");
            return {
                newSongs,
                existingSongs,
                totalCount: bvids.length,
                collectionTitle, // 返回收藏夹标题
            };
        } catch (error) {
            const errMsg = String(error);
            console.error("导入失败:", error);

            notifications.update({
                id: toastId,
                title: "导入失败",
                message: errMsg,
                color: "red",
                loading: false,
                autoClose: 5000,
            });

            onStatusChange?.("");
            return null;
        } finally {
            setIsImporting(false);
        }
    };

    return {
        isImporting,
        importFromFid,
    };
}
