import React, { useEffect, useRef } from "react";
import { ActionIcon, Button, Group, Text } from "@mantine/core";
import { Palette, Search, Settings as SettingsIcon } from "lucide-react";
import { notifications } from "@mantine/notifications";
import * as Services from "../../wailsjs/go/services/Service";
import { useThemeContext } from "../context";
import { WindowControls } from "./WindowControls";

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
    const dragAreaRef = useRef<HTMLDivElement>(null);

    // 实现窗口拖拽功能
    useEffect(() => {
        const dragArea = dragAreaRef.current;
        if (!dragArea) return;

        const handleMouseDown = (e: MouseEvent) => {
            // 检查点击是否在可拖拽区域（hitokoto 文本区域）
            if ((e.target as HTMLElement).closest(".window-control")) {
                return;
            }
            if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("[role='button']")) {
                return;
            }

            // 调用后端拖拽方法
            Services.DragWindow();
        };

        dragArea.addEventListener("mousedown", handleMouseDown);

        return () => {
            dragArea.removeEventListener("mousedown", handleMouseDown);
        };
    }, []);

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
        <Group justify="space-between" align="center" style={{ minHeight: "52px", padding: "8px 12px", flex: "0 0 auto" }} wrap="nowrap">
            <div style={{ flex: 0 }}>
                <ActionIcon
                    variant="default"
                    size="lg"
                    onClick={onSearchClick}
                    title="搜索视频 (BV 号或链接)"
                >
                    <Search size={16} />
                </ActionIcon>
            </div>

            <div
                ref={dragAreaRef}
                style={{
                    flex: 1,
                    textAlign: "center",
                    cursor: "grab",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    WebkitAppRegion: "drag" as any,
                }}
            >
                <Text size="sm" c="dimmed" style={{ textAlign: "center" }}>
                    {hitokoto}
                </Text>
            </div>

            <Group gap="xs" style={{ flex: 0 }} wrap="nowrap">
                {userInfo ? (
                    <Group gap="xs" wrap="nowrap">
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
                <WindowControls />
            </Group>
        </Group>
    );
};
