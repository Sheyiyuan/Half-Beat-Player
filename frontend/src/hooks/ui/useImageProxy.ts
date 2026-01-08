import { useCallback, useEffect, useState } from 'react';
import { GetImageProxyURL } from '../../api';

/**
 * Hook for handling image proxy URLs to bypass CORS restrictions
 */
export const useImageProxy = () => {
    const [isProxyEnabled, setIsProxyEnabled] = useState(true);

    // Check if we need to use proxy (mainly for Windows)
    useEffect(() => {
        // Enable proxy by default, can be disabled if needed
        setIsProxyEnabled(true);
    }, []);

    const getProxiedImageUrl = useCallback(async (originalUrl: string): Promise<string> => {
        if (!originalUrl || !isProxyEnabled) {
            return originalUrl;
        }

        // Skip proxy for data URLs and local URLs
        if (originalUrl.startsWith('data:') || originalUrl.startsWith('blob:') || originalUrl.startsWith('http://127.0.0.1')) {
            return originalUrl;
        }

        try {
            const proxiedUrl = await GetImageProxyURL(originalUrl);
            return proxiedUrl || originalUrl;
        } catch (error) {
            console.warn('Failed to get proxied image URL:', error);
            return originalUrl;
        }
    }, [isProxyEnabled]);

    const getProxiedImageUrlSync = useCallback((originalUrl: string): string => {
        if (!originalUrl || !isProxyEnabled) {
            return originalUrl;
        }

        // Skip proxy for data URLs and local URLs
        if (originalUrl.startsWith('data:') || originalUrl.startsWith('blob:') || originalUrl.startsWith('http://127.0.0.1')) {
            return originalUrl;
        }

        // For synchronous usage, construct the proxy URL directly
        try {
            const encodedUrl = encodeURIComponent(originalUrl);
            return `http://127.0.0.1:9999/image?u=${encodedUrl}`;
        } catch (error) {
            console.warn('Failed to construct proxied image URL:', error);
            return originalUrl;
        }
    }, [isProxyEnabled]);

    return {
        getProxiedImageUrl,
        getProxiedImageUrlSync,
        isProxyEnabled,
        setIsProxyEnabled,
    };
};