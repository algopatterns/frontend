'use client';

import { Button } from '@/components/ui/button';
import { Play, Pause, X, Loader2, BotMessageSquare } from 'lucide-react';
import { useFloatingPlayer } from './hooks';

export function FloatingPlayer() {
  const {
    containerRef,
    currentStrudel,
    isPlaying,
    isLoading,
    error,
    handlePlay,
    handleStop,
    handleClose,
  } = useFloatingPlayer();

  if (!currentStrudel) return null;

  return (
    <>
      {/* Hidden container for Strudel engine */}
      <div ref={containerRef} className="hidden" />

      {/* Visible mini-player bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
        <div className="flex items-center gap-4 h-16 px-4">
          {/* Play/Pause button */}
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            onClick={isPlaying ? handleStop : handlePlay}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          {/* Song info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{currentStrudel.title}</span>
              {currentStrudel.ai_assist_count > 0 && (
                <span className="text-xs bg-violet-500/15 text-violet-400 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                  <BotMessageSquare className="h-3.5 w-3.5" />
                  {currentStrudel.ai_assist_count}
                </span>
              )}
            </div>
            {error ? (
              <p className="text-xs text-destructive truncate">{error}</p>
            ) : (
              <p className="text-xs text-muted-foreground truncate">
                {isLoading ? 'Loading...' : isPlaying ? 'Now playing' : 'Paused'}
              </p>
            )}
          </div>

          {/* Close button */}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
