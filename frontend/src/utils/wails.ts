/**
 * Wails 运行时初始化工具
 * 
 * 处理 Wails 运行时的异步初始化问题
 */

declare global {
    interface Window {
        wails?: any;
        go?: any;
    }
}

/**
 * 等待 Wails 运行时完全初始化
 * 
 * @param maxRetries 最多重试次数，默认 50（5秒）
 * @param retryDelay 重试间隔（毫秒），默认 100ms
 * @returns Promise 在运行时准备好时解决
 */
export function waitForWailsRuntime(maxRetries = 50, retryDelay = 100): Promise<void> {
    return new Promise((resolve, reject) => {
        let retries = 0;

        const checkWails = () => {
            // 检查 Wails Callback 是否存在
            if (window.wails?.Callback) {
                console.log('[Wails] 运行时已初始化');
                resolve();
                return;
            }

            // 检查 Go 绑定是否存在
            if (window.go?.services?.Service?.GetPlayerSetting) {
                console.log('[Wails] Go 绑定已初始化');
                resolve();
                return;
            }

            retries++;
            if (retries >= maxRetries) {
                console.error(`[Wails] 超时：运行时未在 ${maxRetries * retryDelay}ms 内初始化`);
                reject(new Error('Wails runtime timeout'));
                return;
            }

            setTimeout(checkWails, retryDelay);
        };

        checkWails();
    });
}

/**
 * 在 Wails 准备好前等待回调
 * 
 * @param callback 当运行时准备好时执行的回调
 * @param timeout 超时时间（毫秒），默认 5000ms
 */
export function onWailsReady(
    callback: () => void,
    timeout = 5000
): void {
    waitForWailsRuntime(timeout / 100, 100)
        .then(callback)
        .catch((err) => {
            console.error('[Wails] 初始化失败:', err);
            // 仍然尝试执行回调，可能有部分初始化完成
            callback();
        });
}

/**
 * 检查 Wails 是否准备就绪
 */
export function isWailsReady(): boolean {
    return !!(window.wails?.Callback || window.go?.services?.Service?.GetPlayerSetting);
}

/**
 * 包装一个后端调用，确保 Wails 已准备好
 * 
 * @param fn 后端调用函数
 * @param timeout 等待超时（毫秒）
 * @returns Promise 包装后的调用
 */
export async function withWailsReady<T>(
    fn: () => Promise<T>,
    timeout = 5000
): Promise<T> {
    try {
        await waitForWailsRuntime(timeout / 100, 100);
        return await fn();
    } catch (err) {
        console.error('[Wails] 运行时初始化失败:', err);
        throw err;
    }
}
