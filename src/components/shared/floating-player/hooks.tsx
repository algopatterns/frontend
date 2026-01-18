'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePlayerStore } from '@/lib/stores/player';
import { getGlobalMirror, getOrCreatePlaybackMirror, StrudelMirrorInstance } from '@/components/shared/strudel-editor/hooks';

export function useFloatingPlayer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const originalCodeRef = useRef<string | null>(null);
  const mirrorRef = useRef<StrudelMirrorInstance | null>(null);

  const {
    currentStrudel,
    isPlaying,
    isLoading,
    shouldResume,
    shouldStop,
    setIsPlaying,
    setIsLoading,
    setCurrentStrudel,
    setShouldResume,
    setShouldStop,
  } = usePlayerStore();

  // pending strudel to play once mirror is ready
  const pendingPlayRef = useRef<typeof currentStrudel>(null);

  // get or create a mirror for playback
  useEffect(() => {
    let isMounted = true;

    async function initMirror() {
      // first check if global mirror exists
      let globalMirror = getGlobalMirror();
      if (globalMirror) {
        mirrorRef.current = globalMirror;
        if (isMounted) {
          setIsInitialized(true);
          // if there's a pending play, trigger it
          if (pendingPlayRef.current) {
            const pending = pendingPlayRef.current;
            pendingPlayRef.current = null;
            playStrudelInternal(pending, globalMirror);
          }
        }
        return;
      }

      // wait a bit to see if main editor will create a global mirror
      // this avoids creating a playback mirror on pages that have the main editor
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!isMounted) return;

      // check again after waiting
      globalMirror = getGlobalMirror();
      if (globalMirror) {
        mirrorRef.current = globalMirror;
        if (isMounted) {
          setIsInitialized(true);
          if (pendingPlayRef.current) {
            const pending = pendingPlayRef.current;
            pendingPlayRef.current = null;
            playStrudelInternal(pending, globalMirror);
          }
        }
        return;
      }

      // still no global mirror, create/get playback mirror (we're likely on explore page)
      const playbackMirror = await getOrCreatePlaybackMirror();
      if (playbackMirror && isMounted) {
        mirrorRef.current = playbackMirror;
        setIsInitialized(true);
        if (pendingPlayRef.current) {
          const pending = pendingPlayRef.current;
          pendingPlayRef.current = null;
          playStrudelInternal(pending, playbackMirror);
        }
      }
    }

    initMirror();

    return () => {
      isMounted = false;
    };
  }, []);

  // internal play function
  const playStrudelInternal = useCallback(async (strudel: NonNullable<typeof currentStrudel>, mirror: StrudelMirrorInstance) => {
    try {
      setIsLoading(true);
      setError(null);

      // resume audio context if needed
      const { getAudioContext } = await import('@strudel/webaudio');
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // save original code so we can restore it
      originalCodeRef.current = mirror.code || '';

      // set the preview code and evaluate
      mirror.setCode(strudel.code);
      mirror.code = strudel.code;
      await mirror.evaluate();

      setIsPlaying(true);
      setIsLoading(false);
    } catch (err) {
      console.error('floating player error:', err);
      setError(err instanceof Error ? err.message : 'Failed to play');
      setIsLoading(false);
      setIsPlaying(false);
    }
  }, [setIsLoading, setIsPlaying]);

  // play when currentStrudel changes
  useEffect(() => {
    if (!currentStrudel) return;

    const mirror = mirrorRef.current || getGlobalMirror();
    if (!mirror) {
      // mirror not ready, queue the play for when it's ready
      pendingPlayRef.current = currentStrudel;
      return;
    }

    playStrudelInternal(currentStrudel, mirror);
  }, [currentStrudel, playStrudelInternal]);

  // handle resume requests
  useEffect(() => {
    if (shouldResume && currentStrudel) {
      setShouldResume(false);

      const mirror = mirrorRef.current || getGlobalMirror();
      if (!mirror) return;

      (async () => {
        try {
          const { getAudioContext } = await import('@strudel/webaudio');
          const ctx = getAudioContext();
          if (ctx.state === 'suspended') {
            await ctx.resume();
          }

          mirror.setCode(currentStrudel.code);
          mirror.code = currentStrudel.code;
          await mirror.evaluate();
          setIsPlaying(true);
        } catch (err) {
          console.error('resume error:', err);
          setError(err instanceof Error ? err.message : 'Failed to resume');
        }
      })();
    }
  }, [shouldResume, currentStrudel, setShouldResume, setIsPlaying]);

  // handle stop requests
  useEffect(() => {
    if (shouldStop) {
      setShouldStop(false);

      const mirror = mirrorRef.current || getGlobalMirror();
      if (mirror) {
        mirror.stop();
        // restore original code
        if (originalCodeRef.current !== null) {
          mirror.setCode(originalCodeRef.current);
          mirror.code = originalCodeRef.current;
          originalCodeRef.current = null;
        }
      }
      setIsPlaying(false);
    }
  }, [shouldStop, setShouldStop, setIsPlaying]);

  const handlePlay = useCallback(async () => {
    if (!currentStrudel) return;

    const mirror = mirrorRef.current || getGlobalMirror();
    if (!mirror) return;

    try {
      const { getAudioContext } = await import('@strudel/webaudio');
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      mirror.setCode(currentStrudel.code);
      mirror.code = currentStrudel.code;
      await mirror.evaluate();
      setIsPlaying(true);
    } catch (err) {
      console.error('play error:', err);
      setError(err instanceof Error ? err.message : 'Failed to play');
    }
  }, [currentStrudel, setIsPlaying]);

  const handleStop = useCallback(() => {
    const mirror = mirrorRef.current || getGlobalMirror();
    if (mirror) {
      mirror.stop();
      // restore original code
      if (originalCodeRef.current !== null) {
        mirror.setCode(originalCodeRef.current);
        mirror.code = originalCodeRef.current;
        originalCodeRef.current = null;
      }
    }
    setIsPlaying(false);
  }, [setIsPlaying]);

  const handleClose = useCallback(() => {
    const mirror = mirrorRef.current || getGlobalMirror();
    if (mirror) {
      mirror.stop();
      // restore original code
      if (originalCodeRef.current !== null) {
        mirror.setCode(originalCodeRef.current);
        mirror.code = originalCodeRef.current;
        originalCodeRef.current = null;
      }
    }

    setCurrentStrudel(null);
    setIsPlaying(false);
    setIsLoading(false);
    setError(null);
  }, [setCurrentStrudel, setIsPlaying, setIsLoading]);

  return {
    containerRef,
    currentStrudel,
    isPlaying,
    isLoading,
    isInitialized,
    error,
    handlePlay,
    handleStop,
    handleClose,
  };
}
