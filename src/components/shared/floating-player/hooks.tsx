'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePlayerStore } from '@/lib/stores/player';
import { getGlobalMirror, StrudelMirrorInstance } from '@/components/shared/strudel-editor/hooks';

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

  // Check if global mirror is available
  useEffect(() => {
    const checkMirror = () => {
      const mirror = getGlobalMirror();
      if (mirror) {
        mirrorRef.current = mirror;
        setIsInitialized(true);
        console.log('[DEBUG floating-player] using global mirror');
      }
    };

    checkMirror();
    const timer = setTimeout(checkMirror, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Play when currentStrudel changes
  useEffect(() => {
    if (!currentStrudel) return;

    const mirror = mirrorRef.current || getGlobalMirror();
    if (!mirror) {
      console.log('[DEBUG floating-player] no mirror available yet');
      return;
    }

    // Capture values to satisfy TypeScript
    const strudel = currentStrudel;
    const activeMirror = mirror;
    let isMounted = true;

    async function playStrudel() {
      try {
        console.log('[DEBUG floating-player] playing:', strudel.title);
        setIsLoading(true);
        setError(null);

        // Resume audio context if needed
        const { getAudioContext } = await import('@strudel/webaudio');
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        // Save original code so we can restore it
        originalCodeRef.current = activeMirror.code || '';

        // Set the preview code and evaluate
        activeMirror.setCode(strudel.code);
        activeMirror.code = strudel.code;
        await activeMirror.evaluate();

        if (isMounted) {
          setIsPlaying(true);
          setIsLoading(false);
          console.log('[DEBUG floating-player] playback started via global mirror');
        }
      } catch (err) {
        console.error('floating player error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to play');
          setIsLoading(false);
          setIsPlaying(false);
        }
      }
    }

    playStrudel();

    return () => {
      isMounted = false;
    };
  }, [currentStrudel, setIsPlaying, setIsLoading]);

  // Handle resume requests
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

  // Handle stop requests
  useEffect(() => {
    if (shouldStop) {
      setShouldStop(false);

      const mirror = mirrorRef.current || getGlobalMirror();
      if (mirror) {
        mirror.stop();
        // Restore original code
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
      // Restore original code
      if (originalCodeRef.current !== null) {
        mirror.setCode(originalCodeRef.current);
        mirror.code = originalCodeRef.current;
        originalCodeRef.current = null;
      }
    }
    setIsPlaying(false);
    console.log('[DEBUG floating-player] stopped');
  }, [setIsPlaying]);

  const handleClose = useCallback(() => {
    console.log('[DEBUG floating-player] handleClose');

    const mirror = mirrorRef.current || getGlobalMirror();
    if (mirror) {
      mirror.stop();
      // Restore original code
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
