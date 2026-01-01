import React, { RefObject, useState, useEffect, useCallback } from "react";
import { Button, ColorInput, Group, Modal, Slider, Stack, Text, TextInput, Select, Fieldset, Divider, Tabs, Textarea, Alert, Box, ScrollArea, SegmentedControl } from "@mantine/core"; import { AlertCircle, Copy, Check } from "lucide-react";
import { notifications } from "@mantine/notifications";
import CodeEditor from "@uiw/react-textarea-code-editor";

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
    colorSchemeDraft: string;
    onColorSchemeChange: (value: string) => void;
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
    backgroundImage?: string;
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
    colorScheme: string;
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
    colorSchemeDraft,
    onColorSchemeChange,
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
    const [copied, setCopied] = useState(false);

    // 字段验证规则配置
    const fieldValidations = {
        name: { type: 'string', required: true },
        themeColor: { type: 'color', required: true },
        backgroundColor: { type: 'color', required: true },
        backgroundOpacity: { type: 'number', min: 0, max: 1, required: true },
        backgroundImage: { type: 'string', required: false },
        backgroundBlur: { type: 'number', min: 0, max: 50, required: true },
        panelColor: { type: 'color', required: true },
        panelOpacity: { type: 'number', min: 0.2, max: 1, required: true },
        panelBlur: { type: 'number', min: 0, max: 30, required: true },
        panelRadius: { type: 'number', min: 0, max: 32, required: true },
        controlColor: { type: 'color', required: true },
        controlOpacity: { type: 'number', min: 0, max: 1, required: true },
        controlBlur: { type: 'number', min: 0, max: 20, required: true },
        textColorPrimary: { type: 'color', required: true },
        textColorSecondary: { type: 'color', required: true },
        favoriteCardColor: { type: 'color', required: true },
        cardOpacity: { type: 'number', min: 0, max: 1, required: true },
        componentRadius: { type: 'number', min: 0, max: 32, required: true },
        modalRadius: { type: 'number', min: 0, max: 32, required: true },
        notificationRadius: { type: 'number', min: 0, max: 32, required: true },
        coverRadius: { type: 'number', min: 0, max: 50, required: true },
        modalColor: { type: 'color', required: true },
        modalOpacity: { type: 'number', min: 0, max: 1, required: true },
        modalBlur: { type: 'number', min: 0, max: 30, required: true },
        windowControlsPos: { type: 'enum', values: ['left', 'right', 'hidden'], required: true },
        colorScheme: { type: 'enum', values: ['light', 'dark'], required: true },
    } as const;

    // 验证整个主题对象
    const validateThemeObject = (obj: any): string[] => {
        const errors: string[] = [];

        if (typeof obj !== 'object' || obj === null) {
            errors.push('JSON 必须是一个对象');
            return errors;
        }

        // 检查必需字段和类型
        for (const [key, rule] of Object.entries(fieldValidations)) {
            const value = obj[key];
            const ruleObj = rule as any;

            // 检查必需字段
            if (ruleObj.required && (value === undefined || value === null || value === '')) {
                errors.push(`字段 "${key}" 是必需的`);
                continue;
            }

            // 可选字段为空时跳过验证
            if (!ruleObj.required && (value === undefined || value === null || value === '')) {
                continue;
            }

            // 字符串类型检查
            if (ruleObj.type === 'string' && typeof value !== 'string') {
                errors.push(`字段 "${key}" 必须是字符串类型，当前值：${typeof value}`);
            }

            // 颜色类型检查
            if (ruleObj.type === 'color' && (typeof value !== 'string' || !value.match(/^#[0-9a-f]{6}$/i))) {
                errors.push(`字段 "${key}" 必须是有效的十六进制颜色 (#RRGGBB)，当前值：${value}`);
            }

            // 数字类型检查
            if (ruleObj.type === 'number') {
                if (typeof value !== 'number' || isNaN(value)) {
                    errors.push(`字段 "${key}" 必须是数字类型，当前值：${value}`);
                } else {
                    if (ruleObj.min !== undefined && value < ruleObj.min) {
                        errors.push(`字段 "${key}" 必须大于等于 ${ruleObj.min}，当前值：${value}`);
                    }
                    if (ruleObj.max !== undefined && value > ruleObj.max) {
                        errors.push(`字段 "${key}" 必须小于等于 ${ruleObj.max}，当前值：${value}`);
                    }
                }
            }

            // 枚举类型检查
            if (ruleObj.type === 'enum') {
                if (!ruleObj.values.includes(value)) {
                    errors.push(`字段 "${key}" 必须是 ${ruleObj.values.join('/')} 之一，当前值：${value}`);
                }
            }
        }

        return errors;
    };

    const buildThemeObject = useCallback((): ThemeObject => ({
        name: newThemeName,
        colorScheme: colorSchemeDraft,
        themeColor: themeColorDraft,
        backgroundColor: backgroundColorDraft,
        backgroundOpacity: backgroundOpacityDraft,
        backgroundBlur: backgroundBlurDraft,
        ...(backgroundImageUrlDraft ? { backgroundImage: backgroundImageUrlDraft } : {}),
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
        modalColorDraft, modalOpacityDraft, modalBlurDraft,
        windowControlsPosDraft, colorSchemeDraft
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
        if (jsonObj.backgroundImage) {
            onBackgroundImageChange(jsonObj.backgroundImage);
        }
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
        onColorSchemeChange(jsonObj.colorScheme);
    }, [
        onNameChange, onThemeColorChange, onBackgroundColorChange, onBackgroundOpacityChange,
        onBackgroundImageChange, onBackgroundBlurChange, onPanelColorChange, onPanelOpacityChange,
        onPanelBlurChange, onPanelRadiusChange, onControlColorChange, onControlOpacityChange,
        onControlBlurChange, onTextColorPrimaryChange, onTextColorSecondaryChange,
        onFavoriteCardColorChange, onCardOpacityChange, onComponentRadiusChange,
        onModalRadiusChange, onNotificationRadiusChange, onCoverRadiusChange,
        onModalColorChange, onModalOpacityChange, onModalBlurChange,
        onWindowControlsPosChange, onColorSchemeChange
    ]);

    // JSON 文本变化处理
    const handleJsonChange = (value: string) => {
        setJsonText(value);
        setJsonError("");
    };

    // 复制 JSON 到剪贴板
    const handleCopyJson = useCallback(() => {
        navigator.clipboard.writeText(jsonText).then(() => {
            setCopied(true);
            notifications.show({
                message: "已复制到剪贴板",
                color: "green",
                autoClose: 1500,
            });
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
            notifications.show({
                message: "复制失败",
                color: "red",
                autoClose: 1500,
            });
        });
    }, [jsonText]);

    // 从 JSON 应用按钮
    const handleApplyFromJson = () => {
        try {
            const parsed = JSON.parse(jsonText);

            // 验证整个对象
            const errors = validateThemeObject(parsed);

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
            fontSize: "14px",
            lineHeight: "1.6",
            padding: "12px",
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
            size="xl"
            radius={derived?.componentRadius}
            styles={modalStyles}
            className="normal-panel"
            fullScreen={false}
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
                    <ScrollArea style={{ height: "500px", marginRight: -16, paddingRight: 16 }}>
                        <Stack gap="md" pr="md">
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
                                    <Stack gap={2}>
                                        <Text size="sm" fw={500} c={derived?.textColorPrimary}>颜色方案</Text>
                                        <SegmentedControl
                                            value={colorSchemeDraft}
                                            onChange={(value) => onColorSchemeChange(value)}
                                            data={[
                                                { label: '亮色', value: 'light' },
                                                { label: '暗色', value: 'dark' },
                                            ]}
                                            fullWidth
                                            disabled={isReadOnly}
                                        />
                                    </Stack>
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
                                    <Stack gap={2}>
                                        <Text size="sm" fw={500} c={derived?.textColorPrimary}>颜色方案</Text>
                                        <SegmentedControl
                                            value={colorSchemeDraft}
                                            onChange={(value) => onColorSchemeChange(value)}
                                            data={[
                                                { label: '亮色', value: 'light' },
                                                { label: '暗色', value: 'dark' },
                                            ]}
                                            fullWidth
                                            disabled={isReadOnly}
                                        />
                                    </Stack>
                                </Stack>
                            </Fieldset>
                        </Stack>
                    </ScrollArea>
                </Tabs.Panel>

                {/* JSON 模式 */}
                <Tabs.Panel value="json" pt="md" style={{ display: "flex", flexDirection: "column", height: "500px" }}>
                    {isReadOnly && (
                        <Alert icon={<AlertCircle size={16} />} color="blue" title="只读模式" mb="md" style={{ flexShrink: 0 }}>
                            这是一个内置主题，无法编辑。查看详情请使用上面的 JSON 配置。
                        </Alert>
                    )}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", marginBottom: "md", borderRadius: derived?.componentRadius, minHeight: 0 }}>
                        <label style={{ color: derived?.textColorPrimary, fontSize: "14px", fontWeight: 500, marginBottom: "8px", paddingLeft: "12px", paddingTop: "8px", flexShrink: 0 }}>主题配置 (JSON)</label>
                        <div style={{ flex: 1, overflow: "hidden", backgroundColor: derived?.controlBackground, borderRadius: derived?.componentRadius, display: "flex", flexDirection: "column" }}>
                            <ScrollArea type="auto" style={{ flex: 1 }}>
                                <div style={{ padding: "8px 12px" }}>
                                    <CodeEditor
                                        value={jsonText}
                                        language="json"
                                        placeholder="粘贴或编辑 JSON 配置..."
                                        onChange={(evn) => handleJsonChange(evn.target.value)}
                                        style={{
                                            width: "100%",
                                            fontFamily: "monospace",
                                            fontSize: "14px",
                                            lineHeight: "1.5",
                                            backgroundColor: derived?.controlBackground,
                                            color: derived?.textColorPrimary,
                                            border: "none"
                                        }}
                                        data-color-mode={colorSchemeDraft === 'light' ? 'light' : 'dark'}
                                        disabled={isReadOnly}
                                        minHeight={200}
                                    />
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                    <Stack gap="md" mt="md" style={{ flexShrink: 0 }}>
                        <Button
                            leftSection={copied ? <Check size={16} /> : <Copy size={16} />}
                            variant="light"
                            color={themeColorDraft}
                            onClick={handleCopyJson}
                            radius={derived?.componentRadius}
                        >
                            {copied ? "已复制" : "复制 JSON"}
                        </Button>
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
