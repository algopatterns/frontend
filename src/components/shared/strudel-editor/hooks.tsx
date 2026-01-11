'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '@/lib/stores/editor';
import { useAudioStore } from '@/lib/stores/audio';
import { useWebSocketStore } from '@/lib/stores/websocket';
import { EDITOR } from '@/lib/constants';

export const SAMPLE_SOURCES = {
  doughSamples: 'https://raw.githubusercontent.com/felixroos/dough-samples/main',
  uzuDrumkit: 'https://raw.githubusercontent.com/tidalcycles/uzu-drumkit/main',
  dirtSamples:
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/strudel.json',
} as const;

export const INSTRUMENT_SHORTCUTS = [
  'piano',
  'guitar',
  'bass',
  'violin',
  'cello',
  'flute',
  'clarinet',
  'trumpet',
  'organ',
  'harp',
  'vibraphone',
  'marimba',
  'xylophone',
  'kalimba',
  'banjo',
  'sitar',
] as const;

export const DRUM_MACHINE_ALIASES: Record<string, string> = {
  tr505: 'RolandTR505',
  tr606: 'RolandTR606',
  tr626: 'RolandTR626',
  tr707: 'RolandTR707',
  tr727: 'RolandTR727',
  tr808: 'RolandTR808',
  tr909: 'RolandTR909',
  cr78: 'RolandCompurhythm78',
  lm1: 'LinnLM1',
  lm2: 'LinnLM2',
  linndrum: 'LinnDrum',
  dmx: 'OberheimDMX',
  sp12: 'EmuSP12',
  mpc60: 'AkaiMPC60',
  hr16: 'AlesisHR16',
  sr16: 'AlesisSR16',
};

export const DRUM_HIT_TYPES = [
  'bd',
  'sd',
  'hh',
  'oh',
  'cp',
  'lt',
  'mt',
  'ht',
  'rs',
  'cb',
  'cy',
  'rim',
  'cr',
  'rd',
];

export const SUPPRESSED_ERROR_PATTERNS = ['not found', 'duck target orbit'];

export interface StrudelMirrorInstance {
  code?: string;
  setCode: (code: string) => void;
  evaluate: () => Promise<void>;
  stop: () => void;
  destroy?: () => void;
  reconfigureExtension?: (name: string, value: unknown) => void;
  setFontFamily?: (font: string) => void;
  setFontSize?: (size: number) => void;
  setLineNumbers?: (show: boolean) => void;
  setLineWrapping?: (wrap: boolean) => void;
}

let strudelMirrorInstance: StrudelMirrorInstance | null = null;
let codePollingInterval: ReturnType<typeof setInterval> | null = null;
let getAudioContextFn: (() => AudioContext) | null = null;
let superdoughFn:
  | ((value: Record<string, unknown>, time: number, duration?: number) => Promise<void>)
  | null = null;

export function getStrudelMirrorInstance() {
  return strudelMirrorInstance;
}

export function setStrudelMirrorInstance(instance: StrudelMirrorInstance | null) {
  strudelMirrorInstance = instance;
}

export function getCodePollingInterval() {
  return codePollingInterval;
}

export function setCodePollingInterval(interval: ReturnType<typeof setInterval> | null) {
  codePollingInterval = interval;
}

export function setAudioContextFn(fn: (() => AudioContext) | null) {
  getAudioContextFn = fn;
}

export function setSuperdoughFn(
  fn: ((value: Record<string, unknown>, time: number, duration?: number) => Promise<void>) | null
) {
  superdoughFn = fn;
}

export function isAudioContextSuspended(): boolean {
  if (!getAudioContextFn) {
    return false;
  }

  try {
    return getAudioContextFn().state === 'suspended';
  } catch {
    return false;
  }
}

export async function resumeAudioContext(): Promise<boolean> {
  if (!getAudioContextFn) {
    return false;
  }

  try {
    const ctx = getAudioContextFn();

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    return ctx.state === 'running';
  } catch (e) {
    console.warn('[strudel] Failed to resume audio context:', e);
    return false;
  }
}

