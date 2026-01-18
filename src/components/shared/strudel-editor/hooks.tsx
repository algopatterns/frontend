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
  editor?: {
    scrollDOM: HTMLElement;
    dom: HTMLElement;
    coordsAtPos: (
      pos: number
    ) => { left: number; right: number; top: number; bottom: number } | null;
    state: {
      selection: { main: { head: number } };
      doc: { lineAt: (pos: number) => { number: number; from: number; to: number } };
    };
  };
}

let strudelMirrorInstance: StrudelMirrorInstance | null = null;
let codePollingInterval: ReturnType<typeof setInterval> | null = null;
let getAudioContextFn: (() => AudioContext) | null = null;
let superdoughFn:
  | ((value: Record<string, unknown>, time: number, duration?: number) => Promise<void>)
  | null = null;

// track the last time we explicitly requested play
// used to ignore spurious onToggle(false) calls that arrive too soon after play
let lastExplicitPlayTime: number = 0;
const TOGGLE_DEBOUNCE_MS = 1000;

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
  fn:
    | ((value: Record<string, unknown>, time: number, duration?: number) => Promise<void>)
    | null
) {
  superdoughFn = fn;
}

// cursor change callback for remote cursor tracking
type CursorChangeCallback = (line: number, col: number) => void;
let cursorChangeCallback: CursorChangeCallback | null = null;

export function setCursorChangeCallback(callback: CursorChangeCallback | null) {
  cursorChangeCallback = callback;
}

export function getCursorPosition(): { line: number; col: number } | null {
  const instance = getStrudelMirrorInstance();
  if (!instance?.editor) return null;

  try {
    const { head } = instance.editor.state.selection.main;
    const lineInfo = instance.editor.state.doc.lineAt(head);
    return {
      line: lineInfo.number, // 1-indexed
      col: head - lineInfo.from, // 0-indexed column within line
    };
  } catch {
    return null;
  }
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

  if (!strudelMirrorInstance) {
    console.warn('[strudel] No instance available for evaluate');
    return;
  }

  try {
    // optimistically set playing state before evaluate
    // this ensures UI updates even if onToggle callback is delayed
    lastExplicitPlayTime = Date.now();
    useAudioStore.getState().setPlaying(true);

    await strudelMirrorInstance.evaluate();
  } catch (error) {
    console.error('[strudel] Evaluate failed:', error);
    // revert state on error - clear timestamp so onToggle(false) won't be ignored
    lastExplicitPlayTime = 0;
    useAudioStore.getState().setPlaying(false);
    // add error to toast system
    const msg = error instanceof Error ? error.message : String(error);
    useAudioStore.getState().addEditorToast({
      type: 'error',
      message: msg,
    });
  }
}

export function stopStrudel() {
  if (!strudelMirrorInstance) {
    console.warn('[strudel] No instance available for stop');
    return;
  }

  // clear the play timestamp so onToggle(false) won't be ignored
  lastExplicitPlayTime = 0;

  // optimistically set playing state to false
  // this ensures UI updates even if onToggle callback is delayed
  useAudioStore.getState().setPlaying(false);

  strudelMirrorInstance.stop();
}

// sounds that need a note parameter to play (pitched instruments)
const PITCHED_SOUNDS = [
  // synths
  'sine',
  'triangle',
  'square',
  'sawtooth',
  'pulse',
  'sin',
  'tri',
  'sqr',
  'saw',
  'white',
  'pink',
  'brown',
  'crackle',
  'supersaw',
  'bytebeat',
  'sbd',
  'user',
  'zzfx',
  'z_sine',
  'z_sawtooth',
  'z_triangle',
  'z_square',
  'z_tan',
  'z_noise',

  // piano sample
  'piano',
];

