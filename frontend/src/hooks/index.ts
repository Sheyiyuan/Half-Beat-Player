/**
 * Hooks 统一导出
 */

// 新的统一 Store Hook（推荐使用）
export { useAppStore } from './useAppStore';

// 新的合并 Player Hooks（推荐使用）
export { usePlayer } from './player/usePlayerV2';
export { usePlaylist } from './player/usePlaylistV2';
export { useAudio } from './player/useAudioV2';

// 新的应用初始化 Hook（推荐使用）
export { useAppInitialize } from './ui/useAppInitialize';

// 旧的细粒度 Hooks（保留用于向后兼容，新代码请使用上面的合并 Hooks）
// Data hooks
export * from './data/useSongs';
export * from './data/useFavorites';
export * from './data/useSongCache';

// Feature hooks
export * from './features/useTheme';
export * from './features/useAuth';
export * from './features/useBVResolver';

// UI hooks
export * from './ui/useHitokoto';
