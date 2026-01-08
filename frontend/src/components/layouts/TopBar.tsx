import React from "react";
import { ActionIcon, Avatar, Button, Group, Menu, Text } from "@mantine/core";
import { LogOut, Palette, Search, Settings as SettingsIcon } from "lucide-react";
import { notifications } from "@mantine/notifications";
import * as Services from "../../../wailsjs/go/services/Service";
import { WindowControls } from "./";
import { useImageProxy } from "../../hooks/ui/useImageProxy";

interface UserInfo {
    username: string;
    face: string;
    level: number;
}

interface TopBarProps {
    userInfo: UserInfo | null;
    hitokoto: string;
    panelBackground: string;
    panelStyles: React.CSSProperties;
    onSearchClick: () => void;
    onThemeClick: () => void;
    onSettingsClick: () => void;
    onLoginClick: () => void;
    onLogout: () => void;
    windowControlsPos?: string;
    themeColor?: string;
    componentRadius?: number;
    controlBackground?: string;
    controlStyles?: React.CSSProperties;
    textColorPrimary?: string;
    textColorSecondary?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
    userInfo,
    hitokoto,
    panelBackground,
    panelStyles,
    onSearchClick,
    onThemeClick,
    onSettingsClick,
    onLoginClick,
    onLogout,
    windowControlsPos = 'right',
    themeColor,
    componentRadius = 8,
    controlBackground,
    controlStyles,
    textColorPrimary,
    textColorSecondary,
}) => {
    const { getProxiedImageUrlSync } = useImageProxy();

    const handleLogout = async () => {
        try {
            await Services.Logout();
            localStorage.removeItem("half-beat.userInfo");
            onLogout();
            notifications.show({
                title: "已退出",
                message: "您已成功退出登录",
                color: "blue",
            });
        } catch (error) {
            notifications.show({
                title: "退出失败",
                message: String(error),
                color: "red",
            });
        }
    };

    return (
        <Group
            justify="space-between"
            align="center"
            className="glass-panel"
            style={{
                ...panelStyles,
                // Wails frameless window drag support
                // The runtime listens for mousedown on elements whose computed style has --wails-draggable: drag
                // CSS custom properties inherit, interactive elements are excluded in index.css
                ["--wails-draggable" as any]: "drag",
                minHeight: "52px",
                padding: "8px 12px",
                flex: "0 0 auto",
                backgroundColor: panelBackground,
                border: "1px solid var(--mantine-color-default-border)",
                cursor: "grab",
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
            wrap="nowrap"
        >
            <div style={{ flex: 0, display: "flex", alignItems: "center", gap: "4px" }}>
                {windowControlsPos === 'left' && (
                    <WindowControls
                        themeColor={themeColor}
                        controlBackground={controlBackground}
                        textColorPrimary={textColorPrimary}
                        textColorSecondary={textColorSecondary}
                    />
                )}
                <ActionIcon
                    variant="default"
                    size="lg"
                    radius={componentRadius}
                    onClick={onSearchClick}
                    title="搜索视频 (BV 号或链接)"
                    style={{ ...controlStyles, borderColor: "transparent", color: textColorPrimary }}
                >
                    <Search size={16} />
                </ActionIcon>
            </div>

            <div style={{ flex: 1, textAlign: "center" }}>
                <Text size="sm" style={{ textAlign: "center", color: textColorSecondary }}>
                    {hitokoto}
                </Text>
            </div>

            <Group gap="xs" style={{ flex: 0 }} wrap="nowrap">
                {userInfo ? (
                    <Menu trigger="hover" openDelay={100} closeDelay={400} position="bottom-end" withArrow radius={componentRadius}>
                        <Menu.Target>
                            <div className="app-no-drag">
                                <Avatar
                                    src={getProxiedImageUrlSync(userInfo.face)}
                                    alt={userInfo.username}
                                    size={28}
                                    radius={componentRadius}
                                    style={{
                                        border: "2px solid " + themeColor,
                                        cursor: "pointer",
                                    }}
                                />
                            </div>
                        </Menu.Target>
                        <Menu.Dropdown style={{ backgroundColor: panelBackground, backdropFilter: undefined, WebkitBackdropFilter: undefined }}>
                            <Menu.Label>
                                <Text size="xs" fw={700} style={{ color: themeColor }}>
                                    {userInfo.username}
                                </Text>
                                <Text size="xs" style={{ color: textColorSecondary }}>
                                    Lv.{userInfo.level}
                                </Text>
                            </Menu.Label>
                            <Menu.Divider />
                            <Menu.Item
                                color="red"
                                leftSection={<LogOut size={14} />}
                                onClick={handleLogout}
                            >
                                退出登录
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                ) : (
                    <Button
                        size="xs"
                        variant="light"
                        color={themeColor}
                        radius={componentRadius}
                        onClick={onLoginClick}
                        title="登录 B 站账号以获取高质量音频"
                    >
                        登录
                    </Button>
                )}
                <ActionIcon
                    variant="default"
                    size="lg"
                    radius={componentRadius}
                    onClick={onThemeClick}
                    title="主题设置"
                    style={{ ...controlStyles, borderColor: "transparent", color: textColorPrimary }}
                >
                    <Palette size={16} />
                </ActionIcon>
                <ActionIcon
                    variant="default"
                    size="lg"
                    radius={componentRadius}
                    onClick={onSettingsClick}
                    title="设置"
                    style={{ ...controlStyles, borderColor: "transparent", color: textColorPrimary }}
                >
                    <SettingsIcon size={16} />
                </ActionIcon>
                {windowControlsPos === 'right' && (
                    <WindowControls
                        themeColor={themeColor}
                        controlBackground={controlBackground}
                        textColorPrimary={textColorPrimary}
                        textColorSecondary={textColorSecondary}
                    />
                )}
            </Group>
        </Group>
    );
};
