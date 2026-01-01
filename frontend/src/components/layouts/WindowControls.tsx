import React, { useState, useEffect } from "react";
import { ActionIcon, Group, Modal, Radio, Checkbox, Button } from "@mantine/core";
import { Minus, Square, X, Copy } from "lucide-react";
import { notifications } from "@mantine/notifications";
import * as Services from "../../../wailsjs/go/services/Service";
import { useThemeContext } from "../../context";

type ExitBehavior = "minimize" | "quit";
const EXIT_BEHAVIOR_KEY = "half-beat.exitBehavior";

interface WindowControlsProps {
    themeColor?: string;
    controlBackground?: string;
    textColorPrimary?: string;
    textColorSecondary?: string;
    componentRadius?: number;
}

export const WindowControls: React.FC<WindowControlsProps> = ({
    themeColor: propThemeColor,
    controlBackground: propControlBackground,
    textColorPrimary: propTextColorPrimary,
    textColorSecondary: propTextColorSecondary,
    componentRadius: propComponentRadius,
}) => {
    const [isMaximized, setIsMaximized] = useState(false);
    const [exitModalOpen, setExitModalOpen] = useState(false);
    const [rememberChoice, setRememberChoice] = useState(false);
    const [exitChoice, setExitChoice] = useState<ExitBehavior>("minimize");
    const { state: themeState } = useThemeContext();

    // 优先使用 props，否则回退到 context
    const themeColor = propThemeColor || themeState.themeColor;
    const controlBackground = propControlBackground;
    const textColorPrimary = propTextColorPrimary || themeState.textColorPrimary;
    const textColorSecondary = propTextColorSecondary || themeState.textColorSecondary;
    const componentRadius = propComponentRadius ?? themeState.componentRadius;

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

    const handleCloseClick = () => {
        // 检查是否有记忆的选择
        const stored = localStorage.getItem(EXIT_BEHAVIOR_KEY) as ExitBehavior | null;
        if (stored === "minimize" || stored === "quit") {
            // 直接执行记忆的选择
            executeExitBehavior(stored);
        } else {
            // 显示对话框让用户选择
            setExitModalOpen(true);
        }
    };

    const executeExitBehavior = async (behavior: ExitBehavior) => {
        try {
            if (behavior === "minimize") {
                await Services.MinimizeToTray();
            } else {
                await Services.QuitApp();
            }
        } catch (error) {
            console.error("Error executing exit behavior:", error);
            notifications.show({
                title: "关闭失败",
                message: String(error),
                color: "red",
                autoClose: 5000,
            });
        }
    };

    const handleConfirmExit = () => {
        if (rememberChoice) {
            localStorage.setItem(EXIT_BEHAVIOR_KEY, exitChoice);
        }
        setExitModalOpen(false);
        executeExitBehavior(exitChoice);
    };

    return (
        <>
            <Group gap={0} wrap="nowrap">
                <ActionIcon
                    variant="subtle"
                    size="lg"
                    radius={componentRadius}
                    onClick={handleMinimize}
                    title="最小化"
                    className="window-control"
                    color={themeColor}
                    style={{ backgroundColor: controlBackground }}
                >
                    <Minus size={16} />
                </ActionIcon>
                <ActionIcon
                    variant="subtle"
                    size="lg"
                    radius={componentRadius}
                    onClick={handleMaximize}
                    title={isMaximized ? "还原" : "最大化"}
                    className="window-control"
                    color={themeColor}
                    style={{ backgroundColor: controlBackground }}
                >
                    {isMaximized ? <Copy size={16} /> : <Square size={16} />}
                </ActionIcon>
                <ActionIcon
                    variant="subtle"
                    size="lg"
                    radius={componentRadius}
                    onClick={handleCloseClick}
                    title="关闭"
                    className="window-control"
                    color="red"
                    style={{ backgroundColor: controlBackground }}
                >
                    <X size={16} />
                </ActionIcon>
            </Group>

            <Modal
                opened={exitModalOpen}
                onClose={() => setExitModalOpen(false)}
                title="关闭应用"
                centered
                size="sm"
                radius={componentRadius}
                styles={{
                    content: {
                        backgroundColor: "var(--glass-panel-color)",
                        backdropFilter: "blur(20px)",
                        color: textColorPrimary,
                    },
                    header: {
                        backgroundColor: "transparent",
                        color: textColorPrimary,
                    },
                    title: {
                        fontWeight: 600,
                    }
                }}
                className="normal-panel"
            >
                <div style={{ marginBottom: "16px" }}>
                    <Radio.Group
                        value={exitChoice}
                        onChange={(value) => setExitChoice(value as ExitBehavior)}
                        label="选择关闭时的行为"
                        size="sm"
                        styles={{
                            label: { color: textColorPrimary }
                        }}
                    >
                        <Radio value="minimize" label="最小化到托盘" style={{ marginBottom: "8px" }} styles={{ label: { color: textColorPrimary } }} />
                        <Radio value="quit" label="直接退出应用" styles={{ label: { color: textColorPrimary } }} />
                    </Radio.Group>
                </div>

                <Checkbox
                    checked={rememberChoice}
                    onChange={(e) => setRememberChoice(e.currentTarget.checked)}
                    label="记住我的选择"
                    size="sm"
                    style={{ marginBottom: "16px" }}
                    styles={{ label: { color: textColorPrimary } }}
                />

                <Group justify="flex-end" gap="xs">
                    <Button
                        variant="subtle"
                        size="sm"
                        radius={componentRadius}
                        onClick={() => setExitModalOpen(false)}
                        style={{ color: textColorPrimary }}
                    >
                        取消
                    </Button>
                    <Button
                        size="sm"
                        color={themeColor}
                        radius={componentRadius}
                        onClick={handleConfirmExit}
                    >
                        确定
                    </Button>
                </Group>
            </Modal>
        </>
    );
};
