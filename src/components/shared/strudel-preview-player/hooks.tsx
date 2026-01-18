'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { EDITOR } from '@/lib/constants';
import {
  SAMPLE_SOURCES,
  INSTRUMENT_SHORTCUTS,
  DRUM_MACHINE_ALIASES,
  DRUM_HIT_TYPES,
  SUPPRESSED_ERROR_PATTERNS,
} from '@/components/shared/strudel-editor/hooks';

interface UseStrudelPreviewPlayerOptions {
  code: string;
  onError?: (error: string | null) => void;
}

export function useStrudelPreviewPlayer({ code, onError }: UseStrudelPreviewPlayerOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<InstanceType<typeof import('@strudel/codemirror').StrudelMirror> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // initialize the mini player
  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;

    async function initPlayer() {
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

        if (!containerRef.current || !isMounted) return;

        const { evalScope, silence } = coreModule;

        containerRef.current.innerHTML = '';

        const mirror = new StrudelMirror({
          transpiler,
          defaultOutput: webaudioOutput,
          getTime: () => getAudioContext().currentTime,
          root: containerRef.current,
          initialCode: code || EDITOR.DEFAULT_CODE,
          pattern: silence,
          drawTime: [-2, 2],
          autodraw: false,
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
                  console.log('[strudel-preview]', msg);
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
            if (isMounted) {
              setIsPlaying(started);
              if (started) onError?.(null);
            }
          },

          onError: (error: Error) => {
            console.error('strudel preview error:', error);
            onError?.(error.message);
          },
        });

        mirror.setFontSize?.(13);
        mirror.setLineNumbers?.(true);
        mirror.setLineWrapping?.(true);
        mirror.setFontFamily?.('var(--font-geist-mono), monospace');
        mirror.reconfigureExtension?.('isPatternHighlightingEnabled', true);
        mirror.reconfigureExtension?.('isFlashEnabled', true);
        mirror.reconfigureExtension?.('isEditable', false); // read-only

        if (!isMounted) {
          mirror.stop();
          mirror.destroy?.();
          return;
        }

        mirrorRef.current = mirror;
        setIsInitialized(true);
        setIsLoading(false);
      } catch (error) {
        console.error('failed to initialize strudel preview:', error);
        onError?.('Failed to initialize audio engine');
        setIsLoading(false);
      }
    }

    initPlayer();

    return () => {
      isMounted = false;
      if (mirrorRef.current) {
        mirrorRef.current.stop();
        mirrorRef.current.destroy?.();
        mirrorRef.current = null;
      }
    };
  }, [code, onError]);

  const handlePlay = useCallback(async () => {
    if (!mirrorRef.current) return;

    try {
      // resume audio context if needed
      const { getAudioContext } = await import('@strudel/webaudio');
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      mirrorRef.current.evaluate();
    } catch (error) {
      console.error('failed to play:', error);
    }
  }, []);

  const handleStop = useCallback(() => {
    mirrorRef.current?.stop();
  }, []);

  return {
    containerRef,
    isPlaying,
    isLoading,
    isInitialized,
    handlePlay,
    handleStop,
  };
}