function isPitchedSound(name: string): boolean {
  // gm soundfonts all start with gm_
  if (name.startsWith('gm_')) return true;

  // check against known pitched sounds
  return PITCHED_SOUNDS.includes(name);
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

    // build parameters for superdough
    // superdough signature: (value, t, hapDuration, cps, cycle)
    const params: Record<string, unknown> = { s: sampleName };

    // pitched instruments need a note to play
    if (isPitchedSound(sampleName)) {
      params.note = 60; // Middle C (C4)
    }

    const startTime = ctx.currentTime + 0.01;
    const duration = 0.5; // half second preview
    const cps = 1; // 1 cycle per second (60 BPM)

    // @ts-expect-error - superdoughFn signature is not typed
    await superdoughFn(params, startTime, duration, cps);
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

    // apply read-only state via CSS on the container
    if (containerRef.current) {
      const cmContent = containerRef.current.querySelector(
        '.cm-content'
      ) as HTMLElement | null;

      if (cmContent) {
        cmContent.contentEditable = readOnly ? 'false' : 'true';
      }
    }
  }, [readOnly]);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message || String(event.reason) || 'Unknown error';

      // always prevent default to stop Next.js overlay
      event.preventDefault();

      // suppress known non-critical patterns
      if (SUPPRESSED_ERROR_PATTERNS.some(pattern => msg.includes(pattern))) {
        return;
      }

      // add to toast system
      useAudioStore.getState().addEditorToast({
        type: 'error',
        message: msg,
      });
    };

    const handleError = (event: ErrorEvent) => {
      const msg = event.message || 'Unknown error';

      // suppress known non-critical patterns
      if (SUPPRESSED_ERROR_PATTERNS.some(pattern => msg.includes(pattern))) {
        return;
      }

      // prevent default to stop Next.js overlay
      event.preventDefault();

      // add to toast system
      useAudioStore.getState().addEditorToast({
        type: 'error',
        message: msg,
      });
    };

    // intercept console.error to catch strudel's internal errors
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      originalConsoleError.apply(console, args);

      const firstArg = String(args[0] || '');

      // check if this is a strudel eval error
      if (firstArg.includes('[eval] error:')) {
        const errorMsg = args[1] ? String(args[1]) : firstArg.replace('[eval] error:', '').trim();
        useAudioStore.getState().addEditorToast({
          type: 'error',
          message: errorMsg,
        });
        return;
      }

      // check if first arg is a SyntaxError or similar
      if (args[0] instanceof Error) {
        const error = args[0] as Error;
        if (error.name === 'SyntaxError' || error.message.includes('Unexpected token')) {
          useAudioStore.getState().addEditorToast({
            type: 'error',
            message: error.message,
          });
        }
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
      console.error = originalConsoleError;
    };
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

            if (process.env.NODE_ENV === 'development') {
              setLogger?.((msg: string) => {
                if (!SUPPRESSED_ERROR_PATTERNS.some(pattern => msg.includes(pattern))) {
                  console.log('[strudel]', msg);
                }
              });
            }

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
            // ignore spurious onToggle(false) calls that arrive too soon after
            // an explicit play request - this prevents race conditions where
            // strudel fires false before true during startup
            if (!started && lastExplicitPlayTime > 0) {
              const timeSincePlay = Date.now() - lastExplicitPlayTime;
              if (timeSincePlay < TOGGLE_DEBOUNCE_MS) {
                return;
              }
            }

            setPlaying(started);
            if (started) setError(null);
          },

          onUpdateState: (state: { isDirty?: boolean }) => {
            if (typeof state.isDirty === 'boolean') {
              useAudioStore.getState().setCodeDirty(state.isDirty);
            }
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

        // apply read-only state after editor is created
        if (readOnlyRef.current && containerRef.current) {
          const cmContent = containerRef.current.querySelector(
            '.cm-content'
          ) as HTMLElement | null;
          if (cmContent) {
            cmContent.contentEditable = 'false';
          }
        }

        if (!isMounted) {
          mirror.stop();
          mirror.destroy?.();
          return;
        }

        setStrudelMirrorInstance(mirror);
        setInitialized(true);

        // paste detection for CC signals
        const currentContainer = containerRef.current;
        const handlePaste = () => {
          useEditorStore.getState().setNextUpdateSource('paste');
        };
        currentContainer?.addEventListener('paste', handlePaste);

        // cursor position tracking for collaboration
        let lastCursorLine = 0;
        let lastCursorCol = 0;

        const emitCursorPosition = () => {
          const pos = getCursorPosition();
          if (pos && (pos.line !== lastCursorLine || pos.col !== lastCursorCol)) {
            lastCursorLine = pos.line;
            lastCursorCol = pos.col;
            cursorChangeCallback?.(pos.line, pos.col);
          }
        };

        // listen for events that change cursor position
        currentContainer?.addEventListener('keyup', emitCursorPosition);
        currentContainer?.addEventListener('mouseup', emitCursorPosition);
        currentContainer?.addEventListener('click', emitCursorPosition);

        // store cleanup functions
        const cleanup = () => {
          currentContainer?.removeEventListener('paste', handlePaste);
          currentContainer?.removeEventListener('keyup', emitCursorPosition);
          currentContainer?.removeEventListener('mouseup', emitCursorPosition);
          currentContainer?.removeEventListener('click', emitCursorPosition);
        };

        // attach cleanup to the return
        (mirror as StrudelMirrorInstance & { _cleanup?: () => void })._cleanup = cleanup;

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
        // call cleanup for event listeners
        (instance as StrudelMirrorInstance & { _cleanup?: () => void })._cleanup?.();
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
