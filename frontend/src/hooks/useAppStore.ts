/**
 * 统一 Store 访问 Hook
 * 所有组件都应该通过这个 Hook 来访问全局状态和操作
 * 这是应用数据的单一入口点
 */

export {
    useAppStore,
    usePlayerState,
    usePlaylistState,
    useThemeState,
    useModalState,
    useUIState,
    useDataState,
    AppProvider,
} from '../context/AppContext';

export type {
    AppContextValue,
    AppStore,
    PlayerState,
    PlaylistState,
    ThemeState,
    ModalState,
    UIState,
    DataState,
    AppActions,
} from '../context/AppContext';
