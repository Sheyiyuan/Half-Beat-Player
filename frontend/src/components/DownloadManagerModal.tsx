import React from "react";
import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import type { Song } from "../types";

interface DownloadManagerModalProps {
    opened: boolean;
    managingSong: Song | null;
    confirmDeleteDownloaded: boolean;
    onClose: () => void;
    onOpenFile: () => void;
    onDeleteFile: () => void;
    onToggleConfirmDelete: (value: boolean) => void;
}

const DownloadManagerModal: React.FC<DownloadManagerModalProps> = ({
    opened,
    managingSong,
    confirmDeleteDownloaded,
    onClose,
    onOpenFile,
    onDeleteFile,
    onToggleConfirmDelete,
}) => {
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            size="sm"
            centered
            title="下载文件管理"
            overlayProps={{ blur: 10, opacity: 0.35 }}
        >
            <Stack gap="md">
                <Text fw={600}>{managingSong?.name || '未选择歌曲'}</Text>
                <Group justify="space-between">
                    <Button variant="default" onClick={onOpenFile}>在文件管理器中打开</Button>
                    <Group gap="xs">
                        {!confirmDeleteDownloaded ? (
                            <Button variant="light" color="red" onClick={() => onToggleConfirmDelete(true)}>删除下载文件</Button>
                        ) : (
                            <Button color="red" onClick={onDeleteFile}>确认删除</Button>
                        )}
                    </Group>
                </Group>
            </Stack>
        </Modal>
    );
};

export default DownloadManagerModal;
