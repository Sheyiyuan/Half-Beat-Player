import React from "react";
import { Button, Group, Modal, Stack, Text, Select } from "@mantine/core";

interface SettingsModalProps {
    opened: boolean;
    themeColor: string;
    appVersion: string | number;
    cacheSize: number;
    exitBehavior: string;
    onClose: () => void;
    onClearLoginCache: () => void;
    onClearThemeCache: () => void;
    onOpenDownloadsFolder: () => void;
    onClearMusicCache: () => void;
    onClearAllCache: () => void;
    onExitBehaviorChange: (value: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    opened,
    themeColor,
    appVersion,
    cacheSize,
    exitBehavior,
    onClose,
    onClearLoginCache,
    onClearThemeCache,
    onOpenDownloadsFolder,
    onClearMusicCache,
    onClearAllCache,
    onExitBehaviorChange,
}) => {
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            size="md"
            centered
            title="设置"
            overlayProps={{ blur: 10, opacity: 0.35 }}
        >
            <Stack gap="md">
                <Text fw={600}>软件信息</Text>
                <Text>half-beat v{appVersion}</Text>
                <Text size="sm" c="dimmed">更好的 bilibili 音乐播放器</Text>

                <Text fw={600} mt="sm">缓存</Text>
                <Group>
                    <Button variant="default" onClick={onClearLoginCache}>清除登录缓存</Button>
                    <Button variant="default" onClick={onClearThemeCache}>清除主题缓存</Button>
                    <Button variant="default" onClick={onOpenDownloadsFolder}>在文件管理器中打开下载目录</Button>
                    <Button variant="default" onClick={onClearMusicCache}>清除音乐缓存 ({(cacheSize / 1024 / 1024).toFixed(2)} MB)</Button>
                    <Button color={themeColor} onClick={onClearAllCache}>清除所有缓存</Button>
                </Group>

                <Text fw={600} mt="sm">退出行为</Text>
                <Select
                    value={exitBehavior}
                    onChange={(value) => value && onExitBehaviorChange(value)}
                    data={[
                        { value: 'ask', label: '询问我' },
                        { value: 'minimize', label: '最小化到系统托盘' },
                        { value: 'quit', label: '直接退出应用' },
                    ]}
                    description="设置点击关闭按钮时的行为（仅限Linux）"
                />
            </Stack>
        </Modal>
    );
};

export default SettingsModal;
