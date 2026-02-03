export interface SharedAudioEngine {
    audio: HTMLAudioElement;
    refCount: number;
    audioContext: AudioContext | null;
    gainNode: GainNode | null;
    sourceNode: MediaElementAudioSourceNode | null;
    webAudioDisabled: boolean;
    webAudioDisabledReason: string | null;
    playPatched: boolean;
    originalPlay: HTMLMediaElement['play'] | null;
}

declare global {
    // eslint-disable-next-line no-var
    var __halfBeatSharedAudioEngine: SharedAudioEngine | undefined;
}

const createHiddenAudioElement = (): HTMLAudioElement => {
    const el = document.createElement('audio');
    el.crossOrigin = 'anonymous';
    el.preload = 'metadata';
    el.style.position = 'fixed';
    el.style.left = '-99999px';
    el.style.width = '1px';
    el.style.height = '1px';
    el.style.opacity = '0';
    el.setAttribute('aria-hidden', 'true');
    return el;
};

export const resetSharedAudioEngineToNativeOutput = (engine: SharedAudioEngine): void => {
    // Best-effort cleanup: once MediaElementSource is created, some runtimes may keep routing through WebAudio.
    // Replacing the <audio> element guarantees native output is restored.
    const oldAudio = engine.audio;

    try {
        if (engine.playPatched && engine.originalPlay) {
            oldAudio.play = engine.originalPlay;
        }
    } catch {
        // ignore
    }

    try {
        engine.sourceNode?.disconnect();
    } catch {
        // ignore
    }

    try {
        engine.gainNode?.disconnect();
    } catch {
        // ignore
    }

    try {
        engine.audioContext?.close().catch(() => undefined);
    } catch {
        // ignore
    }

    try {
        oldAudio.pause();
        oldAudio.src = '';
        oldAudio.load();
    } catch {
        // ignore
    }

    const newAudio = createHiddenAudioElement();
    try {
        const parent = oldAudio.parentElement;
        if (parent) {
            parent.replaceChild(newAudio, oldAudio);
        } else if (document.body) {
            document.body.appendChild(newAudio);
        }
    } catch {
        // ignore
    }

    engine.audio = newAudio;
    engine.audioContext = null;
    engine.gainNode = null;
    engine.sourceNode = null;
    engine.playPatched = false;
    engine.originalPlay = null;
};

export const acquireSharedAudioEngine = (): SharedAudioEngine => {
    const existing = globalThis.__halfBeatSharedAudioEngine;
    if (existing) {
        existing.refCount += 1;
        return existing;
    }

    if (typeof document === 'undefined') {
        throw new Error('acquireSharedAudioEngine must be called in a browser environment');
    }

    const audio = createHiddenAudioElement();
    if (document.body) {
        document.body.appendChild(audio);
    } else {
        document.addEventListener(
            'DOMContentLoaded',
            () => {
                if (!audio.parentElement) {
                    document.body?.appendChild(audio);
                }
            },
            { once: true }
        );
    }

    const engine: SharedAudioEngine = {
        audio,
        refCount: 1,
        audioContext: null,
        gainNode: null,
        sourceNode: null,
        webAudioDisabled: false,
        webAudioDisabledReason: null,
        playPatched: false,
        originalPlay: null,
    };

    globalThis.__halfBeatSharedAudioEngine = engine;
    return engine;
};

export const releaseSharedAudioEngine = (): void => {
    const engine = globalThis.__halfBeatSharedAudioEngine;
    if (!engine) return;

    engine.refCount = Math.max(0, engine.refCount - 1);
    if (engine.refCount > 0) return;

    try {
        engine.audio.pause();
        engine.audio.src = '';
        engine.audio.load();
    } catch {
        // ignore
    }

    try {
        engine.audio.parentElement?.removeChild(engine.audio);
    } catch {
        // ignore
    }

    try {
        engine.audioContext?.close().catch(() => undefined);
    } catch {
        // ignore
    }

    globalThis.__halfBeatSharedAudioEngine = undefined;
};
