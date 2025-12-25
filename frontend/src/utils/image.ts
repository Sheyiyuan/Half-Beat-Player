/**
 * 图片压缩工具函数
 * 将图片压缩为 JPEG 格式并返回 DataURL
 */
export const compressImageToWebp = async (
    file: File,
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.7
): Promise<string> => {
    return new Promise((resolve, reject) => {
        // 避免 Mantine 的 Image 组件遮蔽全局 Image 构造函数
        const img = new window.Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            try {
                const { width, height } = img;
                let targetW = width;
                let targetH = height;
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    targetW = Math.round(width * ratio);
                    targetH = Math.round(height * ratio);
                }
                const canvas = document.createElement("canvas");
                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    URL.revokeObjectURL(url);
                    reject(new Error("无法创建画布上下文"));
                    return;
                }
                ctx.drawImage(img, 0, 0, targetW, targetH);
                // 使用 toDataURL 而不是 toBlob，直接返回 DataURL
                const dataUrl = canvas.toDataURL("image/jpeg", quality);
                URL.revokeObjectURL(url);
                resolve(dataUrl);
            } catch (err) {
                URL.revokeObjectURL(url);
                reject(new Error(`图片压缩失败: ${String(err)}`));
            }
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("图片加载失败"));
        };
        img.src = url;
    });
};

/**
 * 从文件输入加载并压缩背景图片
 */
export const loadBackgroundFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void
) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
        const compressed = await compressImageToWebp(file);
        setter(compressed);
    } catch (err) {
        console.error("压缩图片失败", err);
    } finally {
        e.target.value = "";
    }
};
