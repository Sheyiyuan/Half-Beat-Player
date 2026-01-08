// ========== 旧的 Hook 导出（保留兼容性）==========
export * from './useAudioPlayer';
export * from './usePlaylist';
export * from './useAudioInterval';
export * from './usePlaylistActions';
export * from './useSkipIntervalHandler';
export * from './useDownloadManager';
export * from './useAudioEvents';
export * from './usePlaybackControls';
export * from './usePlaylistPersistence';
export * from './useAudioSourceManager';
export * from './usePlaySong';
export * from './usePlayModes';

// ========== 新的合并 Hook（推荐使用）==========
export { usePlayer as usePlayerV2 } from './usePlayerV2';
export { usePlaylist as usePlaylistV2 } from './usePlaylistV2';
export { useAudio as useAudioV2 } from './useAudioV2';
