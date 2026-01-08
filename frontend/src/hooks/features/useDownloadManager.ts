import { useCallback, useEffect, useRef, useState } from 'react';
import { notifications } from '@mantine/notifications';
import * as Services from '../../../wailsjs/go/services/Service';
import * as runtime from '../../../wailsjs/runtime';
import { Song } from '../../types';

/**
 * 下载任务信息
 */
export interface DownloadTask {
    songId: string;
    songName: string;
    format: 'mp3'; // 固定使用 MP3 格式
    status: 'pending' | 'downloading' | 'transcoding' | 'completed' | 'failed' | 'cancelled';
    progress: number; // 0-100
    error?: string;
    fileSize?: number; // 完成后的文件大小
    startTime: number;
    endTime?: number;
    outputPath?: string;
}

interface UseDownloadManagerReturn {
    // 状态
    tasks: DownloadTask[];
    activeTaskId: string | null;

    // 操作
    downloadSong: (song: Song) => Promise<void>;
    downloadMultiple: (songs: Song[]) => Promise<void>;
    cancelDownload: (songId: string) => void;
    clearCompleted: () => void;
    clearAll: () => void;

    // 查询
    getTaskStatus: (songId: string) => DownloadTask | undefined;
    isDownloading: boolean;
    completedCount: number;
    failedCount: number;
}

/**
 * 下载管理 Hook
 * - 管理下载队列和状态
 * - 监听 Wails 事件
 * - 处理错误和重试
 */
