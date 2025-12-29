import React, { RefObject, useState, useEffect } from "react";
import { Button, ColorInput, Group, Modal, Slider, Stack, Text, TextInput, Select, Fieldset, Divider } from "@mantine/core";

export type ThemeEditorModalProps = {
    opened: boolean;
    onClose: () => void;
    onCancel: () => void;
    editingThemeId: string | null;
    newThemeName: string;
    onNameChange: (value: string) => void;
    themeColorDraft: string;
    onThemeColorChange: (value: string) => void;
    backgroundColorDraft: string;
    onBackgroundColorChange: (value: string) => void;
    backgroundOpacityDraft: number;
    onBackgroundOpacityChange: (value: number) => void;
    backgroundImageUrlDraft: string;
    onBackgroundImageChange: (value: string) => void;
    onClearBackgroundImage: () => void;
    backgroundBlurDraft: number;
    onBackgroundBlurChange: (value: number) => void;
    panelColorDraft: string;
    onPanelColorChange: (value: string) => void;
    panelOpacityDraft: number;
    onPanelOpacityChange: (value: number) => void;
    panelBlurDraft: number;
    onPanelBlurChange: (value: number) => void;
    panelRadiusDraft: number;
    onPanelRadiusChange: (value: number) => void;
    controlColorDraft: string;
    onControlColorChange: (value: string) => void;
    controlOpacityDraft: number;
    onControlOpacityChange: (value: number) => void;
    controlBlurDraft: number;
    onControlBlurChange: (value: number) => void;
    textColorPrimaryDraft: string;
    onTextColorPrimaryChange: (value: string) => void;
    textColorSecondaryDraft: string;
    onTextColorSecondaryChange: (value: string) => void;
    favoriteCardColorDraft: string;
    onFavoriteCardColorChange: (value: string) => void;
    cardOpacityDraft: number;
    onCardOpacityChange: (value: number) => void;
    componentRadiusDraft: number;
    onComponentRadiusChange: (value: number) => void;
    modalRadiusDraft: number;
    onModalRadiusChange: (value: number) => void;
    notificationRadiusDraft: number;
    onNotificationRadiusChange: (value: number) => void;
    coverRadiusDraft: number;
    onCoverRadiusChange: (value: number) => void;
    modalColorDraft: string;
    onModalColorChange: (value: string) => void;
    modalOpacityDraft: number;
    onModalOpacityChange: (value: number) => void;
    modalBlurDraft: number;
    onModalBlurChange: (value: number) => void;
    windowControlsPosDraft: string;
    onWindowControlsPosChange: (value: string) => void;
    onSubmit: () => Promise<void>;
    savingTheme: boolean;
    fileInputRef: RefObject<HTMLInputElement>;
    onBackgroundFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    panelStyles?: any;
    derived?: any;
};

