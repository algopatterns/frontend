'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getGlobalMirror, StrudelMirrorInstance } from '@/components/shared/strudel-editor/hooks';

interface UseStrudelPreviewPlayerOptions {
  code: string;
  onError?: (error: string | null) => void;
}

export function useStrudelPreviewPlayer({ code, onError }: UseStrudelPreviewPlayerOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const originalCodeRef = useRef<string | null>(null);
  const mirrorRef = useRef<StrudelMirrorInstance | null>(null);

  // Check if global mirror is available
  useEffect(() => {
    const checkMirror = () => {
      const mirror = getGlobalMirror();
      if (mirror) {
        mirrorRef.current = mirror;
        setIsInitialized(true);
        console.log('[DEBUG preview] using global mirror');
      }
    };

    // Check immediately
    checkMirror();

    // Also check after a delay in case main editor hasn't initialized yet
    const timer = setTimeout(checkMirror, 1000);

    return () => {
      clearTimeout(timer);
      // Stop playback if we were playing
      if (isPlaying && mirrorRef.current) {
        mirrorRef.current.stop();
        // Restore original code if we changed it
        if (originalCodeRef.current !== null) {
          mirrorRef.current.setCode(originalCodeRef.current);
          mirrorRef.current.code = originalCodeRef.current;
        }
      }
    };
  }, [isPlaying]);

  const handlePlay = useCallback(async () => {
    const mirror = mirrorRef.current || getGlobalMirror();
    if (!mirror || !code) {
      onError?.('Editor not initialized');
      return;
    }

    try {
      setIsLoading(true);
      onError?.(null);

      // Resume audio context if needed
      const { getAudioContext } = await import('@strudel/webaudio');
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Save original code so we can restore it
      originalCodeRef.current = mirror.code || '';

      // Set the preview code and evaluate
      mirror.setCode(code);
      mirror.code = code;
      await mirror.evaluate();

      setIsPlaying(true);
      setIsLoading(false);
      console.log('[DEBUG preview] playback started via global mirror');
    } catch (error) {
      console.error('preview play error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to play');
      setIsLoading(false);
    }
  }, [code, onError]);

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
    console.log('[DEBUG preview] stopped');
  }, []);

  return {
    isPlaying,
    isLoading,
    isInitialized,
    handlePlay,
    handleStop,
  };
}
