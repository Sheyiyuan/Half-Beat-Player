import {
    Modal,
    Group,
    Button,
    Stack,
    Table,
    Badge,
    Progress,
    Text,
    ActionIcon,
    ThemeIcon,
    Tooltip,
    ScrollArea,
} from '@mantine/core';
import { Trash2, Download, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { DownloadTask } from '../../hooks/features/useDownloadManager';

interface DownloadTasksModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: DownloadTask[];
    activeTaskId: string | null;
    onCancelDownload: (songId: string) => void;
    onClearCompleted: () => void;
    onClearAll: () => void;
    themeColor: string;
    componentRadius: number | string;
}

/**
 * 下载任务管理模态框
 * 显示当前和历史的下载转码任务
 */
export function DownloadTasksModal({
    isOpen,
    onClose,
    tasks,
    activeTaskId,
    onCancelDownload,
    onClearCompleted,
    onClearAll,
    themeColor,
    componentRadius,
}: DownloadTasksModalProps) {
    // 状态标签
    const getStatusBadge = (status: DownloadTask['status']) => {
        const statusMap = {
            pending: { label: '等待中', color: 'gray' as const },
            downloading: { label: '下载中', color: 'blue' as const },
            transcoding: { label: '转码中', color: 'cyan' as const },
            completed: { label: '完成', color: 'green' as const },
            failed: { label: '失败', color: 'red' as const },
            cancelled: { label: '已取消', color: 'orange' as const },
        };
        const s = statusMap[status];
        return <Badge color={s.color}>{s.label}</Badge>;
    };

    // 状态图标
    const getStatusIcon = (status: DownloadTask['status']) => {
        const iconMap = {
            pending: <Clock size={16} />,
            downloading: <Download size={16} />,
            transcoding: <Download size={16} />,
            completed: <CheckCircle size={16} />,
            failed: <AlertCircle size={16} />,
            cancelled: <X size={16} />,
        };
        const colorMap = {
            pending: 'gray',
            downloading: 'blue',
            transcoding: 'cyan',
            completed: 'green',
            failed: 'red',
            cancelled: 'orange',
        };
        return <ThemeIcon color={colorMap[status]} size="sm" variant="light">{iconMap[status]}</ThemeIcon>;
    };

    // 格式标签
    const getFormatLabel = (format: 'source' | 'mp3') => {
        return format === 'mp3' ? 'MP3' : 'M4S';
    };

    // 时长计算
    const getDuration = (task: DownloadTask) => {
        if (!task.endTime) return '-';
        const duration = (task.endTime - task.startTime) / 1000;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        return `${minutes}m${seconds}s`;
    };

    // 统计信息
    const stats = {
        total: tasks.length,
        downloading: tasks.filter((t) => t.status === 'downloading' || t.status === 'transcoding').length,
        completed: tasks.filter((t) => t.status === 'completed').length,
        failed: tasks.filter((t) => t.status === 'failed').length,
    };

    return (
        <Modal
            opened={isOpen}
            onClose={onClose}
            title="📥 下载任务"
            size="lg"
            centered
            radius={componentRadius}
        >
            <Stack gap="md">
                {/* 统计信息 */}
                {tasks.length > 0 && (
                    <Group grow>
                        <div>
                            <Text size="sm" c="dimmed">
                                总计
                            </Text>
                            <Text fw={500} size="lg">
                                {stats.total}
                            </Text>
                        </div>
                        <div>
                            <Text size="sm" c="dimmed">
                                转码中
                            </Text>
                            <Text fw={500} size="lg" c="blue">
                                {stats.downloading}
                            </Text>
                        </div>
                        <div>
                            <Text size="sm" c="dimmed">
                                已完成
                            </Text>
                            <Text fw={500} size="lg" c="green">
                                {stats.completed}
                            </Text>
                        </div>
                        <div>
                            <Text size="sm" c="dimmed">
                                失败
                            </Text>
                            <Text fw={500} size="lg" c="red">
                                {stats.failed}
                            </Text>
                        </div>
                    </Group>
                )}

                {/* 任务列表 */}
                {tasks.length === 0 ? (
                    <Text ta="center" c="dimmed" py="xl">
                        没有下载任务
                    </Text>
                ) : (
                    <ScrollArea style={{ height: 400 }}>
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>歌曲</Table.Th>
                                    <Table.Th>格式</Table.Th>
                                    <Table.Th>状态</Table.Th>
                                    <Table.Th>进度</Table.Th>
                                    <Table.Th>时长</Table.Th>
                                    <Table.Th>操作</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {tasks.map((task) => (
                                    <Table.Tr key={task.songId} bg={activeTaskId === task.songId ? 'var(--mantine-color-gray-1)' : undefined}>
                                        <Table.Td>
                                            <Tooltip label={task.songName} position="top">
                                                <Text truncate size="sm">
                                                    {task.songName}
                                                </Text>
                                            </Tooltip>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{getFormatLabel(task.format)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={4}>
                                                {getStatusIcon(task.status)}
                                                {getStatusBadge(task.status)}
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Stack gap={2}>
                                                <Progress value={task.progress} size="sm" color={themeColor} />
                                                <Text size="xs" c="dimmed">
                                                    {task.progress}%
                                                </Text>
                                            </Stack>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm">{getDuration(task)}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={4}>
                                                {(task.status === 'pending' ||
                                                    task.status === 'downloading' ||
                                                    task.status === 'transcoding') && (
                                                        <Tooltip label="取消" position="top">
                                                            <ActionIcon
                                                                size="xs"
                                                                variant="light"
                                                                color="orange"
                                                                onClick={() => onCancelDownload(task.songId)}
                                                            >
                                                                <X size={14} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    )}
                                                {task.error && (
                                                    <Tooltip label={task.error} position="top">
                                                        <ActionIcon size="xs" variant="light" color="red" disabled>
                                                            <AlertCircle size={14} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                )}
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>
                )}

                {/* 操作按钮 */}
                {tasks.length > 0 && (
                    <Group justify="flex-end">
                        {stats.completed > 0 && (
                            <Button
                                size="sm"
                                variant="light"
                                onClick={onClearCompleted}
                            >
                                清除已完成 ({stats.completed})
                            </Button>
                        )}
                        {tasks.length > 0 && (
                            <Button
                                size="sm"
                                variant="light"
                                color="red"
                                onClick={onClearAll}
                            >
                                清除全部
                            </Button>
                        )}
                    </Group>
                )}

                {/* 关闭按钮 */}
                <Group justify="flex-end">
                    <Button variant="default" onClick={onClose}>
                        关闭
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
