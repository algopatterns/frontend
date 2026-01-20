'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useEditorStore } from '@/lib/stores/editor';
import { useAuthStore } from '@/lib/stores/auth';
import { useUIStore } from '@/lib/stores/ui';
import { useUpdateStrudel } from '@/lib/hooks/use-strudels';
import { storage, type GoodVersion } from '@/lib/utils/storage';

type SaveStatus = 'saved' | 'saving' | 'unsaved';

const AUTOSAVE_DEBOUNCE_MS = 10000;

// check if a strudel ID is a local strudel
function isLocalStrudelId(id: string | null): boolean {
  return !!id && id.startsWith('local_');
}

export function useAutosave() {
  const { isDirty, code, conversationHistory, currentStrudelId, markSaved, setCode } =
    useEditorStore();
  const { token } = useAuthStore();
  const { setSaveStrudelDialogOpen } = useUIStore();
  const updateStrudel = useUpdateStrudel();
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAuthenticated = !!token;
  const hasStrudel = !!currentStrudelId;
  const isLocalStrudel = isLocalStrudelId(currentStrudelId);

  // determine save status
  const getSaveStatus = useCallback((): SaveStatus => {
    if (isSaving) return 'saving';
    // local strudels: check dirty state
    if (isLocalStrudel) {
      return isDirty ? 'unsaved' : 'saved';
    }
    if (!isAuthenticated) return 'unsaved'; // no strudel saved yet for anon
    if (!hasStrudel) return 'unsaved'; // no strudel saved yet
    if (isDirty) return 'unsaved';
    return 'saved';
  }, [isSaving, isAuthenticated, hasStrudel, isDirty, isLocalStrudel]);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>(getSaveStatus);

  // update save status when dependencies change
  useEffect(() => {
    setSaveStatus(getSaveStatus());
  }, [getSaveStatus]);

  // set initial good version when loading a strudel (if none exists)
  useEffect(() => {
    if (!currentStrudelId || !code) return;

    const existingGoodVersion = storage.getGoodVersion(currentStrudelId);
    if (!existingGoodVersion) {
      // first time loading this strudel - set current code as good version
      storage.setGoodVersion(currentStrudelId, code);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStrudelId]); // only on strudel change, not code change

  // Autosave for authenticated users with an existing cloud strudel
  useEffect(() => {
    if (!isAuthenticated || !hasStrudel || !isDirty || isLocalStrudel) {
      return;
    }

    // clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // debounce the autosave
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await updateStrudel.mutateAsync({
          id: currentStrudelId,
          data: {
            code,
            conversation_history: conversationHistory.map(h => ({
              role: h.role as 'user' | 'assistant',
              content: h.content,
              is_actionable: h.is_actionable,
              is_code_response: h.is_code_response,
              clarifying_questions: h.clarifying_questions,
              strudel_references: h.strudel_references,
              doc_references: h.doc_references,
            })),
          },
        });
        markSaved();
      } catch (error) {
        console.error('Autosave failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    isAuthenticated,
    hasStrudel,
    isDirty,
    isLocalStrudel,
    currentStrudelId,
    code,
    conversationHistory,
    markSaved,
    updateStrudel,
  ]);

  // autosave for local strudels (anonymous users)
  useEffect(() => {
    if (!isLocalStrudel || !isDirty || !currentStrudelId) {
      return;
    }

    // clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // debounce the autosave
    saveTimeoutRef.current = setTimeout(() => {
      setIsSaving(true);
      try {
        const existingStrudel = storage.getLocalStrudel(currentStrudelId);
        if (existingStrudel) {
          storage.setLocalStrudel({
            ...existingStrudel,
            code,
            conversation_history: conversationHistory.map(h => ({
              role: h.role as 'user' | 'assistant',
              content: h.content,
              is_actionable: h.is_actionable,
              is_code_response: h.is_code_response,
              clarifying_questions: h.clarifying_questions,
              strudel_references: h.strudel_references,
              doc_references: h.doc_references,
            })),
            updated_at: new Date().toISOString(),
          });
          markSaved();
        }
      } catch (error) {
        console.error('Local autosave failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isLocalStrudel, isDirty, currentStrudelId, code, conversationHistory, markSaved]);

  // handle manual save click
  const handleSave = useCallback(async () => {
    // for local strudels, save immediately to localStorage
    if (isLocalStrudel && currentStrudelId) {
      // clear any pending autosave
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      setIsSaving(true);
      try {
        const existingStrudel = storage.getLocalStrudel(currentStrudelId);
        if (existingStrudel) {
          storage.setLocalStrudel({
            ...existingStrudel,
            code,
            conversation_history: conversationHistory.map(h => ({
              role: h.role as 'user' | 'assistant',
              content: h.content,
              is_actionable: h.is_actionable,
              is_code_response: h.is_code_response,
              clarifying_questions: h.clarifying_questions,
              strudel_references: h.strudel_references,
              doc_references: h.doc_references,
            })),
            updated_at: new Date().toISOString(),
          });
          // manual save = mark this as "good version" checkpoint
          storage.setGoodVersion(currentStrudelId, code);
          markSaved();
        }
      } catch (error) {
        console.error('Local save failed:', error);
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (!isAuthenticated) {
      // o strudel yet for anonymous users - open save dialog
      setSaveStrudelDialogOpen(true);
      return;
    }

    if (!hasStrudel) {
      // First time save - open dialog to enter title
      setSaveStrudelDialogOpen(true);
      return;
    }

    // Clear any pending autosave
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Save immediately
    setIsSaving(true);
    try {
      await updateStrudel.mutateAsync({
        id: currentStrudelId,
        data: {
          code,
          conversation_history: conversationHistory.map(h => ({
            role: h.role as 'user' | 'assistant',
            content: h.content,
            is_actionable: h.is_actionable,
            is_code_response: h.is_code_response,
            clarifying_questions: h.clarifying_questions,
            strudel_references: h.strudel_references,
            doc_references: h.doc_references,
          })),
        },
      });
      // manual save = mark this as "good version" checkpoint
      storage.setGoodVersion(currentStrudelId, code);
      markSaved();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [
    isAuthenticated,
    hasStrudel,
    isLocalStrudel,
    currentStrudelId,
    code,
    conversationHistory,
    setSaveStrudelDialogOpen,
    markSaved,
    updateStrudel,
  ]);

  // get good version for current strudel
  const getGoodVersion = useCallback((): GoodVersion | null => {
    if (!currentStrudelId) return null;
    return storage.getGoodVersion(currentStrudelId);
  }, [currentStrudelId]);

  // check if good version exists and differs from current code
  const hasRestorableVersion = useCallback((): boolean => {
    const goodVersion = getGoodVersion();
    return goodVersion !== null && goodVersion.code !== code;
  }, [getGoodVersion, code]);

  // restore code from good version
  const handleRestore = useCallback(() => {
    const goodVersion = getGoodVersion();
    if (goodVersion) {
      setCode(goodVersion.code);
    }
  }, [getGoodVersion, setCode]);

  return {
    saveStatus,
    handleSave,
    handleRestore,
    isAuthenticated,
    hasStrudel,
    getGoodVersion,
    hasRestorableVersion,
  };
}
