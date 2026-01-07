'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Play, Square, Plus, Share2 } from 'lucide-react';
import { useEditorToolbar, type SaveStatus } from './hooks';
import { SaveIndicator, ConnectionIndicator } from './components';

interface EditorToolbarProps {
  onPlay: () => void;
  onStop: () => void;
  onSave?: () => void;
  onNew?: () => void;
  onShare?: () => void;
  showSave?: boolean;
  showNew?: boolean;
  showShare?: boolean;
  saveStatus?: SaveStatus;
  isViewer?: boolean;
}

export function EditorToolbar({
  onPlay,
  onStop,
  onSave,
  onNew,
  onShare,
  showSave = false,
  showNew = false,
  showShare = false,
  saveStatus = 'saved',
  isViewer = false,
}: EditorToolbarProps) {
  const { isPlaying, isInitialized, status } = useEditorToolbar();

  return (
    <div className="flex items-center gap-2 p-2 border-b bg-background h-12">
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant={isPlaying ? 'outline' : 'default'}
          onClick={isPlaying ? onStop : onPlay}
          disabled={isViewer || (!isInitialized && !isPlaying)}
          className="rounded-none min-w-20"
          title={
            isViewer
              ? 'Only hosts can control playback'
              : isPlaying
              ? 'Stop (Ctrl+.)'
              : 'Play (Ctrl+Enter)'
          }>
          {isPlaying ? (
            <Square className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
          {isPlaying ? 'Stop' : 'Play'}
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ConnectionIndicator status={status} />
      </div>

      <div className="flex-1" />

      {showSave && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-round-sm"
              variant="outline"
              onClick={onSave}
              disabled={saveStatus === 'saving'}
              className="text-muted-foreground hover:text-foreground">
              <SaveIndicator status={saveStatus} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {saveStatus === 'saved' && 'All changes saved'}
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'unsaved' && 'Unsaved changes'}
          </TooltipContent>
        </Tooltip>
      )}

      {showNew && onNew && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-round-sm"
              variant="outline"
              onClick={onNew}
              className="text-muted-foreground hover:text-foreground">
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Strudel</TooltipContent>
        </Tooltip>
      )}

      {showShare && onShare && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-round-sm"
              variant="outline"
              onClick={onShare}
              className="text-muted-foreground hover:text-foreground">
              <Share2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
