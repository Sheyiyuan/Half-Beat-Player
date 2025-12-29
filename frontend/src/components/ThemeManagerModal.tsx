import React from "react";
import { Box, Button, Card, Group, Modal, Stack, Text } from "@mantine/core";
import { Theme } from "../types";

export type ThemeManagerModalProps = {
    opened: boolean;
    onClose: () => void;
    themes: Theme[];
    currentThemeId: string | null;
    onSelectTheme: (theme: Theme) => void;
    onEditTheme: (theme: Theme) => void;
    onDeleteTheme: (id: string) => void | Promise<void>;
    onCreateTheme: () => void;
    accentColor: string;
    panelStyles?: any;
    derived?: any;
};

const ThemeManagerModal: React.FC<ThemeManagerModalProps> = ({
    opened,
    onClose,
    themes,
    currentThemeId,
    onSelectTheme,
    onEditTheme,
    onDeleteTheme,
    onCreateTheme,
    accentColor,
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
        <Modal opened={opened} onClose={onClose} title="主题管理" centered size="md" radius={derived?.componentRadius} styles={modalStyles} className={panelStyles ? "glass-panel" : ""}>
            <Stack gap="sm">
                {themes.map((theme) => (
                    <Card key={theme.id} p="sm" radius={derived?.componentRadius} withBorder style={{
                        backgroundColor: derived ? derived.controlBackground : undefined,
                        borderColor: "transparent",
                        color: derived ? derived.textColorPrimary : undefined,
                    }}>
                        <Group justify="space-between">
                            <div>
                                <Text fw={500} size="sm" style={{ color: derived?.textColorPrimary }}>{theme.name}</Text>
                                <Group gap="xs" mt="4">
                                    <Box
                                        w={20}
                                        h={20}
                                        style={{ backgroundColor: theme.themeColor, borderRadius: 4, border: "1px solid #ccc" }}
                                    />
                                    <Text size="xs" style={{ color: derived?.textColorSecondary }}>{theme.themeColor}</Text>
                                </Group>
                            </div>
                            <Group gap="xs">
                                <Button
                                    size="xs"
                                    variant={currentThemeId === theme.id ? "filled" : "light"}
                                    color={theme.themeColor}
                                    radius={derived?.componentRadius}
                                    onClick={() => onSelectTheme(theme)}
                                >
                                    {currentThemeId === theme.id ? "已选" : "选择"}
                                </Button>
                                {!theme.isReadOnly && (
                                    <Button
                                        size="xs"
                                        variant="light"
                                        color={theme.themeColor}
                                        radius={derived?.componentRadius}
                                        onClick={() => onEditTheme(theme)}
                                    >
                                        编辑
                                    </Button>
                                )}
                                {!theme.isReadOnly && (
                                    <Button
                                        size="xs"
                                        variant="light"
                                        color="red"
                                        radius={derived?.componentRadius}
                                        onClick={() => onDeleteTheme(theme.id)}
                                    >
                                        删除
                                    </Button>
                                )}
                            </Group>
                        </Group>
                    </Card>
                ))}
                <Button
                    fullWidth
                    variant="light"
                    color={accentColor}
                    radius={derived?.componentRadius}
                    onClick={onCreateTheme}
                >
                    + 新建主题
                </Button>
            </Stack>
        </Modal>
    );
};

export default ThemeManagerModal;
