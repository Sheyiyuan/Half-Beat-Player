import React, { RefObject, useState, useEffect } from "react";
import { Button, ColorInput, Group, Modal, Slider, Stack, Text, TextInput } from "@mantine/core";

export type ThemeEditorModalProps = {
    opened: boolean;
    onClose: () => void;
    onCancel: () => void;
    editingThemeId: string | null;
    newThemeName: string;
    onNameChange: (value: string) => void;
    colorSchemeDraft: "light" | "dark";
    onColorSchemeChange: (scheme: "light" | "dark") => void;
    themeColorDraft: string;
    onThemeColorChange: (value: string) => void;
    backgroundColorDraft: string;
    onBackgroundColorChange: (value: string) => void;
    backgroundOpacityDraft: number;
    onBackgroundOpacityChange: (value: number) => void;
    backgroundImageUrlDraft: string;
    onBackgroundImageChange: (value: string) => void;
    onClearBackgroundImage: () => void;
    panelColorDraft: string;
    onPanelColorChange: (value: string) => void;
    panelOpacityDraft: number;
    onPanelOpacityChange: (value: number) => void;
    onSubmit: () => Promise<void>;
    savingTheme: boolean;
    fileInputRef: RefObject<HTMLInputElement>;
    onBackgroundFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const ThemeEditorModal: React.FC<ThemeEditorModalProps> = ({
    opened,
    onClose,
    onCancel,
    editingThemeId,
    newThemeName,
    onNameChange,
    colorSchemeDraft,
    onColorSchemeChange,
    themeColorDraft,
    onThemeColorChange,
    backgroundColorDraft,
    onBackgroundColorChange,
    backgroundOpacityDraft,
    onBackgroundOpacityChange,
    backgroundImageUrlDraft,
    onBackgroundImageChange,
    onClearBackgroundImage,
    panelColorDraft,
    onPanelColorChange,
    panelOpacityDraft,
    onPanelOpacityChange,
    onSubmit,
    savingTheme,
    fileInputRef,
    onBackgroundFileChange,
}) => {
    const [pendingClear, setPendingClear] = useState(false);

    // 重置确认状态当模态框关闭或背景图改变时
    useEffect(() => {
        if (!opened) {
            setPendingClear(false);
        }
    }, [opened]);

    useEffect(() => {
        setPendingClear(false);
    }, [backgroundImageUrlDraft]);

    // 3秒后自动取消确认状态
    useEffect(() => {
        if (!pendingClear) return;
        const timer = setTimeout(() => setPendingClear(false), 3000);
        return () => clearTimeout(timer);
    }, [pendingClear]);

    const handleClearClick = () => {
        if (!pendingClear) {
            setPendingClear(true);
        } else {
            onClearBackgroundImage();
            setPendingClear(false);
        }
    };
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={editingThemeId ? "编辑主题" : "新建主题"}
            centered
            size="md"
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={onBackgroundFileChange}
            />
            <Stack gap="sm">
                <TextInput
                    label="主题名称"
                    value={newThemeName}
                    onChange={(e) => onNameChange(e.currentTarget.value)}
                    placeholder="输入主题名称"
                />
                <Stack gap={2}>
                    <Text size="xs" c="dimmed">色彩模式</Text>
                    <Group gap="xs">
                        <Button
                            size="xs"
                            variant={colorSchemeDraft === "light" ? "filled" : "light"}
                            color={themeColorDraft}
                            onClick={() => onColorSchemeChange("light")}
                        >
                            亮色
                        </Button>
                        <Button
                            size="xs"
                            variant={colorSchemeDraft === "dark" ? "filled" : "light"}
                            color={themeColorDraft}
                            onClick={() => onColorSchemeChange("dark")}
                        >
                            暗色
                        </Button>
                    </Group>
                </Stack>
                <ColorInput
                    label="主题色"
                    value={themeColorDraft}
                    onChange={onThemeColorChange}
                    size="sm"
                    disallowInput={false}
                    format="hex"
                />
                <ColorInput
                    label="背景色"
                    value={backgroundColorDraft}
                    onChange={onBackgroundColorChange}
                    size="sm"
                    disallowInput={false}
                    format="hex"
                />
                <ColorInput
                    label="面板颜色"
                    value={panelColorDraft}
                    onChange={onPanelColorChange}
                    size="sm"
                    disallowInput={false}
                    format="hex"
                />
                <Stack gap={2}>
                    <Text size="xs" c="dimmed">背景不透明度</Text>
                    <Slider
                        value={backgroundOpacityDraft * 100}
                        onChange={(v) => onBackgroundOpacityChange(v / 100)}
                        min={0}
                        max={100}
                        step={1}
                        label={(v) => `${Math.round(v)}%`}
                        style={{ '--slider-color': themeColorDraft } as any}
                    />
                </Stack>
                <Stack gap="xs">
                    <TextInput
                        label="背景图 URL"
                        value={backgroundImageUrlDraft}
                        onChange={(e) => onBackgroundImageChange(e.currentTarget.value)}
                        placeholder="https://example.com/bg.jpg"
                        size="sm"
                    />
                    <Button
                        size="xs"
                        variant={pendingClear ? "filled" : "light"}
                        color={pendingClear ? "red" : "gray"}
                        onClick={handleClearClick}
                        disabled={!backgroundImageUrlDraft || backgroundImageUrlDraft.length === 0}
                        fullWidth
                    >
                        {pendingClear ? "确认清除？" : "清除背景图"}
                    </Button>
                </Stack>
                <Button size="xs" variant="light" color={themeColorDraft} onClick={() => fileInputRef.current?.click()}>
                    上传本地背景图
                </Button>
                <Stack gap={2}>
                    <Text size="xs" c="dimmed">组件不透明度</Text>
                    <Slider
                        value={panelOpacityDraft * 100}
                        onChange={(v) => onPanelOpacityChange(v / 100)}
                        min={20}
                        max={100}
                        step={1}
                        label={(v) => `${Math.round(v)}%`}
                        style={{ '--slider-color': themeColorDraft } as any}
                    />
                </Stack>
                <Group justify="flex-end" gap="sm">
                    <Button variant="subtle" color={themeColorDraft} onClick={onCancel}>
                        取消
                    </Button>
                    <Button
                        color={themeColorDraft}
                        loading={savingTheme}
                        onClick={onSubmit}
                    >
                        {editingThemeId ? "保存" : "创建"}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default ThemeEditorModal;
