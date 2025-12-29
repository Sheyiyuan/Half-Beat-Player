/**
 * 颜色工具函数
 */

/**
 * 判断颜色是否为亮色
 * 使用相对亮度公式：(R*0.299 + G*0.587 + B*0.114)
 * @param hexColor 十六进制颜色值 (#RRGGBB)
 * @returns true 为亮色，false 为暗色
 */
export function isColorLight(hexColor: string): boolean {
    const hex = hexColor.replace('#', '');

    // 处理带透明度的颜色 (#RRGGBBAA)
    const colorHex = hex.length === 8 ? hex.substring(0, 6) : hex;

    const r = parseInt(colorHex.substring(0, 2), 16);
    const g = parseInt(colorHex.substring(2, 4), 16);
    const b = parseInt(colorHex.substring(4, 6), 16);

    // 使用相对亮度公式计算亮度
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // 阈值为 128，可调整
    return brightness > 128;
}

/**
 * 根据颜色亮度判断使用亮色还是暗色方案
 * @param hexColor 十六进制颜色值
 * @returns 'light' 或 'dark'
 */
export function getColorSchemeFromBackground(hexColor: string): 'light' | 'dark' {
    return isColorLight(hexColor) ? 'light' : 'dark';
}
