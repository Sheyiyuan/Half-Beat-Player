/**
 * 时间格式化工具函数
 */

export const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ":" : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

/**
 * 格式化时间，保留毫秒精度（用于起止时间设置）
 */
export const formatTimeWithMs = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const sFixed = s.toFixed(2).replace(/\.?0+$/, "");
    const parts = sFixed.split(".");
    const sFinal = parts[0].padStart(2, "0") + (parts[1] ? "." + parts[1] : "");
    return `${h > 0 ? h + ":" : ""}${String(m).padStart(2, "0")}:${sFinal}`;
};

export const formatTimeLabel = (value: number | string): string => {
    const n = Number(value) || 0;
    return formatTime(n);
};

export const parseTimeLabel = (value: string): number => {
    if (!value) return 0;
    const parts = value.split(":").map((p) => Number(p) || 0);
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
};
