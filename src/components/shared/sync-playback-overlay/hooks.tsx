'use client';

import { useCallback } from 'react';
import { useAudioStore } from '@/lib/stores/audio';
import {
  resumeAudioContext,
  evaluateStrudel,
  stopStrudel,
} from '../strudel-editor';

export function useSyncPlaybackOverlay() {
  const { showSyncOverlay, pendingPlaybackAction, setShowSyncOverlay, setPendingPlayback } =
    useAudioStore();

  const handleSync = useCallback(async () => {
    const resumed = await resumeAudioContext();

    if (resumed && pendingPlaybackAction) {
      if (pendingPlaybackAction === 'play') {
        evaluateStrudel();
      } else {
        stopStrudel();
      }
    }

    setPendingPlayback(null);
    setShowSyncOverlay(false);
  }, [pendingPlaybackAction, setPendingPlayback, setShowSyncOverlay]);

  return {
    showSyncOverlay,
    handleSync,
  };
}
