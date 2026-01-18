'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, Loader2 } from 'lucide-react';
import { useStrudelPreviewPlayer } from './hooks';
import { CodeDisplay } from './code-display';

export interface PlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  handlePlay: () => void;
  handleStop: () => void;
}

interface StrudelPreviewPlayerProps {
  code: string;
  onError?: (error: string | null) => void;
  hideControls?: boolean;
  onStateChange?: (state: PlayerState) => void;
}

export function StrudelPreviewPlayer({
  code,
  onError,
  hideControls = false,
  onStateChange,
}: StrudelPreviewPlayerProps) {
  const {
    isPlaying,
    isLoading,
    isInitialized,
    handlePlay,
    handleStop,
  } = useStrudelPreviewPlayer({ code, onError });

  // expose state to parent
  useEffect(() => {
    onStateChange?.({ isPlaying, isLoading, isInitialized, handlePlay, handleStop });
  }, [isPlaying, isLoading, isInitialized, handlePlay, handleStop, onStateChange]);

  return (
    <div className="flex flex-col gap-3">
      {/* Syntax-highlighted read-only code display */}
      <div className="h-96 w-full overflow-auto rounded-lg border bg-zinc-950 p-4">
        <CodeDisplay code={code} />
      </div>

      {!hideControls && (
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
      )}
    </div>
  );
}
