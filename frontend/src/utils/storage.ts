/**
 * localStorage 操作工具函数
 */

export const STORAGE_KEYS = {
    USER_INFO: 'half-beat.userInfo',
    CUSTOM_THEMES: 'half-beat.customThemes',
    SONG_CACHE_PREFIX: 'half-beat.song.',
} as const;

export const storage = {
    get: <T>(key: string): T | null => {
        if (typeof window === 'undefined') return null;
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.warn(`读取 localStorage 失败: ${key}`, error);
            return null;
        }
    },

    set: <T>(key: string, value: T): void => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn(`写入 localStorage 失败: ${key}`, error);
        }
    },

    remove: (key: string): void => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn(`删除 localStorage 失败: ${key}`, error);
        }
    },

    clear: (): void => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.clear();
        } catch (error) {
            console.warn('清空 localStorage 失败', error);
        }
    },
};
