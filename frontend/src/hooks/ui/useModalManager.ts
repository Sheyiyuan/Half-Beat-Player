import { useState, useCallback } from "react";

interface ModalStates {
    loginModal: boolean;
    themeModal: boolean;
    themeEditorModal: boolean;
    settingsModal: boolean;
    addFavoriteModal: boolean;
    playlistModal: boolean;
    bvModal: boolean;
    editFavModal: boolean;
    globalSearchModal: boolean;
}

export const useModalManager = () => {
    const [modals, setModals] = useState<ModalStates>({
        loginModal: false,
        themeModal: false,
        themeEditorModal: false,
        settingsModal: false,
        addFavoriteModal: false,
        playlistModal: false,
        bvModal: false,
        editFavModal: false,
        globalSearchModal: false,
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
