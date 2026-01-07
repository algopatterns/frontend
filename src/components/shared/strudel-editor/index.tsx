'use client';

import { useEffect } from 'react';
import { useEditorStore } from '@/lib/stores/editor';
import { Loader2 } from 'lucide-react';
import { EDITOR } from '@/lib/constants';
import {
  useStrudelEditor,
  SAMPLE_SOURCES,
  INSTRUMENT_SHORTCUTS,
  DRUM_MACHINE_ALIASES,
  DRUM_HIT_TYPES,
  SUPPRESSED_ERROR_PATTERNS,
  getStrudelMirrorInstance,
  setStrudelMirrorInstance,
  getCodePollingInterval,
  setCodePollingInterval,
  setAudioContextFn,
  setSuperdoughFn,
} from './hooks';

export {
  isAudioContextSuspended,
  resumeAudioContext,
  evaluateStrudel,
  stopStrudel,
  previewSample,
} from './hooks';

interface StrudelEditorProps {
  initialCode?: string;
  onCodeChange?: (code: string) => void;
  readOnly?: boolean;
}

export function StrudelEditor({
  initialCode = '',
  onCodeChange,
  readOnly = false,
}: StrudelEditorProps) {
  const {
    containerRef,
    initializedRef,
    onCodeChangeRef,
    readOnlyRef,
    code,
    setCode,
    setPlaying,
    setInitialized,
    setError,
    isLoadingStrudel,
  } = useStrudelEditor(initialCode, onCodeChange, readOnly);

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
