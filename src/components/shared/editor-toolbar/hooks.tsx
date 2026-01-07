'use client';

import { useAudioStore } from '@/lib/stores/audio';
import { useWebSocketStore } from '@/lib/stores/websocket';

export type SaveStatus = 'saved' | 'saving' | 'unsaved';

export function useEditorToolbar() {
  const { isPlaying, isInitialized } = useAudioStore();
  const { status } = useWebSocketStore();

  return {
    isPlaying,
    isInitialized,
    status,
  };
}
