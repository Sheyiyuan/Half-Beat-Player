import React from "react";
import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import type { Song } from "../../types";

interface DownloadManagerModalProps {
    opened: boolean;
    managingSong: Song | null;
    confirmDeleteDownloaded: boolean;
    onClose: () => void;
    onOpenFile: () => void;
    onDeleteFile: () => void;
    onToggleConfirmDelete: (value: boolean) => void;
    panelStyles?: any;
    derived?: any;
}

const DownloadManagerModal: React.FC<DownloadManagerModalProps> = ({
    opened,
    managingSong,
    confirmDeleteDownloaded,
    onClose,
    onOpenFile,
    onDeleteFile,
    onToggleConfirmDelete,
    panelStyles,
    derived,
}) => {
    const modalStyles = derived ? {
        content: {
            backgroundColor: derived.modalBackground,
            backdropFilter: panelStyles?.backdropFilter,
            color: derived.textColorPrimary,
        },
        header: {
            backgroundColor: "transparent",
            color: derived.textColorPrimary,
        },
        title: {
            color: derived.textColorPrimary,
        }
    } : undefined;

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            size="sm"
            centered
            title="下载文件管理"
            styles={modalStyles}
            className="normal-panel"
        >
            <Stack gap="md">
                <Text fw={600} style={{ color: derived?.textColorPrimary }}>{managingSong?.name || '未选择歌曲'}</Text>
                <Group justify="space-between">
                    <Button variant="subtle" onClick={onOpenFile} style={{ color: derived?.textColorPrimary }}>在文件管理器中打开</Button>
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
