import { useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import * as Services from '../../../wailsjs/go/services/Service';
import { Theme } from '../../types';

interface UseThemeEditorProps {
    themes: Theme[];
    setThemes: (themes: Theme[]) => void;
    defaultThemes: Theme[];
    currentThemeId: string | null;
    themeColorDraft: string;
    computedColorScheme: string;
    saveCachedCustomThemes: (themes: Theme[]) => void;
    applyThemeToUi: (theme: Theme) => void;
    getCustomThemesFromState: (themes: Theme[]) => Theme[];
    setEditingThemeId: (id: string | null) => void;
    setNewThemeName: (name: string) => void;
    setColorSchemeDraft: (scheme: "light" | "dark") => void;
    setThemeColorDraft: (color: string) => void;
    setBackgroundColorDraft: (color: string) => void;
    setBackgroundOpacityDraft: (opacity: number) => void;
    setBackgroundImageUrlDraftSafe: (url: string) => void;
    setPanelColorDraft: (color: string) => void;
    setPanelOpacityDraft: (opacity: number) => void;
    setSavingTheme: (saving: boolean) => void;
    openModal: (name: string) => void;
    closeModal: (name: string) => void;
}

export const useThemeEditor = ({
    themes,
    setThemes,
    defaultThemes,
    currentThemeId,
    themeColorDraft,
    computedColorScheme,
    saveCachedCustomThemes,
    applyThemeToUi,
    getCustomThemesFromState,
    setEditingThemeId,
    setNewThemeName,
    setColorSchemeDraft,
    setThemeColorDraft,
    setBackgroundColorDraft,
    setBackgroundOpacityDraft,
    setBackgroundImageUrlDraftSafe,
    setPanelColorDraft,
    setPanelOpacityDraft,
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
        setColorSchemeDraft((theme.colorScheme as "light" | "dark") || "light");
        setThemeColorDraft(theme.themeColor);
        setBackgroundColorDraft(theme.backgroundColor);
        setBackgroundOpacityDraft(theme.backgroundOpacity);
        setBackgroundImageUrlDraftSafe(theme.backgroundImage);
        setPanelColorDraft(theme.panelColor);
        setPanelOpacityDraft(theme.panelOpacity);
        openModal("themeEditorModal");
    }, [setEditingThemeId, setNewThemeName, setColorSchemeDraft, setThemeColorDraft, setBackgroundColorDraft, setBackgroundOpacityDraft, setBackgroundImageUrlDraftSafe, setPanelColorDraft, setPanelOpacityDraft, openModal]);

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
        setColorSchemeDraft(computedColorScheme as "light" | "dark");
        setThemeColorDraft("#228be6");
        setBackgroundColorDraft(computedColorScheme === "dark" ? "#0b1021" : "#f8fafc");
        setBackgroundOpacityDraft(1);
        setBackgroundImageUrlDraftSafe("");
        setPanelColorDraft(computedColorScheme === "dark" ? "#1f2937" : "#ffffff");
        setPanelOpacityDraft(0.92);
        openModal("themeEditorModal");
    }, [computedColorScheme, setEditingThemeId, setNewThemeName, setColorSchemeDraft, setThemeColorDraft, setBackgroundColorDraft, setBackgroundOpacityDraft, setBackgroundImageUrlDraftSafe, setPanelColorDraft, setPanelOpacityDraft, openModal]);

    const submitTheme = useCallback(async (
        editingThemeId: string | null,
        newThemeName: string,
        colorSchemeDraft: "light" | "dark",
        themeColorDraft: string,
        backgroundColorDraft: string,
        backgroundOpacityDraft: number,
        backgroundImageUrlDraft: string,
        panelColorDraft: string,
        panelOpacityDraft: number
    ) => {
        setSavingTheme(true);
        const toastId = notifications.show({
            title: editingThemeId ? "正在保存主题" : "正在创建主题",
            message: "请稍候...",
            color: themeColorDraft,
            loading: true,
            autoClose: false,
        });
        try {
            if (editingThemeId) {
                const editingTheme = themes.find((t: Theme) => t.id === editingThemeId);
                const updatedTheme: Theme = {
                    id: editingThemeId,
                    name: newThemeName || "未命名主题",
                    colorScheme: colorSchemeDraft,
                    themeColor: themeColorDraft,
                    backgroundColor: backgroundColorDraft,
                    backgroundOpacity: backgroundOpacityDraft,
                    backgroundImage: backgroundImageUrlDraft,
                    panelColor: panelColorDraft,
                    panelOpacity: panelOpacityDraft,
                    isDefault: editingTheme?.isDefault || false,
                    isReadOnly: false,
                };
                await Services.UpdateTheme(updatedTheme);
                const currentCustomThemes = getCustomThemesFromState(themes);
                const nextCustom = currentCustomThemes.map((t: Theme) => (t.id === editingThemeId ? updatedTheme : t));
                saveCachedCustomThemes(nextCustom);
                setThemes([...defaultThemes, ...nextCustom]);
                if (currentThemeId === editingThemeId) {
                    applyThemeToUi(updatedTheme);
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
                    colorScheme: colorSchemeDraft,
                    themeColor: themeColorDraft,
                    backgroundColor: backgroundColorDraft,
                    backgroundOpacity: backgroundOpacityDraft,
                    backgroundImage: backgroundImageUrlDraft,
                    panelColor: panelColorDraft,
                    panelOpacity: panelOpacityDraft,
                    isDefault: false,
                    isReadOnly: false,
                };
                const createdTheme = await Services.CreateTheme(newTheme);
                const currentCustomThemes = getCustomThemesFromState(themes);
                const nextCustom = [...currentCustomThemes, createdTheme];
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
    }, [themes, currentThemeId, saveCachedCustomThemes, applyThemeToUi, getCustomThemesFromState, setThemes, setSavingTheme, closeModal, setEditingThemeId, setNewThemeName]);

    const closeThemeEditor = useCallback(() => {
        closeModal("themeEditorModal");
        setEditingThemeId(null);
        setNewThemeName("");
    }, [closeModal, setEditingThemeId, setNewThemeName]);

    return {
        selectTheme,
        editTheme,
        deleteTheme,
        createThemeClick,
        submitTheme,
        closeThemeEditor,
    };
};
