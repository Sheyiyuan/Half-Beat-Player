/**
 * useThemeDraftState - 主题编辑草稿状态管理
 * 将 App.tsx 中大量的主题编辑状态集中管理
 */

import { useState, useCallback } from 'react';

export const useThemeDraftState = () => {
    // ========== 主题编辑器状态 ==========
    const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
    const [newThemeName, setNewThemeName] = useState<string>("");
    const [themeColorDraft, setThemeColorDraft] = useState<string>("#228be6");
    const [backgroundColorDraft, setBackgroundColorDraft] = useState<string>("#f8fafc");
    const [backgroundOpacityDraft, setBackgroundOpacityDraft] = useState<number>(1);
    const [backgroundImageUrlDraft, setBackgroundImageUrlDraft] = useState<string>("");
    const [backgroundBlurDraft, setBackgroundBlurDraft] = useState<number>(0);
    const [panelOpacityDraft, setPanelOpacityDraft] = useState<number>(0.92);
    const [panelColorDraft, setPanelColorDraft] = useState<string>("#ffffff");
    const [panelBlurDraft, setPanelBlurDraft] = useState<number>(0);
    const [panelRadiusDraft, setPanelRadiusDraft] = useState<number>(8);
    const [controlColorDraft, setControlColorDraft] = useState<string>("#ffffff");
    const [controlOpacityDraft, setControlOpacityDraft] = useState<number>(1);
    const [controlBlurDraft, setControlBlurDraft] = useState<number>(0);
    const [textColorPrimaryDraft, setTextColorPrimaryDraft] = useState<string>("#1a1b1e");
    const [textColorSecondaryDraft, setTextColorSecondaryDraft] = useState<string>("#909296");
    const [favoriteCardColorDraft, setFavoriteCardColorDraft] = useState<string>("#ffffff");
    const [cardOpacityDraft, setCardOpacityDraft] = useState<number>(1);
    const [modalRadiusDraft, setModalRadiusDraft] = useState<number>(8);
    const [notificationRadiusDraft, setNotificationRadiusDraft] = useState<number>(8);
    const [componentRadiusDraft, setComponentRadiusDraft] = useState<number>(8);
    const [coverRadiusDraft, setCoverRadiusDraft] = useState<number>(8);
    const [modalColorDraft, setModalColorDraft] = useState<string>("#ffffff");
    const [modalOpacityDraft, setModalOpacityDraft] = useState<number>(1);
    const [modalBlurDraft, setModalBlurDraft] = useState<number>(0);
    const [windowControlsPosDraft, setWindowControlsPosDraft] = useState<string>("right");
    const [colorSchemeDraft, setColorSchemeDraft] = useState<string>("dark");
    const [savingTheme, setSavingTheme] = useState(false);

    // 重置所有主题草稿状态
    const resetThemeDraft = useCallback(() => {
        setEditingThemeId(null);
        setNewThemeName("");
        setThemeColorDraft("#228be6");
        setBackgroundColorDraft("#f8fafc");
        setBackgroundOpacityDraft(1);
        setBackgroundImageUrlDraft("");
        setBackgroundBlurDraft(0);
        setPanelOpacityDraft(0.92);
        setPanelColorDraft("#ffffff");
        setPanelBlurDraft(0);
        setPanelRadiusDraft(8);
        setControlColorDraft("#ffffff");
        setControlOpacityDraft(1);
        setControlBlurDraft(0);
        setTextColorPrimaryDraft("#1a1b1e");
        setTextColorSecondaryDraft("#909296");
        setFavoriteCardColorDraft("#ffffff");
        setCardOpacityDraft(1);
        setModalRadiusDraft(8);
        setNotificationRadiusDraft(8);
        setComponentRadiusDraft(8);
        setCoverRadiusDraft(8);
        setModalColorDraft("#ffffff");
        setModalOpacityDraft(1);
        setModalBlurDraft(0);
        setWindowControlsPosDraft("right");
        setColorSchemeDraft("dark");
        setSavingTheme(false);
    }, []);

    return {
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
        setBackgroundImageUrlDraft,
        backgroundBlurDraft,
        setBackgroundBlurDraft,
        panelOpacityDraft,
        setPanelOpacityDraft,
        panelColorDraft,
        setPanelColorDraft,
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
        savingTheme,
        setSavingTheme,
        resetThemeDraft,
    };
};
