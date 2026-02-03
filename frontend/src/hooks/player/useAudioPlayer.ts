/**
 * 音频播放器核心 Hook
 * 管理音频元素和基础播放状态
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import type { Song } from '../../types';
import { acquireSharedAudioEngine, releaseSharedAudioEngine, resetSharedAudioEngineToNativeOutput } from '../../utils/sharedAudioEngine';

const getDefaultWebAudioDisableReason = (): string | null => {
    // Wails on Linux uses WebKitGTK. MediaElementSource routing can intermittently produce silence.
    // Prefer native <audio> output for reliability.
    const w = window as unknown as { wails?: unknown; go?: unknown };
    let isWails = false;
    try {
        // Avoid touching window.wails.Callback directly — Wails runtime is injected asynchronously.
        const wailsAny = (w as any).wails;
        isWails = Boolean((w as any).go || (wailsAny && typeof wailsAny === 'object' && 'Callback' in wailsAny));
    } catch {
        isWails = Boolean((w as any).go);
    }

    const ua = navigator.userAgent ?? '';
    const isLinux = /Linux/i.test(ua);
    const isWebKit = /AppleWebKit/i.test(ua) && !/Chrome|Chromium|Edg/i.test(ua);
    if (isWails && isLinux && isWebKit) return 'wails-linux-webkit';
    return null;
};

export interface AudioPlayerState {
    isPlaying: boolean;
    progress: number;
    duration: number;
    volume: number;
}

export interface AudioPlayerActions {
    play: () => Promise<void>;
    pause: () => void;
    seek: (time: number) => void;
    setVolume: (volume: number) => void;
}

export interface UseAudioPlayerReturn {
    audioRef: React.RefObject<HTMLAudioElement>;
    state: AudioPlayerState;
    actions: AudioPlayerActions;
    ensureWebAudioReady?: () => void;
}

export const useAudioPlayer = (currentSong: Song | null, initialVolume?: number, volumeCompensationDb: number = 0) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const engineRef = useRef<ReturnType<typeof acquireSharedAudioEngine> | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(initialVolume ?? 0.5);

    // 初始化音频元素（注意：在 Wails/Linux WebKit 下，new Audio() + WebAudio 路由可能导致无声；
    // 挂到 DOM 的 <audio> 更稳）
    useEffect(() => {
        const engine = acquireSharedAudioEngine();
        engineRef.current = engine;
        audioRef.current = engine.audio;

        if (!engine.webAudioDisabled) {
            const reason = getDefaultWebAudioDisableReason();
            if (reason) {
                engine.webAudioDisabled = true;
                engine.webAudioDisabledReason = reason;
                // Ensure we are actually using native output (WebKit may go silent when routed via WebAudio).
                // Only reset when we already touched WebAudio, to avoid unnecessary element replacement.
                if (engine.audioContext || engine.sourceNode || engine.gainNode || engine.playPatched) {
                    resetSharedAudioEngineToNativeOutput(engine);
                    audioRef.current = engine.audio;
                }
            }
        }

        return () => {
            engineRef.current = null;
            releaseSharedAudioEngine();
        };
    }, []);

    // 在首次播放时建立 WebAudio 链路并确保 resume（避免启动阶段就创建 AudioContext 导致策略/无声问题）
    const ensureWebAudioReady = useCallback(() => {
        const audio = audioRef.current;
        const engine = engineRef.current;
        if (!engine) return;
        if (!audio) return;

        if (engine.webAudioDisabled) return;

        if (!engine.audioContext) {
            const w = window as Window & { webkitAudioContext?: typeof AudioContext };
            const AudioContextCtor = window.AudioContext || w.webkitAudioContext;
            if (AudioContextCtor) {
                engine.audioContext = new AudioContextCtor();
            }
        }
        const ctx = engine.audioContext;
        if (!ctx) return;

        if (!engine.gainNode) {
            engine.gainNode = ctx.createGain();
            engine.gainNode.gain.value = 1;
        }

        if (!engine.sourceNode) {
            try {
                engine.sourceNode = ctx.createMediaElementSource(audio);
                engine.sourceNode.connect(engine.gainNode);
                engine.gainNode.connect(ctx.destination);
            } catch (err) {
                console.warn('创建音频增益节点失败，回退到原生音量控制:', err);
            }
        }

        // 注入 play：无论谁调用 audio.play()，都尽量先 resume
        if (!engine.playPatched) {
            engine.originalPlay = audio.play.bind(audio);
            audio.play = async () => {
                try {
                    if (ctx.state === 'suspended') {
                        ctx.resume().catch((e) => {
                            console.warn('AudioContext resume 失败（可能被浏览器策略阻止）:', e);
                        });
                    }
                } catch (e) {
                    console.warn('AudioContext resume 失败（可能被浏览器策略阻止）:', e);
                }
                return engine.originalPlay!();
            };
            engine.playPatched = true;
        }
    }, []);

    // 同步音量
    useEffect(() => {
        if (!audioRef.current) return;
        if (engineRef.current?.gainNode && !engineRef.current.webAudioDisabled) {
            audioRef.current.volume = volume;
            return;
        }
        const db = Number.isFinite(volumeCompensationDb) ? volumeCompensationDb : 0;
        const gain = Math.pow(10, db / 20);
        const effectiveVolume = Math.min(1, Math.max(0, volume * gain));
        audioRef.current.volume = effectiveVolume;
    }, [volume, volumeCompensationDb]);

    // 应用音量补偿（dB）到 GainNode
    useEffect(() => {
        const gainNode = engineRef.current?.gainNode;
        if (!gainNode) return;
        if (engineRef.current?.webAudioDisabled) return;
        const db = Number.isFinite(volumeCompensationDb) ? volumeCompensationDb : 0;
        const gain = Math.pow(10, db / 20);
        const clamped = Math.min(4, Math.max(0.25, gain));
        gainNode.gain.value = clamped;
    }, [volumeCompensationDb]);

    const play = useCallback(async () => {
        if (!audioRef.current) return;
        try {
            ensureWebAudioReady();
            audioRef.current.muted = false;
            await audioRef.current.play();
            setIsPlaying(true);
        } catch (error) {
            console.error('播放失败:', error);
            setIsPlaying(false);
        }
    }, [ensureWebAudioReady]);

    // 清理逻辑由 sharedAudioEngine 的 refCount 控制

    const pause = useCallback(() => {
        if (!audioRef.current) return;
        audioRef.current.pause();
        setIsPlaying(false);
    }, []);

    const seek = useCallback((time: number) => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = time;
        setProgress(time);
    }, []);

    const handleVolumeChange = useCallback((newVolume: number) => {
        setVolume(newVolume);
    }, []);

    return {
        audioRef,
        state: {
            isPlaying,
            progress,
            duration,
            volume,
        },
        actions: {
            play,
            pause,
            seek,
            setVolume: handleVolumeChange,
        },
        ensureWebAudioReady,
        // 内部状态设置器（供其他 hooks 使用）
        setIsPlaying,
        setProgress,
        setDuration,
    };
};