const ThemeEditorModal: React.FC<ThemeEditorModalProps> = ({
    opened,
    onClose,
    onCancel,
    editingThemeId,
    newThemeName,
    onNameChange,
    themeColorDraft,
    onThemeColorChange,
    backgroundColorDraft,
    onBackgroundColorChange,
    backgroundOpacityDraft,
    onBackgroundOpacityChange,
    backgroundImageUrlDraft,
    onBackgroundImageChange,
    onClearBackgroundImage,
    backgroundBlurDraft,
    onBackgroundBlurChange,
    panelColorDraft,
    onPanelColorChange,
    panelOpacityDraft,
    onPanelOpacityChange,
    panelBlurDraft,
    onPanelBlurChange,
    panelRadiusDraft,
    onPanelRadiusChange,
    controlColorDraft,
    onControlColorChange,
    controlOpacityDraft,
    onControlOpacityChange,
    controlBlurDraft,
    onControlBlurChange,
    textColorPrimaryDraft,
    onTextColorPrimaryChange,
    textColorSecondaryDraft,
    onTextColorSecondaryChange,
    favoriteCardColorDraft,
    onFavoriteCardColorChange,
    cardOpacityDraft,
    onCardOpacityChange,
    componentRadiusDraft,
    onComponentRadiusChange,
    modalRadiusDraft,
    onModalRadiusChange,
    notificationRadiusDraft,
    onNotificationRadiusChange,
    coverRadiusDraft,
    onCoverRadiusChange,
    modalColorDraft,
    onModalColorChange,
    modalOpacityDraft,
    onModalOpacityChange,
    modalBlurDraft,
    onModalBlurChange,
    windowControlsPosDraft,
    onWindowControlsPosChange,
    onSubmit,
    savingTheme,
    fileInputRef,
    onBackgroundFileChange,
    panelStyles,
    derived,
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
    const modalStyles = derived ? {
        content: {
            ...panelStyles,
            backgroundColor: derived.modalBackground,
            color: derived.textColorPrimary,
        },
        header: {
            backgroundColor: "transparent",
            color: derived.textColorPrimary,
        },
        title: {
            color: derived.textColorPrimary,
            fontWeight: 600,
        }
    } : undefined;

    const inputStyles = derived ? {
        input: {
            backgroundColor: derived.controlBackground,
            color: derived.textColorPrimary,
            borderColor: "transparent",
            borderRadius: derived.componentRadius,
        },
        label: {
            color: derived.textColorPrimary,
        }
    } : undefined;

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={editingThemeId ? "编辑主题" : "新建主题"}
            centered
            size="md"
            radius={derived?.componentRadius}
            styles={modalStyles}
            className="glass-panel"
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={onBackgroundFileChange}
            />
            <Stack gap="md">
                <Fieldset legend="基础设置" variant="unstyled" styles={{ legend: { color: derived?.textColorPrimary, fontWeight: 600 } }}>
                    <Stack gap="sm">
                        <TextInput
                            label="主题名称"
                            value={newThemeName}
                            onChange={(e) => onNameChange(e.currentTarget.value)}
                            placeholder="输入主题名称"
                            size="sm"
                            styles={inputStyles}
                        />
                        <ColorInput
                            label="主题色"
                            value={themeColorDraft}
                            onChange={onThemeColorChange}
                            size="sm"
                            disallowInput={false}
                            format="hex"
                            styles={inputStyles}
                        />
                    </Stack>
                </Fieldset>

                <Fieldset legend="背景设置" variant="unstyled" styles={{ legend: { color: derived?.textColorPrimary, fontWeight: 600 } }}>
                    <Stack gap="sm">
                        <ColorInput
                            label="背景色"
                            value={backgroundColorDraft}
                            onChange={onBackgroundColorChange}
                            size="sm"
                            disallowInput={false}
                            format="hex"
                            styles={inputStyles}
                        />
                        <Stack gap={2}>
                            <Text size="xs" fw={500} c={derived?.textColorPrimary}>背景不透明度</Text>
                            <Slider
                                value={backgroundOpacityDraft * 100}
                                onChange={(v) => onBackgroundOpacityChange(v / 100)}
                                min={0}
                                max={100}
                                step={1}
                                label={(v) => `${Math.round(v)}%`}
                                color={themeColorDraft}
                            />
                        </Stack>
                        <Stack gap={2}>
                            <Text size="xs" fw={500} c={derived?.textColorPrimary}>背景模糊</Text>
                            <Slider
                                value={backgroundBlurDraft}
                                onChange={onBackgroundBlurChange}
                                min={0}
                                max={50}
                                step={1}
                                label={(v) => `${Math.round(v)}px`}
                                color={themeColorDraft}
                            />
                        </Stack>
                        <Divider label="背景图" labelPosition="center" size="xs" styles={{ label: { color: derived?.textColorSecondary } }} />
                        <TextInput
                            label="背景图 URL"
                            value={backgroundImageUrlDraft}
                            onChange={(e) => onBackgroundImageChange(e.currentTarget.value)}
                            placeholder="https://example.com/bg.jpg"
                            size="sm"
                            styles={inputStyles}
                        />
                        <Group grow gap="xs">
                            <Button size="xs" variant="light" color={themeColorDraft} onClick={() => fileInputRef.current?.click()}>
                                上传本地图片
                            </Button>
                            <Button
                                size="xs"
                                variant={pendingClear ? "filled" : "light"}
                                color={pendingClear ? "red" : "gray"}
                                onClick={handleClearClick}
                                disabled={!backgroundImageUrlDraft || backgroundImageUrlDraft.length === 0}
                            >
                                {pendingClear ? "确认清除？" : "清除背景图"}
                            </Button>
                        </Group>
                    </Stack>
                </Fieldset>

                <Fieldset legend="面板设置" variant="unstyled" styles={{ legend: { color: derived?.textColorPrimary, fontWeight: 600 } }}>
                    <Stack gap="sm">
                        <ColorInput
                            label="面板颜色"
                            value={panelColorDraft}
                            onChange={onPanelColorChange}
                            size="sm"
                            disallowInput={false}
                            format="hex"
                            styles={inputStyles}
                        />
                        <Stack gap={2}>
                            <Text size="xs" fw={500} c={derived?.textColorPrimary}>面板不透明度</Text>
                            <Slider
                                value={panelOpacityDraft * 100}
                                onChange={(v) => onPanelOpacityChange(v / 100)}
                                min={20}
                                max={100}
                                step={1}
                                label={(v) => `${Math.round(v)}%`}
                                color={themeColorDraft}
                            />
                        </Stack>
                        <Stack gap={2}>
                            <Text size="xs" fw={500} c={derived?.textColorPrimary}>面板模糊</Text>
                            <Slider
                                value={panelBlurDraft}
                                onChange={onPanelBlurChange}
                                min={0}
                                max={30}
                                step={1}
                                label={(v) => `${Math.round(v)}px`}
                                color={themeColorDraft}
                            />
                        </Stack>
                        <Stack gap={2}>
                            <Text size="xs" fw={500} c={derived?.textColorPrimary}>面板圆角</Text>
                            <Slider
                                value={panelRadiusDraft}
                                onChange={onPanelRadiusChange}
                                min={0}
                                max={32}
                                step={1}
                                label={(v) => `${Math.round(v)}px`}
                                color={themeColorDraft}
                            />
                        </Stack>
                    </Stack>
                </Fieldset>

                <Fieldset legend="控件与文字" variant="unstyled" styles={{ legend: { color: derived?.textColorPrimary, fontWeight: 600 } }}>
                    <Stack gap="sm">
                        <Group grow gap="xs">
                            <ColorInput
                                label="控件背景色"
                                value={controlColorDraft}
                                onChange={onControlColorChange}
                                size="sm"
                                disallowInput={false}
                                format="hex"
                                styles={inputStyles}
                            />
                            <Stack gap={2}>
                                <Text size="xs" fw={500} c={derived?.textColorPrimary}>控件不透明度</Text>
                                <Slider
                                    value={controlOpacityDraft * 100}
                                    onChange={(v) => onControlOpacityChange(v / 100)}
                                    min={0}
                                    max={100}
                                    step={1}
                                    label={(v) => `${Math.round(v)}%`}
                                    color={themeColorDraft}
                                />
                            </Stack>
                        </Group>
                        <Stack gap={2}>
                            <Text size="xs" fw={500} c={derived?.textColorPrimary}>控件模糊</Text>
                            <Slider
                                value={controlBlurDraft}
                                onChange={onControlBlurChange}
                                min={0}
                                max={20}
                                step={1}
                                label={(v) => `${Math.round(v)}px`}
                                color={themeColorDraft}
                            />
                        </Stack>
                        <Group grow gap="xs">
                            <ColorInput
                                label="主要文字颜色"
                                value={textColorPrimaryDraft}
                                onChange={onTextColorPrimaryChange}
                                size="sm"
                                disallowInput={false}
                                format="hex"
                                styles={inputStyles}
                            />
                            <ColorInput
                                label="次要文字颜色"
                                value={textColorSecondaryDraft}
                                onChange={onTextColorSecondaryChange}
                                size="sm"
                                disallowInput={false}
                                format="hex"
                                styles={inputStyles}
                            />
                        </Group>
                    </Stack>
                </Fieldset>

                <Fieldset legend="歌单卡片" variant="unstyled" styles={{ legend: { color: derived?.textColorPrimary, fontWeight: 600 } }}>
                    <Stack gap="sm">
                        <ColorInput
                            label="卡片背景色"
                            value={favoriteCardColorDraft}
                            onChange={onFavoriteCardColorChange}
                            size="sm"
                            disallowInput={false}
                            format="hex"
                            styles={inputStyles}
                        />
                        <Stack gap={2}>
                            <Text size="xs" fw={500} c={derived?.textColorPrimary}>卡片不透明度</Text>
                            <Slider
                                value={cardOpacityDraft * 100}
                                onChange={(v) => onCardOpacityChange(v / 100)}
                                min={0}
                                max={100}
                                step={1}
                                label={(v) => `${Math.round(v)}%`}
                                color={themeColorDraft}
                            />
                        </Stack>
                    </Stack>
                </Fieldset>

                <Fieldset legend="弹窗" variant="unstyled" styles={{ legend: { color: derived?.textColorPrimary, fontWeight: 600 } }}>
                    <Stack gap="sm">
                        <ColorInput
                            label="弹窗背景色"
                            value={modalColorDraft}
                            onChange={onModalColorChange}
                            size="sm"
                            disallowInput={false}
                            format="hex"
                            styles={inputStyles}
                        />
                        <Stack gap={2}>
                            <Text size="xs" fw={500} c={derived?.textColorPrimary}>弹窗不透明度</Text>
                            <Slider
                                value={modalOpacityDraft * 100}
                                onChange={(v) => onModalOpacityChange(v / 100)}
                                min={0}
                                max={100}
                                step={1}
                                label={(v) => `${Math.round(v)}%`}
                                color={themeColorDraft}
                            />
                        </Stack>
                        <Stack gap={2}>
                            <Text size="xs" fw={500} c={derived?.textColorPrimary}>弹窗模糊度</Text>
                            <Slider
                                value={modalBlurDraft}
                                onChange={onModalBlurChange}
                                min={0}
                                max={30}
                                step={1}
                                label={(v) => `${Math.round(v)}px`}
                                color={themeColorDraft}
                            />
                        </Stack>
                    </Stack>
                </Fieldset>

                <Fieldset legend="其他设置" variant="unstyled" styles={{ legend: { color: derived?.textColorPrimary, fontWeight: 600 } }}>
                    <Stack gap="sm">
                        <Stack gap={2}>
                            <Text size="xs" fw={500} c={derived?.textColorPrimary}>组件圆角 (按钮/输入框)</Text>
                            <Slider
                                value={componentRadiusDraft}
                                onChange={onComponentRadiusChange}
                                min={0}
                                max={32}
                                step={1}
                                label={(v) => `${Math.round(v)}px`}
                                color={themeColorDraft}
                            />
                        </Stack>
                        <Stack gap={2}>
                            <Text size="xs" fw={500} c={derived?.textColorPrimary}>弹窗圆角</Text>
                            <Slider
                                value={modalRadiusDraft}
                                onChange={onModalRadiusChange}
                                min={0}
                                max={32}
                                step={1}
                                label={(v) => `${Math.round(v)}px`}
                                color={themeColorDraft}
                            />
                        </Stack>
                        <Stack gap={2}>
                            <Text size="xs" fw={500} c={derived?.textColorPrimary}>通知圆角</Text>
                            <Slider
                                value={notificationRadiusDraft}
                                onChange={onNotificationRadiusChange}
                                min={0}
                                max={32}
                                step={1}
                                label={(v) => `${Math.round(v)}px`}
                                color={themeColorDraft}
                            />
                        </Stack>
                        <Stack gap={2}>
                            <Text size="xs" fw={500} c={derived?.textColorPrimary}>封面圆角</Text>
                            <Slider
                                value={coverRadiusDraft}
                                onChange={onCoverRadiusChange}
                                min={0}
                                max={50}
                                step={1}
                                label={(v) => `${Math.round(v)}px`}
                                color={themeColorDraft}
                            />
                        </Stack>
                        <Select
                            label="窗口管理按钮位置"
                            placeholder="选择窗口按钮位置"
                            data={[
                                { value: 'left', label: '左侧' },
                                { value: 'right', label: '右侧' },
                                { value: 'hidden', label: '隐藏' },
                            ]}
                            value={windowControlsPosDraft}
                            onChange={(value) => onWindowControlsPosChange(value || 'right')}
                            size="sm"
                            radius={derived?.componentRadius}
                            styles={inputStyles}
                        />
                    </Stack>
                </Fieldset>

                <Group justify="flex-end" gap="sm" mt="md">
                    <Button variant="subtle" color={themeColorDraft} onClick={onCancel} radius={derived?.componentRadius} style={{ color: derived?.textColorPrimary }}>
                        取消
                    </Button>
                    <Button
                        color={themeColorDraft}
                        loading={savingTheme}
                        radius={derived?.componentRadius}
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
