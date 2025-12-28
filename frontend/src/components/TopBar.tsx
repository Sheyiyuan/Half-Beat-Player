import React from "react";
import { ActionIcon, Button, Group, Text } from "@mantine/core";
import { Palette, Search, Settings as SettingsIcon } from "lucide-react";
import { notifications } from "@mantine/notifications";
import * as Services from "../../wailsjs/go/services/Service";
import { useThemeContext } from "../context";

interface UserInfo {
    username: string;
    face: string;
    level: number;
}

interface TopBarProps {
    userInfo: UserInfo | null;
    hitokoto: string;
    onSearchClick: () => void;
    onThemeClick: () => void;
    onSettingsClick: () => void;
    onLoginClick: () => void;
    onLogout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
    userInfo,
    hitokoto,
    onSearchClick,
    onThemeClick,
    onSettingsClick,
    onLoginClick,
    onLogout,
}) => {
    const { state: themeState } = useThemeContext();
    const { themeColor } = themeState;
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
        <Group justify="space-between" align="center">
            <ActionIcon
                variant="default"
                size="lg"
                onClick={onSearchClick}
                title="搜索视频 (BV 号或链接)"
            >
                <Search size={16} />
            </ActionIcon>
            <Text size="sm" c="dimmed" style={{ textAlign: "center", flex: 1 }}>
                {hitokoto}
            </Text>
            <Group gap="xs">
                {userInfo ? (
                    <Group gap="xs">
                        <img
                            src={userInfo.face}
                            alt={userInfo.username}
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                border: "2px solid " + themeColor,
                            }}
                            title={`${userInfo.username} (Lv.${userInfo.level})`}
                        />
                        <Text size="sm" fw={500}>
                            {userInfo.username}
                        </Text>
                        <Button
                            size="xs"
                            variant="subtle"
                            color="red"
                            onClick={handleLogout}
                        >
                            退出
                        </Button>
                    </Group>
                ) : (
                    <Button
                        size="xs"
                        variant="light"
                        onClick={onLoginClick}
                        title="登录 B 站账号以获取高质量音频"
                    >
                        登录
                    </Button>
                )}
                <ActionIcon
                    variant="default"
                    size="lg"
                    onClick={onThemeClick}
                    title="主题设置"
                >
                    <Palette size={16} />
                </ActionIcon>
                <ActionIcon
                    variant="default"
                    size="lg"
                    onClick={onSettingsClick}
                    title="设置"
                >
                    <SettingsIcon size={16} />
                </ActionIcon>
            </Group>
        </Group>
    );
};
