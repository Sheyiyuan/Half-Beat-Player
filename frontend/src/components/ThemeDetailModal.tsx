import React, { RefObject, useState, useEffect, useCallback } from "react";
import { Button, ColorInput, Group, Modal, Slider, Stack, Text, TextInput, Select, Fieldset, Divider, Tabs, Textarea, Alert, Box } from "@mantine/core";
import { AlertCircle } from "lucide-react";

export type ThemeDetailModalProps = {
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
    isReadOnly?: boolean;
};

// 主题对象完整结构定义
interface ThemeObject {
    name: string;
    themeColor: string;
    backgroundColor: string;
    backgroundOpacity: number;
    backgroundImage: string;
    backgroundBlur: number;
    panelColor: string;
    panelOpacity: number;
    panelBlur: number;
    panelRadius: number;
    controlColor: string;
    controlOpacity: number;
    controlBlur: number;
    textColorPrimary: string;
    textColorSecondary: string;
    favoriteCardColor: string;
    cardOpacity: number;
    componentRadius: number;
    modalRadius: number;
    notificationRadius: number;
    coverRadius: number;
    modalColor: string;
    modalOpacity: number;
    modalBlur: number;
    windowControlsPos: string;
}

const ThemeDetailModal: React.FC<ThemeDetailModalProps> = ({
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
    isReadOnly = false,
}) => {
    const [pendingClear, setPendingClear] = useState(false);
    const [activeTab, setActiveTab] = useState<string | null>("gui");
    const [jsonError, setJsonError] = useState<string>("");
    const [jsonText, setJsonText] = useState("");

    // 建立 Theme Object 和 JSON 之间的同步
    const buildThemeObject = useCallback((): ThemeObject => ({
        name: newThemeName,
        themeColor: themeColorDraft,
        backgroundColor: backgroundColorDraft,
        backgroundOpacity: backgroundOpacityDraft,
        backgroundImage: backgroundImageUrlDraft,
        backgroundBlur: backgroundBlurDraft,
        panelColor: panelColorDraft,
        panelOpacity: panelOpacityDraft,
        panelBlur: panelBlurDraft,
        panelRadius: panelRadiusDraft,
        controlColor: controlColorDraft,
        controlOpacity: controlOpacityDraft,
        controlBlur: controlBlurDraft,
        textColorPrimary: textColorPrimaryDraft,
        textColorSecondary: textColorSecondaryDraft,
        favoriteCardColor: favoriteCardColorDraft,
        cardOpacity: cardOpacityDraft,
        componentRadius: componentRadiusDraft,
        modalRadius: modalRadiusDraft,
        notificationRadius: notificationRadiusDraft,
        coverRadius: coverRadiusDraft,
        modalColor: modalColorDraft,
        modalOpacity: modalOpacityDraft,
        modalBlur: modalBlurDraft,
        windowControlsPos: windowControlsPosDraft,
    }), [
        newThemeName, themeColorDraft, backgroundColorDraft, backgroundOpacityDraft,
        backgroundImageUrlDraft, backgroundBlurDraft, panelColorDraft, panelOpacityDraft,
        panelBlurDraft, panelRadiusDraft, controlColorDraft, controlOpacityDraft,
        controlBlurDraft, textColorPrimaryDraft, textColorSecondaryDraft,
        favoriteCardColorDraft, cardOpacityDraft, componentRadiusDraft,
        modalRadiusDraft, notificationRadiusDraft, coverRadiusDraft,
        modalColorDraft, modalOpacityDraft, modalBlurDraft, windowControlsPosDraft
    ]);

    // 当打开 Modal 时，初始化 JSON 文本
    useEffect(() => {
        if (opened && activeTab === "json") {
            const themeObj = buildThemeObject();
            setJsonText(JSON.stringify(themeObj, null, 2));
            setJsonError("");
        }
    }, [opened, activeTab, buildThemeObject]);

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

    // JSON 模式切换时的同步
    const handleTabChange = (tab: string | null) => {
        if (tab === "json") {
            // 从 GUI 切换到 JSON：更新 JSON 文本
            const themeObj = buildThemeObject();
            setJsonText(JSON.stringify(themeObj, null, 2));
            setJsonError("");
        }
        setActiveTab(tab);
    };

    // 从 JSON 更新 GUI
    const applyJsonToGui = useCallback((jsonObj: ThemeObject) => {
        onNameChange(jsonObj.name);
        onThemeColorChange(jsonObj.themeColor);
        onBackgroundColorChange(jsonObj.backgroundColor);
        onBackgroundOpacityChange(jsonObj.backgroundOpacity);
        onBackgroundImageChange(jsonObj.backgroundImage);
        onBackgroundBlurChange(jsonObj.backgroundBlur);
        onPanelColorChange(jsonObj.panelColor);
        onPanelOpacityChange(jsonObj.panelOpacity);
        onPanelBlurChange(jsonObj.panelBlur);
        onPanelRadiusChange(jsonObj.panelRadius);
        onControlColorChange(jsonObj.controlColor);
        onControlOpacityChange(jsonObj.controlOpacity);
        onControlBlurChange(jsonObj.controlBlur);
        onTextColorPrimaryChange(jsonObj.textColorPrimary);
        onTextColorSecondaryChange(jsonObj.textColorSecondary);
        onFavoriteCardColorChange(jsonObj.favoriteCardColor);
        onCardOpacityChange(jsonObj.cardOpacity);
        onComponentRadiusChange(jsonObj.componentRadius);
        onModalRadiusChange(jsonObj.modalRadius);
        onNotificationRadiusChange(jsonObj.notificationRadius);
        onCoverRadiusChange(jsonObj.coverRadius);
        onModalColorChange(jsonObj.modalColor);
        onModalOpacityChange(jsonObj.modalOpacity);
        onModalBlurChange(jsonObj.modalBlur);
        onWindowControlsPosChange(jsonObj.windowControlsPos);
    }, [
        onNameChange, onThemeColorChange, onBackgroundColorChange, onBackgroundOpacityChange,
        onBackgroundImageChange, onBackgroundBlurChange, onPanelColorChange, onPanelOpacityChange,
        onPanelBlurChange, onPanelRadiusChange, onControlColorChange, onControlOpacityChange,
        onControlBlurChange, onTextColorPrimaryChange, onTextColorSecondaryChange,
        onFavoriteCardColorChange, onCardOpacityChange, onComponentRadiusChange,
        onModalRadiusChange, onNotificationRadiusChange, onCoverRadiusChange,
        onModalColorChange, onModalOpacityChange, onModalBlurChange, onWindowControlsPosChange
    ]);

    // JSON 文本变化处理
    const handleJsonChange = (value: string) => {
        setJsonText(value);
        setJsonError("");
    };

    // 从 JSON 应用按钮
    const handleApplyFromJson = () => {
        try {
            const parsed = JSON.parse(jsonText);

            // 类型检查
            const errors: string[] = [];
            if (typeof parsed.name !== 'string') errors.push("name 必须是字符串");
            if (typeof parsed.themeColor !== 'string' || !parsed.themeColor.match(/^#[0-9a-f]{6}$/i)) errors.push("themeColor 必须是有效的十六进制颜色");
            if (typeof parsed.backgroundColor !== 'string' || !parsed.backgroundColor.match(/^#[0-9a-f]{6}$/i)) errors.push("backgroundColor 必须是有效的十六进制颜色");
            if (typeof parsed.backgroundOpacity !== 'number' || parsed.backgroundOpacity < 0 || parsed.backgroundOpacity > 1) errors.push("backgroundOpacity 必须是 0-1 之间的数字");
            if (typeof parsed.backgroundImage !== 'string') errors.push("backgroundImage 必须是字符串");
            if (typeof parsed.backgroundBlur !== 'number' || parsed.backgroundBlur < 0 || parsed.backgroundBlur > 50) errors.push("backgroundBlur 必须是 0-50 之间的数字");
            if (typeof parsed.panelColor !== 'string' || !parsed.panelColor.match(/^#[0-9a-f]{6}$/i)) errors.push("panelColor 必须是有效的十六进制颜色");
            if (typeof parsed.panelOpacity !== 'number' || parsed.panelOpacity < 0.2 || parsed.panelOpacity > 1) errors.push("panelOpacity 必须是 0.2-1 之间的数字");
            if (typeof parsed.panelBlur !== 'number' || parsed.panelBlur < 0 || parsed.panelBlur > 30) errors.push("panelBlur 必须是 0-30 之间的数字");
            if (typeof parsed.panelRadius !== 'number' || parsed.panelRadius < 0 || parsed.panelRadius > 32) errors.push("panelRadius 必须是 0-32 之间的数字");
            if (typeof parsed.controlColor !== 'string' || !parsed.controlColor.match(/^#[0-9a-f]{6}$/i)) errors.push("controlColor 必须是有效的十六进制颜色");
            if (typeof parsed.controlOpacity !== 'number' || parsed.controlOpacity < 0 || parsed.controlOpacity > 1) errors.push("controlOpacity 必须是 0-1 之间的数字");
            if (typeof parsed.controlBlur !== 'number' || parsed.controlBlur < 0 || parsed.controlBlur > 20) errors.push("controlBlur 必须是 0-20 之间的数字");
            if (typeof parsed.textColorPrimary !== 'string' || !parsed.textColorPrimary.match(/^#[0-9a-f]{6}$/i)) errors.push("textColorPrimary 必须是有效的十六进制颜色");
            if (typeof parsed.textColorSecondary !== 'string' || !parsed.textColorSecondary.match(/^#[0-9a-f]{6}$/i)) errors.push("textColorSecondary 必须是有效的十六进制颜色");
            if (typeof parsed.favoriteCardColor !== 'string' || !parsed.favoriteCardColor.match(/^#[0-9a-f]{6}$/i)) errors.push("favoriteCardColor 必须是有效的十六进制颜色");
            if (typeof parsed.cardOpacity !== 'number' || parsed.cardOpacity < 0 || parsed.cardOpacity > 1) errors.push("cardOpacity 必须是 0-1 之间的数字");
            if (typeof parsed.componentRadius !== 'number' || parsed.componentRadius < 0 || parsed.componentRadius > 32) errors.push("componentRadius 必须是 0-32 之间的数字");
            if (typeof parsed.modalRadius !== 'number' || parsed.modalRadius < 0 || parsed.modalRadius > 32) errors.push("modalRadius 必须是 0-32 之间的数字");
            if (typeof parsed.notificationRadius !== 'number' || parsed.notificationRadius < 0 || parsed.notificationRadius > 32) errors.push("notificationRadius 必须是 0-32 之间的数字");
            if (typeof parsed.coverRadius !== 'number' || parsed.coverRadius < 0 || parsed.coverRadius > 50) errors.push("coverRadius 必须是 0-50 之间的数字");
            if (typeof parsed.modalColor !== 'string' || !parsed.modalColor.match(/^#[0-9a-f]{6}$/i)) errors.push("modalColor 必须是有效的十六进制颜色");
            if (typeof parsed.modalOpacity !== 'number' || parsed.modalOpacity < 0 || parsed.modalOpacity > 1) errors.push("modalOpacity 必须是 0-1 之间的数字");
            if (typeof parsed.modalBlur !== 'number' || parsed.modalBlur < 0 || parsed.modalBlur > 30) errors.push("modalBlur 必须是 0-30 之间的数字");
            if (typeof parsed.windowControlsPos !== 'string' || !['left', 'right', 'hidden'].includes(parsed.windowControlsPos)) errors.push("windowControlsPos 必须是 'left', 'right', 或 'hidden'");

            if (errors.length > 0) {
                setJsonError(errors.join('\n'));
                return;
            }

            applyJsonToGui(parsed);
            setJsonError("");
        } catch (err) {
            setJsonError(`JSON 解析失败: ${err}`);
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

    const textareaStyles = derived ? {
        input: {
            backgroundColor: derived.controlBackground,
            color: derived.textColorPrimary,
            borderColor: "transparent",
            borderRadius: derived.componentRadius,
            fontFamily: "monospace",
            fontSize: "12px",
        },
        label: {
            color: derived.textColorPrimary,
        }
    } : undefined;

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={editingThemeId ? "主题详情" : "新建主题"}
            centered
            size="lg"
            radius={derived?.componentRadius}
            styles={modalStyles}
            className="normal-panel"
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={onBackgroundFileChange}
            />
            <Tabs value={activeTab} onChange={handleTabChange} defaultValue="gui">
                <Tabs.List>
                    <Tabs.Tab value="gui" disabled={isReadOnly ? false : false}>GUI 编辑</Tabs.Tab>
                    <Tabs.Tab value="json" disabled={isReadOnly ? false : false}>JSON 配置</Tabs.Tab>
                </Tabs.List>

                {/* GUI 模式 */}
                <Tabs.Panel value="gui" pt="md">
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
                                    readOnly={isReadOnly}
                                />
                                <ColorInput
                                    label="主题色"
                                    value={themeColorDraft}
                                    onChange={onThemeColorChange}
                                    size="sm"
                                    disallowInput={false}
                                    format="hex"
                                    styles={inputStyles}
                                    readOnly={isReadOnly}
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
                                    readOnly={isReadOnly}
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
                                        disabled={isReadOnly}
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
                                        disabled={isReadOnly}
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
                                    readOnly={isReadOnly}
                                />
                                {!isReadOnly && (
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
                                )}
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
                                    readOnly={isReadOnly}
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
                                        disabled={isReadOnly}
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
                                        disabled={isReadOnly}
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
                                        disabled={isReadOnly}
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
                                        readOnly={isReadOnly}
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
                                            disabled={isReadOnly}
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
                                        disabled={isReadOnly}
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
                                        readOnly={isReadOnly}
                                    />
                                    <ColorInput
                                        label="次要文字颜色"
                                        value={textColorSecondaryDraft}
                                        onChange={onTextColorSecondaryChange}
                                        size="sm"
                                        disallowInput={false}
                                        format="hex"
                                        styles={inputStyles}
                                        readOnly={isReadOnly}
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
                                    readOnly={isReadOnly}
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
                                        disabled={isReadOnly}
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
                                    readOnly={isReadOnly}
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
                                        disabled={isReadOnly}
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
                                        disabled={isReadOnly}
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
                                        disabled={isReadOnly}
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
                                        disabled={isReadOnly}
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
                                        disabled={isReadOnly}
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
                                        disabled={isReadOnly}
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
                                    disabled={isReadOnly}
                                />
                            </Stack>
                        </Fieldset>
                    </Stack>
                </Tabs.Panel>

                {/* JSON 模式 */}
                <Tabs.Panel value="json" pt="md">
                    <Stack gap="md">
                        {isReadOnly && (
                            <Alert icon={<AlertCircle size={16} />} color="blue" title="只读模式">
                                这是一个内置主题，无法编辑。查看详情请使用上面的 JSON 配置。
                            </Alert>
                        )}
                        <Textarea
                            label="主题配置 (JSON)"
                            placeholder="粘贴或编辑 JSON 配置..."
                            value={jsonText}
                            onChange={(e) => handleJsonChange(e.currentTarget.value)}
                            minRows={15}
                            styles={textareaStyles}
                            readOnly={isReadOnly}
                        />
                        {jsonError && (
                            <Alert icon={<AlertCircle size={16} />} color="red" title="JSON 验证错误">
                                <Box style={{ whiteSpace: "pre-wrap", fontSize: "12px" }}>
                                    {jsonError}
                                </Box>
                            </Alert>
                        )}
                        {!isReadOnly && (
                            <Button
                                color={themeColorDraft}
                                variant="light"
                                onClick={handleApplyFromJson}
                                radius={derived?.componentRadius}
                            >
                                应用 JSON 配置
                            </Button>
                        )}
                    </Stack>
                </Tabs.Panel>
            </Tabs>

            <Group justify="flex-end" gap="sm" mt="md">
                <Button variant="subtle" color={themeColorDraft} onClick={onCancel} radius={derived?.componentRadius} style={{ color: derived?.textColorPrimary }}>
                    {isReadOnly ? "关闭" : "取消"}
                </Button>
                {!isReadOnly && (
                    <Button
                        color={themeColorDraft}
                        loading={savingTheme}
                        radius={derived?.componentRadius}
                        onClick={onSubmit}
                    >
                        {editingThemeId ? "保存" : "创建"}
                    </Button>
                )}
            </Group>
        </Modal>
    );
};

export default ThemeDetailModal;
