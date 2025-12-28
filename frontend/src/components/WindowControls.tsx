import React, { useState, useEffect } from "react";
import { ActionIcon, Group } from "@mantine/core";
import { Minus, Square, X, Copy } from "lucide-react";
import * as Services from "../../wailsjs/go/services/Service";
import { useThemeContext } from "../context";

export const WindowControls: React.FC = () => {
    const [isMaximized, setIsMaximized] = useState(false);
    const { state: themeState } = useThemeContext();
    const { themeColor } = themeState;

    // 定期检查窗口最大化状态
    useEffect(() => {
        const checkMaximized = async () => {
            try {
                const maximised = await Services.IsWindowMaximized();
                setIsMaximized(maximised);
            } catch (error) {
                console.error("Failed to check window maximized state:", error);
            }
        };

        // 初始检查
        checkMaximized();

        // 每 500ms 检查一次
        const interval = setInterval(checkMaximized, 500);

        return () => clearInterval(interval);
    }, []);

    const handleMinimize = () => {
        Services.MinimiseWindow();
    };

    const handleMaximize = async () => {
        try {
            if (isMaximized) {
                await Services.UnmaximizeWindow();
            } else {
                await Services.MaximizeWindow();
            }
            // 延迟让窗口状态更新完成
            setTimeout(async () => {
                try {
                    const maximised = await Services.IsWindowMaximized();
                    setIsMaximized(maximised);
                } catch (error) {
                    console.error("Failed to check window maximized state:", error);
                }
            }, 500);
        } catch (error) {
            console.error("Error in handleMaximize:", error);
        }
    };

    const handleClose = () => {
        Services.CloseWindow();
    };

    return (
        <Group gap={0} wrap="nowrap">
            <ActionIcon
                variant="subtle"
                size="lg"
                onClick={handleMinimize}
                title="最小化"
                className="window-control"
                color={themeColor}
            >
                <Minus size={16} />
            </ActionIcon>
            <ActionIcon
                variant="subtle"
                size="lg"
                onClick={handleMaximize}
                title={isMaximized ? "还原" : "最大化"}
                className="window-control"
                color={themeColor}
            >
                {isMaximized ? <Copy size={16} /> : <Square size={16} />}
            </ActionIcon>
            <ActionIcon
                variant="subtle"
                size="lg"
                onClick={handleClose}
                title="关闭"
                className="window-control"
                color="red"
            >
                <X size={16} />
            </ActionIcon>
        </Group>
    );
};
