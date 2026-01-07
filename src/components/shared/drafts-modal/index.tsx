'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Trash2, Play, Clock } from 'lucide-react';
import { storage, type Draft } from '@/lib/utils/storage';
import { useUIStore } from '@/lib/stores/ui';
import { useEditorStore } from '@/lib/stores/editor';
import { formatRelativeTime } from '@/lib/utils/date';

export function DraftsModal() {
  const router = useRouter();
  const { isDraftsModalOpen, setDraftsModalOpen } = useUIStore();
  const { setCode, setConversationHistory, setForkedFromId, setParentCCSignal } = useEditorStore();
  const [discardedIds, setDiscardedIds] = useState<Set<string>>(new Set());

  // load drafts when modal opens, filter out discarded ones
  const drafts = useMemo(() => {
    if (!isDraftsModalOpen) return [];
    return storage.getAllDrafts().filter(d => !discardedIds.has(d.id));
  }, [isDraftsModalOpen, discardedIds]);

  const handleContinue = (draft: Draft) => {
    // set the draft as current
    storage.setCurrentDraftId(draft.id);

    // load the draft into editor
    setCode(draft.code, true);
    setConversationHistory(draft.conversationHistory || []);

    if (draft.forkedFromId) {
      setForkedFromId(draft.forkedFromId);
      setParentCCSignal(draft.parentCCSignal ?? null);
    }

    setDraftsModalOpen(false);
    router.push('/');
  };

  const handleDiscard = (draftId: string) => {
    storage.deleteDraft(draftId);
    setDiscardedIds(prev => new Set([...prev, draftId]));
  };

  return (
    <Dialog open={isDraftsModalOpen} onOpenChange={setDraftsModalOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Drafts
          </DialogTitle>
          <DialogDescription>
            Your unsaved work is stored locally in your browser
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No drafts</h3>
              <p className="text-muted-foreground text-sm">
                Your unsaved work will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {drafts.map(draft => (
                <div
                  key={draft.id}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">
                        {draft.title || 'Untitled Draft'}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(new Date(draft.updatedAt).toISOString())}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDiscard(draft.id)}
                        className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" onClick={() => handleContinue(draft)}>
                        <Play className="h-4 w-4 mr-1" />
                        Continue
                      </Button>
                    </div>
                  </div>
                  <pre className="mt-3 text-xs bg-muted/50 p-2 rounded overflow-hidden text-ellipsis whitespace-nowrap w-full">
                    {draft.code.slice(0, 150)}
                    {draft.code.length > 150 && '...'}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