export async function evaluateStrudel() {
  await resumeAudioContext();
  strudelMirrorInstance?.evaluate();
}

export function stopStrudel() {
  strudelMirrorInstance?.stop();
}

export async function previewSample(sampleName: string): Promise<boolean> {
  if (!superdoughFn || !getAudioContextFn) {
    console.warn('[strudel] Audio not initialized yet');
    return false;
  }

  try {
    const ctx = getAudioContextFn();

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    await superdoughFn({ s: sampleName }, ctx.currentTime + 0.01);
    return true;
  } catch (error) {
    console.warn('[strudel] Failed to preview sample:', error);
    return false;
  }
}

export function useStrudelEditor(
  initialCode: string,
  onCodeChange: ((code: string) => void) | undefined,
  readOnly: boolean
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const onCodeChangeRef = useRef(onCodeChange);
  const readOnlyRef = useRef(readOnly);

  const { code, setCode, currentStrudelId } = useEditorStore();
  const { setPlaying, setInitialized, setError } = useAudioStore();
  const wsStatus = useWebSocketStore(state => state.status);
  const sessionStateReceived = useWebSocketStore(state => state.sessionStateReceived);

  // use lazy initial state for URL params (avoids setState in effect)
  const [urlStrudelId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('id');
  });

  const effectiveStrudelId = currentStrudelId || urlStrudelId;

  useEffect(() => {
    onCodeChangeRef.current = onCodeChange;
  }, [onCodeChange]);

  useEffect(() => {
    readOnlyRef.current = readOnly;

    if (strudelMirrorInstance) {
      strudelMirrorInstance.reconfigureExtension?.('isEditable', !readOnly);
    }
  }, [readOnly]);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message || '';

      if (SUPPRESSED_ERROR_PATTERNS.some(pattern => msg.includes(pattern))) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () =>
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  useEffect(() => {
    if (!strudelMirrorInstance) return;
    const currentCode = strudelMirrorInstance.code || '';
    if (currentCode !== code && code !== undefined) {
      strudelMirrorInstance.setCode(code);
      strudelMirrorInstance.code = code;
    }
  }, [code]);

  // main initialization effect
  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    let isMounted = true;

    async function initEditor() {
      try {
        const [
          { StrudelMirror },
          { transpiler },
          webaudioModule,
          { registerSoundfonts },
          coreModule,
        ] = await Promise.all([
          import('@strudel/codemirror'),
          import('@strudel/transpiler'),
          import('@strudel/webaudio'),
          import('@strudel/soundfonts'),
          import('@strudel/core'),
        ]);

        const {
          getAudioContext,
          webaudioOutput,
          initAudioOnFirstClick,
          registerSynthSounds,
          samples,
        } = webaudioModule;

        setAudioContextFn(getAudioContext);

        type WebaudioModule = Record<string, unknown>;
        type SuperdoughFn = (
          value: WebaudioModule,
          time: number,
          duration?: number
        ) => Promise<void>;

        setSuperdoughFn((webaudioModule as WebaudioModule).superdough as SuperdoughFn);

        if (!containerRef.current || !isMounted) {
          return;
        }

        const { evalScope, silence } = coreModule;

        containerRef.current.innerHTML = '';

        const mirror = new StrudelMirror({
          transpiler,
          defaultOutput: webaudioOutput,
          getTime: () => getAudioContext().currentTime,
          root: containerRef.current,
          initialCode: initialCode || code || EDITOR.DEFAULT_CODE,
          pattern: silence,
          drawTime: [-2, 2],
          autodraw: true,
          bgFill: false,
          prebake: async () => {
            initAudioOnFirstClick();

            const { doughSamples: ds, uzuDrumkit: tc, dirtSamples } = SAMPLE_SOURCES;

            await Promise.all([
              evalScope(
                import('@strudel/core'),
                import('@strudel/codemirror'),
                import('@strudel/webaudio'),
                import('@strudel/draw'),
                import('@strudel/mini'),
                import('@strudel/tonal')
              ),

              registerSynthSounds(),
              registerSoundfonts(),

              samples(`${ds}/tidal-drum-machines.json`),
              samples(`${ds}/piano.json`),
              samples(`${ds}/vcsl.json`),
              samples(`${ds}/Dirt-Samples.json`),
              samples(`${ds}/EmuSP12.json`),
              samples(`${ds}/mridangam.json`),

              samples(`${dirtSamples}?v=${Date.now()}`),
              samples(`${tc}/strudel.json`),
              samples('github:tidalcycles/dirt-samples'),
            ]);

            const soundAlias = (webaudioModule as Record<string, unknown>).soundAlias as
              | ((from: string, to: string) => void)
              | undefined;

            if (soundAlias) {
              for (const [shorthand, full] of Object.entries(DRUM_MACHINE_ALIASES)) {
                for (const hit of DRUM_HIT_TYPES) {
                  soundAlias(`${full}_${hit}`, `${shorthand}_${hit}`);
                }
              }
            }

            const setLogger = (webaudioModule as Record<string, unknown>).setLogger as
              | ((fn: (msg: string) => void) => void)
              | undefined;

            setLogger?.((msg: string) => {
              if (!SUPPRESSED_ERROR_PATTERNS.some(pattern => msg.includes(pattern))) {
                console.log('[strudel]', msg);
              }
            });

            const { Pattern } = await import('@strudel/core');
            const proto = Pattern.prototype as Record<string, (name: string) => unknown>;

            for (const inst of INSTRUMENT_SHORTCUTS) {
              if (!proto[inst]) {
                proto[inst] = function () {
                  return proto.s.call(this, inst);
                };
              }
            }
          },

          onToggle: (started: boolean) => {
            setPlaying(started);
            if (started) setError(null);
          },

          onError: (error: Error) => {
            console.error('strudel error:', error);
            setError(error.message);
          },
        });

        mirror.setFontSize?.(14);
        mirror.setLineNumbers?.(true);
        mirror.setLineWrapping?.(true);
        mirror.setFontFamily?.('var(--font-geist-mono), monospace');
        mirror.reconfigureExtension?.('isPatternHighlightingEnabled', true);
        mirror.reconfigureExtension?.('isFlashEnabled', true);

        if (readOnlyRef.current) {
          mirror.reconfigureExtension?.('isEditable', false);
        }

        if (!isMounted) {
          mirror.stop();
          mirror.destroy?.();
          return;
        }

        setStrudelMirrorInstance(mirror);
        setInitialized(true);

        const handlePaste = () => {
          useEditorStore.getState().setNextUpdateSource('paste');
        };
        containerRef.current?.addEventListener('paste', handlePaste);

        if (initialCode) {
          setCode(initialCode, true);
        }

        const currentStoreCode = useEditorStore.getState().code;

        const instance = getStrudelMirrorInstance();
        if (currentStoreCode && currentStoreCode !== instance?.code) {
          instance?.setCode(currentStoreCode);
          if (instance) instance.code = currentStoreCode;
        }

        const interval = setInterval(() => {
          const inst = getStrudelMirrorInstance();
          if (!inst) {
            return;
          }

          const currentCode = inst.code || '';
          const storeCode = useEditorStore.getState().code;

          if (currentCode !== storeCode) {
            setCode(currentCode);
            onCodeChangeRef.current?.(currentCode);
          }
        }, 500);

        setCodePollingInterval(interval);
      } catch (error) {
        console.error('failed to initialize strudel:', error);
        setError('failed to initialize audio engine');
      }
    }

    initEditor();

    return () => {
      isMounted = false;
      initializedRef.current = false;

      const interval = getCodePollingInterval();

      if (interval) {
        clearInterval(interval);
        setCodePollingInterval(null);
      }

      const instance = getStrudelMirrorInstance();

      if (instance) {
        instance.stop();
        instance.destroy?.();
        setStrudelMirrorInstance(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: init runs once on mount
  }, []);

  const isLoadingStrudel =
    effectiveStrudelId &&
    (wsStatus === 'connecting' || (wsStatus === 'connected' && !sessionStateReceived));

  return {
    containerRef,
    isLoadingStrudel,
  };
}
