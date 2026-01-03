'use client';

import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/lib/stores/editor';
import { useAudioStore } from '@/lib/stores/audio';
import { EDITOR } from '@/lib/constants';

// sample pack URLs
const SAMPLE_SOURCES = {
  doughSamples: 'https://raw.githubusercontent.com/felixroos/dough-samples/main',
  uzuDrumkit: 'https://raw.githubusercontent.com/tidalcycles/uzu-drumkit/main',
  dirtSamples: 'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/strudel.json',
} as const;

// instrument shortcuts to add to Pattern prototype (maps to .s('instrument'))
const INSTRUMENT_SHORTCUTS = [
  'piano', 'guitar', 'bass', 'violin', 'cello', 'flute',
  'clarinet', 'trumpet', 'organ', 'harp', 'vibraphone',
  'marimba', 'xylophone', 'kalimba', 'banjo', 'sitar',
] as const;

// drum machine shorthand aliases (tr808 -> RolandTR808, etc.)
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
const DRUM_HIT_TYPES = ['bd', 'sd', 'hh', 'oh', 'cp', 'lt', 'mt', 'ht', 'rs', 'cb', 'cy', 'rim', 'cr', 'rd'];

// error patterns to suppress (missing samples, etc.)
const SUPPRESSED_ERROR_PATTERNS = ['not found', 'duck target orbit'];

interface StrudelEditorProps {
  initialCode?: string;
  onCodeChange?: (code: string) => void;
}

interface StrudelMirrorInstance {
  code?: string;
  setCode: (code: string) => void;
  evaluate: () => Promise<void>;
  stop: () => void;
  destroy?: () => void;
}

let strudelMirrorInstance: StrudelMirrorInstance | null = null;
let codePollingInterval: ReturnType<typeof setInterval> | null = null;

export function StrudelEditor({ initialCode = '', onCodeChange }: StrudelEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const onCodeChangeRef = useRef(onCodeChange);

  const { code, setCode } = useEditorStore();
  const { setPlaying, setInitialized, setError } = useAudioStore();

  useEffect(() => {
    onCodeChangeRef.current = onCodeChange;
  }, [onCodeChange]);

  // suppress unhandled rejections for missing sounds
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message || '';
      if (SUPPRESSED_ERROR_PATTERNS.some(pattern => msg.includes(pattern))) {
        event.preventDefault();
      }
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
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

        const { getAudioContext, webaudioOutput, initAudioOnFirstClick, registerSynthSounds, samples } = webaudioModule;
        const { evalScope, silence } = coreModule;

        if (!containerRef.current || !isMounted) return;

        containerRef.current.innerHTML = '';

        const mirror = new StrudelMirror({
          defaultOutput: webaudioOutput,
          getTime: () => getAudioContext().currentTime,
          transpiler,
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
                import('@strudel/tonal'),
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

        // configure editor appearance
        mirror.setFontFamily?.('var(--font-geist-mono), monospace');
        mirror.setFontSize?.(14);
        mirror.setLineNumbers?.(true);
        mirror.setLineWrapping?.(true);
        mirror.reconfigureExtension?.('isPatternHighlightingEnabled', true);
        mirror.reconfigureExtension?.('isFlashEnabled', true);

        if (!isMounted) {
          mirror.stop();
          mirror.destroy?.();
          return;
        }

        strudelMirrorInstance = mirror;
        setInitialized(true);

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
          if (!strudelMirrorInstance) return;
          
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

  return (
    <div
      ref={containerRef}
      className="strudel-editor h-full w-full overflow-hidden border-t rounded-none"
    />
  );
}

export function evaluateStrudel() {
  strudelMirrorInstance?.evaluate();
}

export function stopStrudel() {
  strudelMirrorInstance?.stop();
}
