'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { storage, type Draft } from '@/lib/utils/storage';
import { useUIStore } from '@/lib/stores/ui';
import { useEditorStore } from '@/lib/stores/editor';

export function useDraftsModal() {
  const router = useRouter();
  const { isDraftsModalOpen, setDraftsModalOpen } = useUIStore();
  const { setCode, setConversationHistory, setForkedFromId, setParentCCSignal } = useEditorStore();
  const [discardedIds, setDiscardedIds] = useState<Set<string>>(new Set());

  // load drafts when modal opens, filter out discarded ones
  const drafts = useMemo(() => {
    if (!isDraftsModalOpen) return [];
    return storage.getAllDrafts().filter(d => !discardedIds.has(d.id));
  }, [isDraftsModalOpen, discardedIds]);

  const handleContinue = useCallback((draft: Draft) => {
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
  }, [router, setCode, setConversationHistory, setForkedFromId, setParentCCSignal, setDraftsModalOpen]);

  const handleDiscard = useCallback((draftId: string) => {
    storage.deleteDraft(draftId);
    setDiscardedIds(prev => new Set([...prev, draftId]));
  }, []);

  return {
    isDraftsModalOpen,
    setDraftsModalOpen,
    drafts,
    handleContinue,
    handleDiscard,
  };
}
