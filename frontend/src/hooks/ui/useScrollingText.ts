import { useEffect, useRef, useState } from 'react';

interface UseScrollingTextOptions {
    text: string;
    containerWidth?: number;
    speed?: number; // 像素/秒
    pauseDuration?: number; // 暂停时间(秒)
    enabled?: boolean;
}

interface ScrollingTextResult {
    containerRef: React.RefObject<HTMLDivElement>;
    textRef: React.RefObject<HTMLSpanElement>;
    containerClassName: string;
    textClassName: string;
    containerStyle: React.CSSProperties;
    animationStyle: React.CSSProperties;
    shouldScroll: boolean;
}

export const useScrollingText = ({
    text,
    containerWidth = 300,
    speed = 60, // 60像素/秒
    pauseDuration = 2, // 2秒暂停
    enabled = true,
}: UseScrollingTextOptions): ScrollingTextResult => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [shouldScroll, setShouldScroll] = useState(false);
    const [animationDuration, setAnimationDuration] = useState(10);
    const [scrollDistance, setScrollDistance] = useState(0);

    useEffect(() => {
        if (!enabled || !text || !containerRef.current || !textRef.current) {
            setShouldScroll(false);
            return;
        }

        // 测量文本实际宽度
        const measureText = () => {
            const container = containerRef.current;
            const textElement = textRef.current;

            if (!container || !textElement) return;

            // 临时移除动画以获取准确测量
            textElement.style.animation = 'none';
            textElement.style.transform = 'translateX(0)';

            // 强制重排以获取准确尺寸
            container.offsetHeight;

            const containerRect = container.getBoundingClientRect();
            const textRect = textElement.getBoundingClientRect();

            const containerWidthPx = containerRect.width;
            const textWidthPx = textRect.width;

            console.log('滚动文本测量:', {
                text,
                containerWidth: containerWidthPx,
                textWidth: textWidthPx,
                needsScroll: textWidthPx > containerWidthPx
            });

            // 只有当文本宽度超过容器宽度时才启用滚动
            const needsScroll = textWidthPx > containerWidthPx && textWidthPx > 0;
            setShouldScroll(needsScroll);

            if (needsScroll) {
                // 计算滚动距离（文本宽度 - 容器宽度）
                const distance = textWidthPx - containerWidthPx;
                setScrollDistance(distance);

                // 根据滚动距离和速度计算动画时长
                // 总时长 = 滚动时间 + 两端暂停时间
                const scrollTime = distance / speed;
                const totalDuration = scrollTime + (pauseDuration * 2);

                setAnimationDuration(totalDuration);

                console.log('滚动动画参数:', {
                    distance,
                    scrollTime,
                    totalDuration,
                    speed,
                    pauseDuration
                });
            }
        };

        // 延迟测量，确保DOM已渲染
        const timer = setTimeout(measureText, 100);

        // 监听窗口大小变化
        const handleResize = () => {
            setTimeout(measureText, 100);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handleResize);
        };
    }, [text, containerWidth, speed, pauseDuration, enabled]);

    const containerClassName = `scrolling-text-container ${shouldScroll ? 'has-scrolling' : ''}`;
    const textClassName = `scrolling-text ${shouldScroll ? 'animate' : ''}`;

    const containerStyle: React.CSSProperties = {
        maxWidth: containerWidth,
        '--container-width': `${containerWidth}px`,
        '--scroll-distance': `-${scrollDistance}px`,
    } as React.CSSProperties;

    const animationStyle: React.CSSProperties = shouldScroll ? {
        '--animation-duration': `${animationDuration}s`,
        '--animation-delay': `${pauseDuration}s`,
        animation: `smoothScroll ${animationDuration}s linear infinite`,
        animationDelay: `${pauseDuration}s`,
    } as React.CSSProperties : {};

    return {
        containerRef,
        textRef,
        containerClassName,
        textClassName,
        containerStyle,
        animationStyle,
        shouldScroll,
    };
};