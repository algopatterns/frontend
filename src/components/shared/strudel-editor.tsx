'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '@/lib/stores/editor';
import { useAudioStore } from '@/lib/stores/audio';
import { useWebSocketStore } from '@/lib/stores/websocket';
import { Loader2 } from 'lucide-react';
import { EDITOR } from '@/lib/constants';

// sample pack URLs
const SAMPLE_SOURCES = {
  doughSamples: 'https://raw.githubusercontent.com/felixroos/dough-samples/main',
  uzuDrumkit: 'https://raw.githubusercontent.com/tidalcycles/uzu-drumkit/main',
  dirtSamples:
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/strudel.json',
} as const;

// instrument shortcuts to add to pattern prototype (maps to .s('instrument'))
const INSTRUMENT_SHORTCUTS = [
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

// drum machine shorthand aliases
const DRUM_MACHINE_ALIASES: Record<string, string> = {
  // roland TR series
  tr505: 'RolandTR505',
  tr606: 'RolandTR606',
  tr626: 'RolandTR626',
  tr707: 'RolandTR707',
  tr727: 'RolandTR727',
  tr808: 'RolandTR808',
  tr909: 'RolandTR909',
  cr78: 'RolandCompurhythm78',

  // linn
  lm1: 'LinnLM1',
  lm2: 'LinnLM2',
  linndrum: 'LinnDrum',

  // other classics
  dmx: 'OberheimDMX',
  sp12: 'EmuSP12',
  mpc60: 'AkaiMPC60',
  hr16: 'AlesisHR16',
  sr16: 'AlesisSR16',
};

// common drum hit types
const DRUM_HIT_TYPES = [
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

// error patterns to suppress (missing samples, etc.)
const SUPPRESSED_ERROR_PATTERNS = ['not found', 'duck target orbit'];

interface StrudelEditorProps {
  initialCode?: string;
  onCodeChange?: (code: string) => void;
  readOnly?: boolean;
}

interface StrudelMirrorInstance {
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

export function StrudelEditor({
  initialCode = '',
  onCodeChange,
  readOnly = false,
}: StrudelEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const onCodeChangeRef = useRef(onCodeChange);
  const readOnlyRef = useRef(readOnly);

  const { code, setCode, currentStrudelId, setNextUpdateSource } = useEditorStore();
  const { setPlaying, setInitialized, setError } = useAudioStore();
  const wsStatus = useWebSocketStore(state => state.status);
  const sessionStateReceived = useWebSocketStore(state => state.sessionStateReceived);
  const hasReceivedStrudelCode = useRef(false);

  // check URL for strudel ID to show overlay before auth hydrates
  // uses useState to avoid hydration mismatch (server renders null, client updates after mount)
  const [urlStrudelId, setUrlStrudelId] = useState<string | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');

    if (id) {
      setUrlStrudelId(id);
    }
  }, []);

  const effectiveStrudelId = currentStrudelId || urlStrudelId;

  // track when we've received the strudel's code (to hide overlay)
  if (effectiveStrudelId && sessionStateReceived && !hasReceivedStrudelCode.current) {
    hasReceivedStrudelCode.current = true;
  }

  // reset when strudel changes
  if (!effectiveStrudelId) {
    hasReceivedStrudelCode.current = false;
  }

  useEffect(() => {
    onCodeChangeRef.current = onCodeChange;
  }, [onCodeChange]);

  // update read-only state
  useEffect(() => {
    readOnlyRef.current = readOnly;

    if (strudelMirrorInstance) {
      strudelMirrorInstance.reconfigureExtension?.('isEditable', !readOnly);
    }
  }, [readOnly]);

  // suppress unhandled rejections for missing sounds
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

  // initialize strudelMirror (runs once on mount)
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

        // store audio context and superdough for sample preview
        getAudioContextFn = getAudioContext;

        // superdough is re-exported from @strudel/webaudio but not in types
        type WebaudioModule = Record<string, unknown>;
        type SuperdoughFn = (
          value: WebaudioModule,
          time: number,
          duration?: number
        ) => Promise<void>;

        superdoughFn = (webaudioModule as WebaudioModule).superdough as SuperdoughFn;

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

            // register modules and load samples in parallel
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

              // dough-samples
              samples(`${ds}/tidal-drum-machines.json`),
              samples(`${ds}/piano.json`),
              samples(`${ds}/vcsl.json`),
              samples(`${ds}/Dirt-Samples.json`),
              samples(`${ds}/EmuSP12.json`),
              samples(`${ds}/mridangam.json`),

              // tidalcycles samples
              samples(`${dirtSamples}?v=${Date.now()}`),
              samples(`${tc}/strudel.json`),
              samples('github:tidalcycles/dirt-samples'),
            ]);

            // register drum machine aliases (tr808_bd -> RolandTR808_bd, etc.)
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

            // suppress missing sample errors
            const setLogger = (webaudioModule as Record<string, unknown>).setLogger as
              | ((fn: (msg: string) => void) => void)
              | undefined;

            setLogger?.((msg: string) => {
              if (!SUPPRESSED_ERROR_PATTERNS.some(pattern => msg.includes(pattern))) {
                console.log('[strudel]', msg);
              }
            });

            // add instrument shortcuts to Pattern prototype
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

        // editor appearance config
        mirror.setFontSize?.(14);
        mirror.setLineNumbers?.(true);
        mirror.setLineWrapping?.(true);
        mirror.setFontFamily?.('var(--font-geist-mono), monospace');
        mirror.reconfigureExtension?.('isPatternHighlightingEnabled', true);
        mirror.reconfigureExtension?.('isFlashEnabled', true);

        // apply initial read-only state
        if (readOnlyRef.current) {
          mirror.reconfigureExtension?.('isEditable', false);
        }

        if (!isMounted) {
          mirror.stop();
          mirror.destroy?.();
          return;
        }

        strudelMirrorInstance = mirror;
        setInitialized(true);

        // detect paste events to mark code updates as paste source
        const handlePaste = () => {
          useEditorStore.getState().setNextUpdateSource('paste');
        };
        containerRef.current?.addEventListener('paste', handlePaste);

        if (initialCode) {
          setCode(initialCode, true);
        }

        // sync with current store code (may have changed during async init)
        const currentStoreCode = useEditorStore.getState().code;

        if (currentStoreCode && currentStoreCode !== strudelMirrorInstance?.code) {
          strudelMirrorInstance.setCode(currentStoreCode);
          strudelMirrorInstance.code = currentStoreCode;
        }

        // poll for code changes (strudelMirror doesn't have onChange)
        codePollingInterval = setInterval(() => {
          if (!strudelMirrorInstance) {
            return;
          }

          const currentCode = strudelMirrorInstance.code || '';
          const storeCode = useEditorStore.getState().code;

          if (currentCode !== storeCode) {
            setCode(currentCode);
            onCodeChangeRef.current?.(currentCode);
          }
        }, 500);
      } catch (error) {
        console.error('failed to initialize strudel:', error);
        setError('failed to initialize audio engine');
      }
    }

    initEditor();

    return () => {
      isMounted = false;
      initializedRef.current = false;

      if (codePollingInterval) {
        clearInterval(codePollingInterval);
        codePollingInterval = null;
      }
      if (strudelMirrorInstance) {
        strudelMirrorInstance.stop();
        strudelMirrorInstance.destroy?.();
        strudelMirrorInstance = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: init runs once on mount
  }, []);

  // sync external code changes (from WebSocket)
  useEffect(() => {
    if (!strudelMirrorInstance) return;
    const currentCode = strudelMirrorInstance.code || '';
    if (currentCode !== code && code !== undefined) {
      strudelMirrorInstance.setCode(code);
      strudelMirrorInstance.code = code;
    }
  }, [code]);

  // show loading overlay only when loading a saved strudel (prevents flash from draft to strudel code)
  // uses effectiveStrudelId to catch URL param before auth hydrates
  const isLoadingStrudel =
    effectiveStrudelId &&
    !hasReceivedStrudelCode.current &&
    (wsStatus === 'connecting' || (wsStatus === 'connected' && !sessionStateReceived));

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className="strudel-editor h-full w-full overflow-hidden rounded-none"
      />
      {isLoadingStrudel && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading strudel...</p>
          </div>
        </div>
      )}
    </div>
  );
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
  // try to resume audio context (needed after page refresh)
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

    // resume audio context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // trigger the sample at current time
    await superdoughFn({ s: sampleName }, ctx.currentTime + 0.01);
    return true;
  } catch (error) {
    console.warn('[strudel] Failed to preview sample:', error);
    return false;
  }
}
