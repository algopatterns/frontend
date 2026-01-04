"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useAudioStore } from "@/lib/stores/audio";
import {
  resumeAudioContext,
  evaluateStrudel,
  stopStrudel,
} from "./strudel-editor";

export function SyncPlaybackOverlay() {
  const { showSyncOverlay, pendingPlaybackAction, setShowSyncOverlay, setPendingPlayback } =
    useAudioStore();

  const handleSync = useCallback(async () => {
    // resume audio context (this click provides the user gesture)
    const resumed = await resumeAudioContext();

    if (resumed && pendingPlaybackAction) {
      // execute the last playback action
      if (pendingPlaybackAction === "play") {
        evaluateStrudel();
      } else {
        stopStrudel();
      }
    }

    // clear pending state and hide overlay
    setPendingPlayback(null);
    setShowSyncOverlay(false);
  }, [pendingPlaybackAction, setPendingPlayback, setShowSyncOverlay]);

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