export function useDownloadManager(openModal?: (name: string) => void): UseDownloadManagerReturn {
    const [tasks, setTasks] = useState<DownloadTask[]>([]);
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const queueRef = useRef<DownloadTask[]>([]);
    const cancelledRef = useRef<Set<string>>(new Set());

    // 监听 Wails 转码事件
    useEffect(() => {
        // 监听转码进度
        const unsubscribeProgress = runtime.EventsOn('transcode:progress', (data: any) => {
            setTasks((prev) => {
                const updated = [...prev];
                const idx = updated.findIndex((t) => t.songId === data.songId);
                if (idx !== -1) {
                    updated[idx] = {
                        ...updated[idx],
                        progress: data.percent || 0,
                        status: 'transcoding',
                    };
                }
                return updated;
            });
        });

        // 监听转码完成
        const unsubscribeComplete = runtime.EventsOn('transcode:complete', (data: any) => {
            setTasks((prev) => {
                const updated = [...prev];
                const idx = updated.findIndex((t) => t.songId === data.songId);
                if (idx !== -1) {
                    updated[idx] = {
                        ...updated[idx],
                        status: 'completed',
                        progress: 100,
                        endTime: Date.now(),
                        fileSize: data.fileSize,
                        outputPath: data.outputPath,
                    };
                }
                return updated;
            });
            notifications.show({
                message: `MP3 转码完成`,
                color: 'green',
                autoClose: 3000,
            });
        });

        // 监听转码错误
        const unsubscribeError = runtime.EventsOn('transcode:error', (data: any) => {
            setTasks((prev) => {
                const updated = [...prev];
                const idx = updated.findIndex((t) => t.songId === data.songId);
                if (idx !== -1) {
                    updated[idx] = {
                        ...updated[idx],
                        status: 'failed',
                        error: data.error || '转码失败',
                        endTime: Date.now(),
                    };
                }
                return updated;
            });
            notifications.show({
                message: `转码失败: ${data.error || '未知错误'}`,
                color: 'red',
                autoClose: 5000,
            });
        });

        return () => {
            unsubscribeProgress();
            unsubscribeComplete();
            unsubscribeError();
        };
    }, []);

    // 执行下载任务
    const executeDownload = useCallback(
        async (task: DownloadTask) => {
            try {
                setActiveTaskId(task.songId);
                setTasks((prev) => {
                    const updated = [...prev];
                    const idx = updated.findIndex((t) => t.songId === task.songId);
                    if (idx !== -1) {
                        updated[idx] = { ...updated[idx], status: 'downloading' };
                    }
                    return updated;
                });

                // 调用后端下载
                const result = await Services.DownloadSong(task.songId);

                if (!cancelledRef.current.has(task.songId)) {
                    setTasks((prev) => {
                        const updated = [...prev];
                        const idx = updated.findIndex((t) => t.songId === task.songId);
                        if (idx !== -1) {
                            updated[idx] = {
                                ...updated[idx],
                                status: task.format === 'mp3' ? 'transcoding' : 'completed',
                                progress: task.format === 'mp3' ? 0 : 100,
                                outputPath: result,
                                endTime: task.format === 'mp3' ? undefined : Date.now(),
                            };
                        }
                        return updated;
                    });

                    if (task.format !== 'mp3') {
                        notifications.show({
                            message: `${task.songName} 下载完成`,
                            color: 'green',
                            autoClose: 3000,
                        });
                    }
                }
            } catch (error) {
                if (!cancelledRef.current.has(task.songId)) {
                    const errorMsg = error instanceof Error ? error.message : '下载失败';
                    setTasks((prev) => {
                        const updated = [...prev];
                        const idx = updated.findIndex((t) => t.songId === task.songId);
                        if (idx !== -1) {
                            updated[idx] = {
                                ...updated[idx],
                                status: 'failed',
                                error: errorMsg,
                                endTime: Date.now(),
                            };
                        }
                        return updated;
                    });
                    notifications.show({
                        message: `${task.songName} 下载失败: ${errorMsg}`,
                        color: 'red',
                        autoClose: 5000,
                    });
                }
            } finally {
                setActiveTaskId(null);
            }
        },
        [notifications]
    );

    // 处理队列
    useEffect(() => {
        if (queueRef.current.length > 0 && activeTaskId === null) {
            const task = queueRef.current.shift();
            if (task && !cancelledRef.current.has(task.songId)) {
                executeDownload(task);
            }
        }
    }, [activeTaskId, executeDownload]);

    // 下载单个歌曲
    const downloadSong = useCallback(
        async (song: Song) => {
            const existing = tasks.find((t) => t.songId === song.id);
            if (existing && (existing.status === 'downloading' || existing.status === 'transcoding')) {
                notifications.show({
                    message: '该歌曲正在下载中',
                    color: 'yellow',
                    autoClose: 2000,
                });
                return;
            }

            const newTask: DownloadTask = {
                songId: song.id,
                songName: song.name,
                format: 'mp3',
                status: 'pending',
                progress: 0,
                startTime: Date.now(),
            };

            setTasks((prev) => [...prev, newTask]);
            queueRef.current.push(newTask);

            // 打开下载模态框
            if (openModal) {
                openModal('downloadTasksModal');
            }

            // 触发队列处理
            if (activeTaskId === null) {
                const task = queueRef.current.shift();
                if (task) {
                    executeDownload(task);
                }
            }
        },
        [tasks, activeTaskId, executeDownload, openModal]
    );

    // 批量下载
    const downloadMultiple = useCallback(
        async (songs: Song[]) => {
            const newTasks: DownloadTask[] = songs.map((song) => ({
                songId: song.id,
                songName: song.name,
                format: 'mp3',
                status: 'pending',
                progress: 0,
                startTime: Date.now(),
            }));

            setTasks((prev) => [...prev, ...newTasks]);
            queueRef.current.push(...newTasks);

            notifications.show({
                message: `已添加 ${songs.length} 个歌曲到下载队列`,
                color: 'blue',
                autoClose: 2000,
            });

            // 打开下载模态框
            if (openModal) {
                openModal('downloadTasksModal');
            }
            // 触发队列处理
            if (activeTaskId === null) {
                const task = queueRef.current.shift();
                if (task) {
                    executeDownload(task);
                }
            }
        },
        [activeTaskId, executeDownload, openModal]
    );

    // 取消下载
    const cancelDownload = useCallback((songId: string) => {
        cancelledRef.current.add(songId);
        setTasks((prev) =>
            prev.map((t) =>
                t.songId === songId && (t.status === 'pending' || t.status === 'downloading')
                    ? { ...t, status: 'cancelled', endTime: Date.now() }
                    : t
            )
        );
    }, []);

    // 清除已完成的任务
    const clearCompleted = useCallback(() => {
        setTasks((prev) => prev.filter((t) => t.status !== 'completed'));
    }, []);

    // 清除所有任务
    const clearAll = useCallback(() => {
        setTasks([]);
        cancelledRef.current.clear();
        queueRef.current = [];
    }, []);

    // 获取任务状态
    const getTaskStatus = useCallback(
        (songId: string) => tasks.find((t) => t.songId === songId),
        [tasks]
    );

    // 统计信息
    const isDownloading = activeTaskId !== null || queueRef.current.length > 0;
    const completedCount = tasks.filter((t) => t.status === 'completed').length;
    const failedCount = tasks.filter((t) => t.status === 'failed').length;

    return {
        tasks,
        activeTaskId,
        downloadSong,
        downloadMultiple,
        cancelDownload,
        clearCompleted,
        clearAll,
        getTaskStatus,
        isDownloading,
        completedCount,
        failedCount,
    };
}
