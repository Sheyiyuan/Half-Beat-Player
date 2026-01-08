/**
 * Context 层导出文件
 * 
 * 提供统一的 Context 导入入口
 */

// 统一的应用 Context
export { AppProvider, useAppStore, usePlayerState, usePlaylistState, useThemeState, useModalState, useUIState, useDataState } from './AppContext';
export type { AppContextValue, AppStore, PlayerState, PlaylistState, ThemeState, ModalState, UIState, DataState, AppActions } from './AppContext';

// 保留兼容性导出（后续重构时会移除）
export { ThemeProvider, useThemeContext } from './ThemeContext';
export type { ThemeContextValue } from './ThemeContext';

export { ModalProvider, useModalContext } from './ModalContext';
export type { ModalName } from './ModalContext';
