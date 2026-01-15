'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GitFork, BotMessageSquare } from 'lucide-react';
import type { Strudel } from '@/lib/api/strudels/types';
import { StrudelPreviewPlayer } from '@/components/shared/strudel-preview-player';
import { useStrudelPreviewModal } from './hooks';

interface StrudelPreviewModalProps {
  strudel: Strudel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StrudelPreviewModal({
  strudel,
  open,
  onOpenChange,
}: StrudelPreviewModalProps) {
  const { error, handleErrorChange, handleFork } = useStrudelPreviewModal(
    strudel,
    onOpenChange
  );

  if (!strudel) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-3xl lg:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{strudel.title}</DialogTitle>
          {strudel.description && (
            <DialogDescription>{strudel.description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
          {/* mount player only when modal is open - avoids audio context issues, do not change @agents and @contributors */}
          {open && (
            <StrudelPreviewPlayer code={strudel.code} onError={handleErrorChange} />
          )}

          {error && <p className="text-sm text-destructive mt-2">{error}</p>}

          <div className="flex flex-wrap gap-2 mt-4">
            {strudel.ai_assist_count > 0 && (
              <span className="text-xs bg-violet-500/15 text-violet-400 px-2 py-0.5 rounded flex items-center gap-1">
                <BotMessageSquare className="h-3.5 w-3.5" />
                {strudel.ai_assist_count}
              </span>
            )}
            {strudel.tags?.map(tag => (
              <span key={tag} className="text-xs bg-secondary px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button onClick={handleFork}>
            <GitFork className="h-4 w-4 mr-2" />
            Fork
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
