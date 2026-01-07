'use client';

import { Button } from '@/components/ui/button';
import { useSyncPlaybackOverlay } from './hooks';

export function SyncPlaybackOverlay() {
  const { showSyncOverlay, handleSync } = useSyncPlaybackOverlay();

  if (!showSyncOverlay) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-background border shadow-lg max-w-sm text-center">
        <div className="text-lg font-medium">Audio Playback</div>
        <p className="text-sm text-muted-foreground">
          Browser requires interaction to enable audio. Click below to sync with
          the current playback state.
        </p>
        <Button onClick={handleSync} size="lg" className="w-full">
          Sync Playback
        </Button>
      </div>
    </div>
  );
}
