"use client";

import { useCallback } from "react";
import { useAudioStore } from "@/lib/stores/audio";
import { evaluateStrudel, stopStrudel } from "@/components/shared/strudel-editor";

export function useStrudelAudio() {
  const { isPlaying, isInitialized } = useAudioStore();

  const evaluate = useCallback(() => {
    evaluateStrudel();
  }, []);

  const stop = useCallback(() => {
    stopStrudel();
  }, []);

  return {
    isInitialized,
    isPlaying,
    evaluate,
    stop,
  };
}
