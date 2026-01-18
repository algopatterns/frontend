'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getGlobalMirror, getOrCreatePlaybackMirror, StrudelMirrorInstance } from '@/components/shared/strudel-editor/hooks';

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
        }
        return;
      }

      // still no global mirror, create/get playback mirror (we're likely on explore page)
      const playbackMirror = await getOrCreatePlaybackMirror();
      if (playbackMirror && isMounted) {
        mirrorRef.current = playbackMirror;
        setIsInitialized(true);
      }
    }

    initMirror();

    return () => {
      isMounted = false;
    };
  }, []);

  // cleanup effect - stop playback when component unmounts
  useEffect(() => {
    return () => {
      // use a ref check to avoid stale closure issues
      if (mirrorRef.current && originalCodeRef.current !== null) {
        mirrorRef.current.stop();
        mirrorRef.current.setCode(originalCodeRef.current);
        mirrorRef.current.code = originalCodeRef.current;
        originalCodeRef.current = null;
      }
    };
  }, []);

  const handlePlay = useCallback(async () => {
    const mirror = mirrorRef.current || getGlobalMirror();
    if (!mirror || !code) {
      onError?.('Editor not initialized');
      return;
    }

    try {
      setIsLoading(true);
      onError?.(null);

      // resume audio context if needed
      const { getAudioContext } = await import('@strudel/webaudio');
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // save original code so we can restore it
      originalCodeRef.current = mirror.code || '';

      // set the preview code and evaluate
      mirror.setCode(code);
      mirror.code = code;
      await mirror.evaluate();

      setIsPlaying(true);
      setIsLoading(false);
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
      // restore original code
      if (originalCodeRef.current !== null) {
        mirror.setCode(originalCodeRef.current);
        mirror.code = originalCodeRef.current;
        originalCodeRef.current = null;
      }
    }
    setIsPlaying(false);
  }, []);

  return {
    isPlaying,
    isLoading,
    isInitialized,
    handlePlay,
    handleStop,
  };
}
