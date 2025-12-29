import React from "react";
import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { SettingsExitBehavior } from "./SettingsExitBehavior";

interface SettingsModalProps {
    opened: boolean;
    themeColor: string;
    appVersion: string | number;
    cacheSize: number;
    onClose: () => void;
    onClearLoginCache: () => void;
    onClearThemeCache: () => void;
    onOpenDownloadsFolder: () => void;
    onOpenDatabaseFile: () => void;
    onClearMusicCache: () => void;
    onClearAllCache: () => void;
    panelStyles?: React.CSSProperties;
    derived?: any;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    opened,
    themeColor,
    appVersion,
    cacheSize,
    onClose,
    onClearLoginCache,
    onClearThemeCache,
    onOpenDownloadsFolder,
    onOpenDatabaseFile,
    onClearMusicCache,
    onClearAllCache,
    panelStyles,
    derived,
}) => {
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            size="md"
            centered
            title="设置"
            overlayProps={{ blur: 10, opacity: 0.35 }}
            radius={derived?.componentRadius}
            styles={{
                content: {
                    backgroundColor: derived?.modalBackground,
                    color: derived?.textColorPrimary,
                },
                header: {
                    backgroundColor: "transparent",
                    color: derived?.textColorPrimary,
                },
                title: {
                    fontWeight: 600,
                }
            }}
            className="glass-panel"
        >
            <Stack gap="md">
                <Text fw={600} c={derived?.textColorPrimary}>软件信息</Text>
                <Text c={derived?.textColorPrimary}>half-beat v{appVersion}</Text>
                <Text size="sm" c={derived?.textColorSecondary}>更好的 bilibili 音乐播放器</Text>

                <Text fw={600} mt="sm" c={derived?.textColorPrimary}>缓存</Text>
                <Group>
                    <Button variant="default" radius={derived?.componentRadius} onClick={onClearLoginCache} styles={{ root: { backgroundColor: derived?.controlBackground, color: derived?.textColorPrimary } }}>清除登录缓存</Button>
                    <Button variant="default" radius={derived?.componentRadius} onClick={onClearThemeCache} styles={{ root: { backgroundColor: derived?.controlBackground, color: derived?.textColorPrimary } }}>清除主题缓存</Button>
                    <Button variant="default" radius={derived?.componentRadius} onClick={onClearMusicCache} styles={{ root: { backgroundColor: derived?.controlBackground, color: derived?.textColorPrimary } }}>清除音乐缓存 ({(cacheSize / 1024 / 1024).toFixed(2)} MB)</Button>
                    <Button color={themeColor} radius={derived?.componentRadius} onClick={onClearAllCache}>清除所有缓存</Button>
                </Group>

                <Text fw={600} mt="sm" c={derived?.textColorPrimary}>下载</Text>
                <Group>
                    <Button variant="default" radius={derived?.componentRadius} onClick={onOpenDownloadsFolder} styles={{ root: { backgroundColor: derived?.controlBackground, color: derived?.textColorPrimary } }}>在文件管理器中打开下载目录</Button>
                </Group>

                <Text fw={600} mt="sm" c={derived?.textColorPrimary}>数据库</Text>
                <Group>
                    <Button variant="default" radius={derived?.componentRadius} onClick={onOpenDatabaseFile} styles={{ root: { backgroundColor: derived?.controlBackground, color: derived?.textColorPrimary } }}>打开数据库文件</Button>
                </Group>

                <Text fw={600} mt="sm" c={derived?.textColorPrimary}>窗口设置</Text>
                <SettingsExitBehavior />
            </Stack>
        </Modal>
    );
};

export default SettingsModal;
