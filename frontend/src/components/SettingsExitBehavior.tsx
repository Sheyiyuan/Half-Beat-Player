import React, { useEffect, useState } from "react";
import { Radio, Stack, Text } from "@mantine/core";

type ExitBehavior = "minimize" | "quit";
const EXIT_BEHAVIOR_KEY = "half-beat.exitBehavior";

interface SettingsExitBehaviorProps {
    label?: string;
    description?: string;
}

export const SettingsExitBehavior: React.FC<SettingsExitBehaviorProps> = ({
    label = "关闭按钮行为",
    description = "选择点击关闭按钮时应该执行的操作",
}) => {
    const [choice, setChoice] = useState<ExitBehavior>("minimize");

    useEffect(() => {
        // 从 localStorage 读取用户的选择
        const stored = localStorage.getItem(EXIT_BEHAVIOR_KEY) as ExitBehavior | null;
        if (stored === "minimize" || stored === "quit") {
            setChoice(stored);
        }
    }, []);

    const handleChange = (value: string) => {
        const behavior = value as ExitBehavior;
        setChoice(behavior);
        // 立即保存到 localStorage
        localStorage.setItem(EXIT_BEHAVIOR_KEY, behavior);
    };

    return (
        <Stack gap="sm">
            {description && <Text size="sm" c="dimmed">{description}</Text>}
            <Radio.Group
                value={choice}
                onChange={handleChange}
                label={label}
                size="sm"
            >
                <Radio
                    value="minimize"
                    label="最小化到托盘（保持应用运行）"
                    style={{ marginBottom: "8px" }}
                />
                <Radio
                    value="quit"
                    label="直接退出应用（完全关闭）"
                />
            </Radio.Group>
        </Stack>
    );
};
