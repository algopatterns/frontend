'use client';

import { Button } from '@/components/ui/button';
import { Play, Pause, Eye, BarChart3, BotMessageSquare, Loader2 } from 'lucide-react';
import { usePlayerStore } from '@/lib/stores/player';
import type { Strudel } from '@/lib/api/strudels/types';

interface StrudelListItemProps {
  strudel: Strudel;
  onView: () => void;
  onStats: () => void;
}

export function StrudelListItem({
  strudel,
  onView,
  onStats,
}: StrudelListItemProps) {
  const { currentStrudel, isPlaying, isLoading, play, stop } = usePlayerStore();

  const isCurrentlyPlaying = currentStrudel?.id === strudel.id;
  const isThisLoading = isCurrentlyPlaying && isLoading;
  const isThisPlaying = isCurrentlyPlaying && isPlaying;

  const handlePlayPause = () => {
    if (isThisPlaying) {
      stop();
    } else {
      play(strudel);
    }
  };

  return (
    <div className="group flex items-center gap-4 px-4 py-3 rounded-md hover:bg-muted/50 transition-colors">
      {/* Play button */}
      <Button
        size="icon"
        variant="ghost"
        className={`group/play h-10 w-10 rounded-full shrink-0 transition-all ${
          isThisPlaying
            ? 'bg-primary hover:!bg-zinc-900'
            : 'bg-primary/10 hover:!bg-zinc-900'
        }`}
        onClick={handlePlayPause}
        disabled={isThisLoading}
      >
        {isThisLoading ? (
          <Loader2 className={`h-4 w-4 animate-spin ${isThisPlaying ? 'text-primary-foreground' : 'text-primary'}`} />
        ) : isThisPlaying ? (
          <Pause className="h-4 w-4 text-primary-foreground group-hover/play:!text-white" />
        ) : (
          <Play className="h-4 w-4 ml-0.5 text-primary group-hover/play:!text-white" />
        )}
      </Button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{strudel.title}</span>
          {strudel.ai_assist_count > 0 && (
            <span className="text-xs bg-violet-500/15 text-violet-400 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
              <BotMessageSquare className="h-3.5 w-3.5" />
              {strudel.ai_assist_count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate">
            {strudel.description || 'No description'}
          </span>
          <span className="shrink-0">·</span>
          <span className="shrink-0">
            {new Date(strudel.updated_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Tags */}
      <div className="hidden md:flex items-center gap-1 shrink-0">
        {strudel.tags?.slice(0, 2).map(tag => (
          <span
            key={tag}
            className="text-xs bg-secondary px-2 py-0.5 rounded truncate max-w-20"
          >
            {tag}
          </span>
        ))}
        {strudel.tags && strudel.tags.length > 2 && (
          <span className="text-xs text-muted-foreground">
            +{strudel.tags.length - 2}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon-round-sm"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
          onClick={onStats}
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
        <Button
          size="icon-round-sm"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
          onClick={onView}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
