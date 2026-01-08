import { useState, useCallback } from "react";

export interface ModalStates {
    loginModal: boolean;
    themeManagerModal: boolean;
    themeEditorModal: boolean;
    themeDetailModal: boolean;
    settingsModal: boolean;
    addFavoriteModal: boolean;
    playlistModal: boolean;
    bvModal: boolean;
    editFavModal: boolean;
    globalSearchModal: boolean;
    downloadModal: boolean;
    createFavModal: boolean;
    downloadManagerModal: boolean;
    downloadTasksModal: boolean;
    bvAddModal: boolean;
    globalSearchTermModal: boolean;
    playlistManagerModal: boolean;
}

export const useModalManager = () => {
    const [modals, setModals] = useState<ModalStates>({
        loginModal: false,
        themeManagerModal: false,
        themeEditorModal: false,
        themeDetailModal: false,
        settingsModal: false,
        addFavoriteModal: false,
        playlistModal: false,
        bvModal: false,
        editFavModal: false,
        globalSearchModal: false,
        downloadModal: false,
        createFavModal: false,
        downloadManagerModal: false,
        downloadTasksModal: false,
        bvAddModal: false,
        globalSearchTermModal: false,
        playlistManagerModal: false,
    });

    const openModal = useCallback((modalName: keyof ModalStates) => {
        setModals((prev) => ({ ...prev, [modalName]: true }));
    }, []);

    const closeModal = useCallback((modalName: keyof ModalStates) => {
        setModals((prev) => ({ ...prev, [modalName]: false }));
    }, []);

    const toggleModal = useCallback((modalName: keyof ModalStates) => {
        setModals((prev) => ({ ...prev, [modalName]: !prev[modalName] }));
    }, []);

    return {
        modals,
        openModal,
        closeModal,
        toggleModal,
    };
};
