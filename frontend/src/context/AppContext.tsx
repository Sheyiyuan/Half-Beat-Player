import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Song, Favorite, PlayerSetting, LyricMapping } from '../types';

// ========== 类型定义 ==========
export interface AppState {
  // 播放列表数据
  songs: Song[];
  favorites: Favorite[];
  
  // 设置和歌词
  setting: PlayerSetting | null;
  lyric: LyricMapping | null;
  
  // UI 状态
  status: string;
  searchQuery: string;
  selectedFavId: string | null;
  
  // 全局搜索
  globalSearchOpen: boolean;
  globalSearchTerm: string;
  remoteResults: Song[];
}

export interface AppActions {
  // Songs 操作
  setSongs: (songs: Song[]) => void;
  addSong: (song: Song) => void;
  updateSong: (id: string, updates: Partial<Song>) => void;
  removeSong: (id: string) => void;
  
  // Favorites 操作
  setFavorites: (favorites: Favorite[]) => void;
  addFavorite: (favorite: Favorite) => void;
  updateFavorite: (id: string, updates: Partial<Favorite>) => void;
  removeFavorite: (id: string) => void;
  
  // 设置和歌词
  setSetting: (setting: PlayerSetting | null) => void;
  setLyric: (lyric: LyricMapping | null) => void;
  
  // UI 状态
  setStatus: (status: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedFavId: (favId: string | null) => void;
  
  // 全局搜索
  setGlobalSearchOpen: (open: boolean) => void;
  setGlobalSearchTerm: (term: string) => void;
  setRemoteResults: (results: Song[]) => void;
}

export interface AppContextValue {
  state: AppState;
  actions: AppActions;
}

// ========== Context 创建 ==========
const AppContext = createContext<AppContextValue | undefined>(undefined);

// ========== Provider 组件 ==========
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ========== State ==========
  const [songs, setSongs] = useState<Song[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [setting, setSetting] = useState<PlayerSetting | null>(null);
  const [lyric, setLyric] = useState<LyricMapping | null>(null);
  const [status, setStatus] = useState<string>("加载中...");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFavId, setSelectedFavId] = useState<string | null>(null);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [remoteResults, setRemoteResults] = useState<Song[]>([]);

  // ========== Actions ==========
  const addSong = useCallback((song: Song) => {
    setSongs(prev => [...prev, song]);
  }, []);

  const updateSong = useCallback((id: string, updates: Partial<Song>) => {
    setSongs(prev => prev.map(song => 
      song.id === id ? { ...song, ...updates } : song
    ));
  }, []);

  const removeSong = useCallback((id: string) => {
    setSongs(prev => prev.filter(song => song.id !== id));
  }, []);

  const addFavorite = useCallback((favorite: Favorite) => {
    setFavorites(prev => [...prev, favorite]);
  }, []);

  const updateFavorite = useCallback((id: string, updates: Partial<Favorite>) => {
    setFavorites(prev => prev.map(fav => 
      fav.id === id ? { ...fav, ...updates } : fav
    ));
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites(prev => prev.filter(fav => fav.id !== id));
  }, []);

  // ========== Context Value ==========
  const value: AppContextValue = {
    state: {
      songs,
      favorites,
      setting,
      lyric,
      status,
      searchQuery,
      selectedFavId,
      globalSearchOpen,
      globalSearchTerm,
      remoteResults,
    },
    actions: {
      setSongs,
      addSong,
      updateSong,
      removeSong,
      setFavorites,
      addFavorite,
      updateFavorite,
      removeFavorite,
      setSetting,
      setLyric,
      setStatus,
      setSearchQuery,
      setSelectedFavId,
      setGlobalSearchOpen,
      setGlobalSearchTerm,
      setRemoteResults,
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// ========== Hook ==========
export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
