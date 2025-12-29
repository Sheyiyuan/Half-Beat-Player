import { useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import * as Services from '../../../wailsjs/go/services/Service';
import { Theme } from '../../types';
import type { ModalStates } from '../ui/useModalManager';

interface UseThemeEditorProps {
    themes: Theme[];
    setThemes: (themes: Theme[]) => void;
    defaultThemes: Theme[];
    currentThemeId: string | null;
    computedColorScheme: string;
    saveCachedCustomThemes: (themes: Theme[]) => void;
    applyThemeToUi: (theme: Theme) => void;
    getCustomThemesFromState: (themes: Theme[]) => Theme[];
    editingThemeId: string | null;
    setEditingThemeId: (id: string | null) => void;
    newThemeName: string;
    setNewThemeName: (name: string) => void;
    themeColorDraft: string;
    setThemeColorDraft: (color: string) => void;
    backgroundColorDraft: string;
    setBackgroundColorDraft: (color: string) => void;
    backgroundOpacityDraft: number;
    setBackgroundOpacityDraft: (opacity: number) => void;
    backgroundImageUrlDraft: string;
    setBackgroundImageUrlDraftSafe: (url: string) => void;
    backgroundBlurDraft: number;
    setBackgroundBlurDraft: (blur: number) => void;
    panelColorDraft: string;
    setPanelColorDraft: (color: string) => void;
    panelOpacityDraft: number;
    setPanelOpacityDraft: (opacity: number) => void;
    panelBlurDraft: number;
    setPanelBlurDraft: (blur: number) => void;
    panelRadiusDraft: number;
    setPanelRadiusDraft: (radius: number) => void;
    controlColorDraft: string;
    setControlColorDraft: (color: string) => void;
    controlOpacityDraft: number;
    setControlOpacityDraft: (opacity: number) => void;
    controlBlurDraft: number;
    setControlBlurDraft: (blur: number) => void;
    textColorPrimaryDraft: string;
    setTextColorPrimaryDraft: (color: string) => void;
    textColorSecondaryDraft: string;
    setTextColorSecondaryDraft: (color: string) => void;
    favoriteCardColorDraft: string;
    setFavoriteCardColorDraft: (color: string) => void;
    cardOpacityDraft: number;
    setCardOpacityDraft: (opacity: number) => void;
    modalRadiusDraft: number;
    setModalRadiusDraft: (radius: number) => void;
    notificationRadiusDraft: number;
    setNotificationRadiusDraft: (radius: number) => void;
    componentRadiusDraft: number;
    setComponentRadiusDraft: (radius: number) => void;
    coverRadiusDraft: number;
    setCoverRadiusDraft: (radius: number) => void;
    modalColorDraft: string;
    setModalColorDraft: (color: string) => void;
    modalOpacityDraft: number;
    setModalOpacityDraft: (opacity: number) => void;
    modalBlurDraft: number;
    setModalBlurDraft: (blur: number) => void;
    windowControlsPosDraft: string;
    setWindowControlsPosDraft: (pos: string) => void;
    colorSchemeDraft: string;
    setColorSchemeDraft: (scheme: string) => void;
    setSavingTheme: (saving: boolean) => void;
    openModal: (name: keyof ModalStates) => void;
    closeModal: (name: keyof ModalStates) => void;
}

export const useThemeEditor = ({
    themes,
    setThemes,
    defaultThemes,
    currentThemeId,
    computedColorScheme,
    saveCachedCustomThemes,
    applyThemeToUi,
    getCustomThemesFromState,
    editingThemeId,
    setEditingThemeId,
    newThemeName,
    setNewThemeName,
    themeColorDraft,
    setThemeColorDraft,
    backgroundColorDraft,
    setBackgroundColorDraft,
    backgroundOpacityDraft,
    setBackgroundOpacityDraft,
    backgroundImageUrlDraft,
    setBackgroundImageUrlDraftSafe,
    backgroundBlurDraft,
    setBackgroundBlurDraft,
    panelColorDraft,
    setPanelColorDraft,
    panelOpacityDraft,
    setPanelOpacityDraft,
    panelBlurDraft,
    setPanelBlurDraft,
    panelRadiusDraft,
    setPanelRadiusDraft,
    controlColorDraft,
    setControlColorDraft,
    controlOpacityDraft,
    setControlOpacityDraft,
    controlBlurDraft,
    setControlBlurDraft,
    textColorPrimaryDraft,
    setTextColorPrimaryDraft,
    textColorSecondaryDraft,
    setTextColorSecondaryDraft,
    favoriteCardColorDraft,
    setFavoriteCardColorDraft,
    cardOpacityDraft,
    setCardOpacityDraft,
    modalRadiusDraft,
    setModalRadiusDraft,
    notificationRadiusDraft,
    setNotificationRadiusDraft,
    componentRadiusDraft,
    setComponentRadiusDraft,
    coverRadiusDraft,
    setCoverRadiusDraft,
    modalColorDraft,
    setModalColorDraft,
    modalOpacityDraft,
    setModalOpacityDraft,
    modalBlurDraft,
    setModalBlurDraft,
    windowControlsPosDraft,
    setWindowControlsPosDraft,
    colorSchemeDraft,
    setColorSchemeDraft,
    setSavingTheme,
    openModal,
    closeModal,
}: UseThemeEditorProps) => {

    const selectTheme = useCallback((theme: Theme) => {
        applyThemeToUi(theme);
        Services.SetCurrentTheme(theme.id).catch(err => console.error("SetCurrentTheme failed", err));
    }, [applyThemeToUi]);

    const editTheme = useCallback((theme: Theme) => {
        setEditingThemeId(theme.id);
        setNewThemeName(theme.name);
        setThemeColorDraft(theme.themeColor || '#1f77f0');
        setBackgroundColorDraft(theme.backgroundColor || '#0a0e27');
        setBackgroundOpacityDraft(theme.backgroundOpacity ?? 1);
        setBackgroundImageUrlDraftSafe(theme.backgroundImage || '');
        setBackgroundBlurDraft(theme.backgroundBlur || 0);
        setPanelColorDraft(theme.panelColor || '#1a1f3a');
        setPanelOpacityDraft(theme.panelOpacity ?? 0.6);
        setPanelBlurDraft(theme.panelBlur ?? 0);
        setPanelRadiusDraft(theme.panelRadius ?? 8);
        setControlColorDraft(theme.controlColor || theme.panelColor || '#2a2f4a');
        setControlOpacityDraft(theme.controlOpacity ?? 1);
        setControlBlurDraft(theme.controlBlur ?? 0);
        setTextColorPrimaryDraft(theme.textColorPrimary || '#ffffff');
        setTextColorSecondaryDraft(theme.textColorSecondary || '#909296');
        setFavoriteCardColorDraft(theme.favoriteCardColor || theme.panelColor || '#2a2f4a');
        setCardOpacityDraft(theme.cardOpacity ?? 0.5);
        setModalRadiusDraft(theme.modalRadius ?? 8);
        setNotificationRadiusDraft(theme.notificationRadius ?? 8);
        setComponentRadiusDraft(theme.componentRadius ?? 6);
        setCoverRadiusDraft(theme.coverRadius ?? 4);
        setModalColorDraft(theme.modalColor || theme.panelColor || '#1a1f3a');
        setModalOpacityDraft(theme.modalOpacity ?? 0.95);
        setModalBlurDraft(theme.modalBlur ?? 10);
        setWindowControlsPosDraft(theme.windowControlsPos || 'right');
        setColorSchemeDraft(theme.colorScheme || 'dark');
        openModal("themeEditorModal");
    }, [setEditingThemeId, setNewThemeName, setThemeColorDraft, setBackgroundColorDraft, setBackgroundOpacityDraft, setBackgroundImageUrlDraftSafe, setBackgroundBlurDraft, setPanelColorDraft, setPanelOpacityDraft, setPanelBlurDraft, setPanelRadiusDraft, setControlColorDraft, setControlOpacityDraft, setControlBlurDraft, setTextColorPrimaryDraft, setTextColorSecondaryDraft, setFavoriteCardColorDraft, setCardOpacityDraft, setModalRadiusDraft, setNotificationRadiusDraft, setComponentRadiusDraft, setCoverRadiusDraft, setModalColorDraft, setModalOpacityDraft, setModalBlurDraft, setWindowControlsPosDraft, setColorSchemeDraft, openModal]);

    const deleteTheme = useCallback(async (id: string) => {
        await Services.DeleteTheme(id);
        const currentCustomThemes = getCustomThemesFromState(themes);
        const nextCustom = currentCustomThemes.filter((t: Theme) => t.id !== id);
        saveCachedCustomThemes(nextCustom);
        setThemes([...defaultThemes, ...nextCustom]);
    }, [themes, setThemes, saveCachedCustomThemes, getCustomThemesFromState, defaultThemes]);

    const createThemeClick = useCallback(() => {
        setEditingThemeId(null);
        setNewThemeName("");
        setThemeColorDraft("#228be6");
        setBackgroundColorDraft(computedColorScheme === "dark" ? "#0b1021" : "#f8fafc");
        setBackgroundOpacityDraft(1);
        setBackgroundImageUrlDraftSafe("");
        setBackgroundBlurDraft(0);
        setPanelColorDraft(computedColorScheme === "dark" ? "#1f2937" : "#ffffff");
        setPanelOpacityDraft(0.92);
        setPanelBlurDraft(0);
        setPanelRadiusDraft(8);
        setControlColorDraft(computedColorScheme === "dark" ? "#1f2937" : "#ffffff");
        setControlOpacityDraft(1);
        setControlBlurDraft(0);
        setTextColorPrimaryDraft(computedColorScheme === "dark" ? "#ffffff" : "#1a1b1e");
        setTextColorSecondaryDraft(computedColorScheme === "dark" ? "#a6a7ab" : "#909296");
        setFavoriteCardColorDraft(computedColorScheme === "dark" ? "#1f2937" : "#ffffff");
        setCardOpacityDraft(1);
        setModalRadiusDraft(8);
        setNotificationRadiusDraft(8);
        setComponentRadiusDraft(8);
        setCoverRadiusDraft(8);
        setModalColorDraft(computedColorScheme === "dark" ? "#1f2937" : "#ffffff");
        setModalOpacityDraft(0.92);
        setModalBlurDraft(0);
        setWindowControlsPosDraft("right");
        setColorSchemeDraft("light");
        openModal("themeEditorModal");
    }, [setEditingThemeId, setNewThemeName, setThemeColorDraft, setBackgroundColorDraft, setBackgroundOpacityDraft, setBackgroundImageUrlDraftSafe, setBackgroundBlurDraft, setPanelColorDraft, setPanelOpacityDraft, setPanelBlurDraft, setPanelRadiusDraft, setControlColorDraft, setControlOpacityDraft, setControlBlurDraft, setTextColorPrimaryDraft, setTextColorSecondaryDraft, setFavoriteCardColorDraft, setCardOpacityDraft, setModalRadiusDraft, setNotificationRadiusDraft, setComponentRadiusDraft, setCoverRadiusDraft, setModalColorDraft, setModalOpacityDraft, setModalBlurDraft, setWindowControlsPosDraft, setColorSchemeDraft, openModal, computedColorScheme]);

    const submitTheme = useCallback(async () => {
        setSavingTheme(true);
        const toastId = notifications.show({
            title: editingThemeId ? "正在保存主题" : "正在创建主题",
            message: "请稍候...",
            color: themeColorDraft,
            loading: true,
            autoClose: false,
        });
        try {
            // 构建主题数据对象
            const themeData = {
                themeColor: themeColorDraft,
                backgroundColor: backgroundColorDraft,
                backgroundOpacity: backgroundOpacityDraft,
                ...(backgroundImageUrlDraft ? { backgroundImage: backgroundImageUrlDraft } : {}),
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
                colorScheme: colorSchemeDraft,
            };

            if (editingThemeId) {
                const editingTheme = themes.find((t: Theme) => t.id === editingThemeId);
                const updatedTheme: Theme = {
                    id: editingThemeId,
                    name: newThemeName || "未命名主题",
                    data: JSON.stringify(themeData),
                    isDefault: editingTheme?.isDefault || false,
                    isReadOnly: false,
                };
                await Services.UpdateTheme(updatedTheme);
                // 解析数据用于前端显示
                const displayTheme: Theme = {
                    ...updatedTheme,
                    ...themeData,
                };
                const currentCustomThemes = getCustomThemesFromState(themes);
                const nextCustom = currentCustomThemes.map((t: Theme) => (t.id === editingThemeId ? displayTheme : t));
                saveCachedCustomThemes(nextCustom);
                setThemes([...defaultThemes, ...nextCustom]);
                if (currentThemeId === editingThemeId) {
                    applyThemeToUi(displayTheme);
                }
                notifications.update({
                    id: toastId,
                    title: "主题已保存",
                    message: updatedTheme.name,
                    color: "teal",
                    loading: false,
                    autoClose: 1500,
                });
            } else {
                const newTheme: Theme = {
                    id: "",
                    name: newThemeName || "未命名主题",
                    data: JSON.stringify(themeData),
                    isDefault: false,
                    isReadOnly: false,
                };
                const createdTheme = await Services.CreateTheme(newTheme);
                // 解析数据用于前端显示
                const displayTheme: Theme = {
                    ...createdTheme,
                    ...themeData,
                };
                const currentCustomThemes = getCustomThemesFromState(themes);
                const nextCustom = [...currentCustomThemes, displayTheme];
                saveCachedCustomThemes(nextCustom);
                setThemes([...defaultThemes, ...nextCustom]);
                notifications.update({
                    id: toastId,
                    title: "主题已创建",
                    message: createdTheme.name,
                    color: "teal",
                    loading: false,
                    autoClose: 1500,
                });
            }
            closeModal("themeEditorModal");
            setEditingThemeId(null);
            setNewThemeName("");
        } catch (err) {
            notifications.update({
                id: toastId,
                title: editingThemeId ? "保存失败" : "创建失败",
                message: `${err}`,
                color: "red",
                loading: false,
                autoClose: 3000,
            });
        } finally {
            setSavingTheme(false);
        }
    }, [
        themes, currentThemeId, saveCachedCustomThemes, applyThemeToUi, getCustomThemesFromState,
        setThemes, setSavingTheme, closeModal, setEditingThemeId, setNewThemeName,
        editingThemeId, newThemeName, themeColorDraft,
        backgroundColorDraft, backgroundOpacityDraft, backgroundImageUrlDraft, backgroundBlurDraft,
        panelColorDraft, panelOpacityDraft, panelBlurDraft, panelRadiusDraft,
        controlColorDraft, controlOpacityDraft, controlBlurDraft, textColorPrimaryDraft, textColorSecondaryDraft, favoriteCardColorDraft, cardOpacityDraft,
        componentRadiusDraft, coverRadiusDraft, windowControlsPosDraft, defaultThemes,
        modalRadiusDraft, notificationRadiusDraft
    ]);

    const closeThemeEditor = useCallback(() => {
        closeModal("themeEditorModal");
        setEditingThemeId(null);
        setNewThemeName("");
    }, [closeModal, setEditingThemeId, setNewThemeName]);

    const viewTheme = useCallback((theme: Theme) => {
        setEditingThemeId(theme.id);
        setNewThemeName(theme.name);
        setThemeColorDraft(theme.themeColor || '#1f77f0');
        setBackgroundColorDraft(theme.backgroundColor || '#0a0e27');
        setBackgroundOpacityDraft(theme.backgroundOpacity ?? 1);
        setBackgroundImageUrlDraftSafe(theme.backgroundImage || '');
        setBackgroundBlurDraft(theme.backgroundBlur || 0);
        setPanelColorDraft(theme.panelColor || '#1a1f3a');
        setPanelOpacityDraft(theme.panelOpacity ?? 0.6);
        setPanelBlurDraft(theme.panelBlur ?? 0);
        setPanelRadiusDraft(theme.panelRadius ?? 8);
        setControlColorDraft(theme.controlColor || theme.panelColor || '#2a2f4a');
        setControlOpacityDraft(theme.controlOpacity ?? 1);
        setControlBlurDraft(theme.controlBlur ?? 0);
        setTextColorPrimaryDraft(theme.textColorPrimary || '#ffffff');
        setTextColorSecondaryDraft(theme.textColorSecondary || '#909296');
        setFavoriteCardColorDraft(theme.favoriteCardColor || theme.panelColor || '#2a2f4a');
        setCardOpacityDraft(theme.cardOpacity ?? 0.5);
        setModalRadiusDraft(theme.modalRadius ?? 8);
        setNotificationRadiusDraft(theme.notificationRadius ?? 8);
        setComponentRadiusDraft(theme.componentRadius ?? 6);
        setCoverRadiusDraft(theme.coverRadius ?? 4);
        setModalColorDraft(theme.modalColor || theme.panelColor || '#1a1f3a');
        setModalOpacityDraft(theme.modalOpacity ?? 0.95);
        setModalBlurDraft(theme.modalBlur ?? 10);
        setWindowControlsPosDraft(theme.windowControlsPos || 'right');
        setColorSchemeDraft(theme.colorScheme || 'dark');
        openModal("themeDetailModal");
    }, [setEditingThemeId, setNewThemeName, setThemeColorDraft, setBackgroundColorDraft, setBackgroundOpacityDraft, setBackgroundImageUrlDraftSafe, setBackgroundBlurDraft, setPanelColorDraft, setPanelOpacityDraft, setPanelBlurDraft, setPanelRadiusDraft, setControlColorDraft, setControlOpacityDraft, setControlBlurDraft, setTextColorPrimaryDraft, setTextColorSecondaryDraft, setFavoriteCardColorDraft, setCardOpacityDraft, setModalRadiusDraft, setNotificationRadiusDraft, setComponentRadiusDraft, setCoverRadiusDraft, setModalColorDraft, setModalOpacityDraft, setModalBlurDraft, setWindowControlsPosDraft, setColorSchemeDraft, openModal]);

    return {
        selectTheme,
        editTheme,
        viewTheme,
        deleteTheme,
        createThemeClick,
        submitTheme,
        closeThemeEditor,
    };
};
