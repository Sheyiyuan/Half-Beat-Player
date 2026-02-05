import { useCallback, useEffect, useState } from 'react';
import { GetImageProxyURL, GetProxyBaseURL } from '../../api';

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
        if (originalUrl.startsWith('data:') || originalUrl.startsWith('blob:') || originalUrl.startsWith('http://127.0.0.1:')) {
            return originalUrl;
        }

        try {
            const proxiedUrl = await GetImageProxyURL(originalUrl);
            cacheProxyBaseUrl(proxiedUrl);
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

        // For synchronous usage, construct the proxy URL from cached base
        try {
            const encodedUrl = encodeURIComponent(originalUrl);
            const baseUrl = getCachedProxyBaseUrl();
            return `${baseUrl}/image?u=${encodedUrl}`;
        } catch (error) {
            console.warn('Failed to construct proxied image URL:', error);
            return originalUrl;
        }
    }, [isProxyEnabled]);

    useEffect(() => {
        if (typeof GetProxyBaseURL !== 'function') {
            return;
        }
        GetProxyBaseURL()
            .then((baseUrl) => {
                if (baseUrl && baseUrl.startsWith('http://127.0.0.1:')) {
                    localStorage.setItem('half-beat.proxyBaseUrl', baseUrl.replace(/\/$/, ''));
                }
            })
            .catch(() => { });
    }, []);

    return {
        getProxiedImageUrl,
        getProxiedImageUrlSync,
        isProxyEnabled,
        setIsProxyEnabled,
    };
};

const getCachedProxyBaseUrl = (): string => {
    const cached = localStorage.getItem('half-beat.proxyBaseUrl');
    if (cached && cached.startsWith('http://127.0.0.1:')) {
        return cached.replace(/\/$/, '');
    }
    return 'http://127.0.0.1:9999';
};

const cacheProxyBaseUrl = (proxiedUrl: string) => {
    try {
        const url = new URL(proxiedUrl);
        if (url.hostname === '127.0.0.1' && url.port) {
            localStorage.setItem('half-beat.proxyBaseUrl', `${url.protocol}//${url.hostname}:${url.port}`);
        }
    } catch {
        // ignore
    }
};