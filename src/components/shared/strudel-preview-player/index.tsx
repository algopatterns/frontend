'use client';

import { Button } from '@/components/ui/button';
import { Play, Square, Loader2 } from 'lucide-react';
import { useStrudelPreviewPlayer } from './hooks';

interface StrudelPreviewPlayerProps {
  code: string;
  onError?: (error: string | null) => void;
}

export function StrudelPreviewPlayer({ code, onError }: StrudelPreviewPlayerProps) {
  const {
    containerRef,
    isPlaying,
    isLoading,
    isInitialized,
    handlePlay,
    handleStop,
  } = useStrudelPreviewPlayer({ code, onError });

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={containerRef}
        className="strudel-editor h-96 w-full overflow-auto rounded-lg border bg-muted/30"
      />

      <div className="flex items-center gap-2">
        {isLoading ? (
          <Button size="sm" disabled>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        ) : isPlaying ? (
          <Button size="sm" variant="destructive" onClick={handleStop}>
            <Square className="h-4 w-4 mr-2" />
            Stop
          </Button>
        ) : (
          <Button size="sm" onClick={handlePlay} disabled={!isInitialized}>
            <Play className="h-4 w-4 mr-2" />
            Play
          </Button>
        )}
      </div>
    </div>
  );
}
