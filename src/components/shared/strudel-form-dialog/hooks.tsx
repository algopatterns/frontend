'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateStrudel, useUpdateStrudel } from '@/lib/hooks/use-strudels';
import { useEditorStore } from '@/lib/stores/editor';
import { useUIStore } from '@/lib/stores/ui';
import { useAuthStore } from '@/lib/stores/auth';
import { storage } from '@/lib/utils/storage';
import type { Strudel, CCSignal, CCLicense } from '@/lib/api/strudels/types';
import { SIGNAL_RESTRICTIVENESS, inferSignalFromLicense } from '@/lib/api/strudels/types';

export function useStrudelForm(
  strudel: Strudel | null | undefined,
  mode: 'create' | 'edit',
  onClose: () => void
) {
  const router = useRouter();
  const createStrudel = useCreateStrudel();
  const updateStrudel = useUpdateStrudel();
  const token = useAuthStore(state => state.token);
  const isAuthenticated = !!token;
  const [localSaving, setLocalSaving] = useState(false);

  const {
    code,
    conversationHistory: editorConversationHistory,
    currentDraftId,
    forkedFromId,
    parentCCSignal,
    setCurrentStrudel,
    setCurrentDraftId,
    markSaved,
  } = useEditorStore();

  // check if AI was used (any message has is_code_response)
  // in edit mode, check the strudel's saved history; in create mode, check current editor session
  const conversationHistory = mode === 'edit' && strudel?.conversation_history?.length
    ? strudel.conversation_history
    : editorConversationHistory;
  const hasAIAssistance = conversationHistory.some(msg => msg.is_code_response);

  const {
    pendingForkId,
    setPendingForkId,
    pendingOpenStrudelId,
    setPendingOpenStrudelId,
  } = useUIStore();

  const [title, setTitle] = useState(mode === 'edit' && strudel ? strudel.title : '');
  const [description, setDescription] = useState(
    mode === 'edit' && strudel ? strudel.description || '' : ''
  );

  const [tags, setTags] = useState(
    mode === 'edit' && strudel ? strudel.tags?.join(', ') || '' : ''
  );

  const [categories, setCategories] = useState(
    mode === 'edit' && strudel ? strudel.categories?.join(', ') || '' : ''
  );

  const [isPublic, setIsPublic] = useState(
    mode === 'edit' && strudel ? strudel.is_public : false
  );

  const [license, setLicense] = useState<CCLicense | null>(
    mode === 'edit' && strudel ? strudel.license ?? null : null
  );

  const [ccSignal, setCCSignal] = useState<CCSignal | null>(
    mode === 'edit' && strudel ? strudel.cc_signal ?? null : null
  );

  // track if user has manually overridden the signal
  const [signalOverridden, setSignalOverridden] = useState(false);

  const [error, setError] = useState('');

  // handle license change with signal inference
  const handleLicenseChange = (newLicense: CCLicense | null) => {
    setLicense(newLicense);

    // only auto-infer if user hasn't manually overridden
    if (!signalOverridden) {
      let inferredSignal = inferSignalFromLicense(newLicense);
      // if AI was used, don't allow no-ai to be inferred
      if (hasAIAssistance && inferredSignal === 'no-ai') {
        inferredSignal = 'cc-op'; // default to cc-op (open) when AI was used
      }
      setCCSignal(inferredSignal);
    }
  };

  // handle manual signal change
  const handleSignalChange = (newSignal: CCSignal | null) => {
    setCCSignal(newSignal);
    setSignalOverridden(true);
  };

  const isCreate = mode === 'create';
  const isPending = localSaving || (isCreate ? createStrudel.isPending : updateStrudel.isPending);

  const getEffectiveSignal = (): CCSignal | null => {
    if (!ccSignal) return null;

    if (parentCCSignal) {
      const parentLevel = SIGNAL_RESTRICTIVENESS[parentCCSignal];
      const childLevel = SIGNAL_RESTRICTIVENESS[ccSignal];

      if (childLevel < parentLevel) {
        return parentCCSignal;
      }
    }

    return ccSignal;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    const formData = {
      title: title.trim(),
      description: description.trim() || undefined,
      tags: tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
      categories: categories
        .split(',')
        .map(c => c.trim())
        .filter(Boolean),
      is_public: isPublic,
      license,
      cc_signal: getEffectiveSignal(),
    };

    try {
      // for anonymous users, save to localStorage
      if (!isAuthenticated) {
        setLocalSaving(true);
        const now = new Date().toISOString();
        const localStrudel = {
          id: storage.generateLocalStrudelId(),
          title: formData.title,
          code,
          description: formData.description || '',
          tags: formData.tags,
          is_public: false,
          license: null,
          cc_signal: null,
          forked_from: forkedFromId || undefined,
          parent_cc_signal: parentCCSignal,
          conversation_history: conversationHistory.map(h => ({
            role: h.role as 'user' | 'assistant',
            content: h.content,
            is_actionable: h.is_actionable,
            is_code_response: h.is_code_response,
            clarifying_questions: h.clarifying_questions,
            strudel_references: h.strudel_references,
            doc_references: h.doc_references,
          })),
          created_at: now,
          updated_at: now,
        };

        storage.setLocalStrudel(localStrudel);

        // clean up draft
        if (currentDraftId) {
          storage.deleteDraft(currentDraftId);
          setCurrentDraftId(null);
        }

        // set as current strudel
        setCurrentStrudel(localStrudel.id, localStrudel.title);
        markSaved();
        setLocalSaving(false);

        // handle navigation
        if (pendingForkId) {
          setPendingForkId(null);
          router.push(`/?fork=${pendingForkId}`);
        } else if (pendingOpenStrudelId) {
          setPendingOpenStrudelId(null);
          router.push(`/?id=${pendingOpenStrudelId}`);
        } else {
          router.replace(`/?id=${localStrudel.id}`, { scroll: false });
        }

        onClose();
        return;
      }

      // for authenticated users, use API
      if (isCreate) {
        const newStrudel = await createStrudel.mutateAsync({
          ...formData,
          code,
          forked_from: forkedFromId || undefined,
          conversation_history: conversationHistory.map(h => ({
            role: h.role as 'user' | 'assistant',
            content: h.content,
            is_actionable: h.is_actionable,
            is_code_response: h.is_code_response,
            clarifying_questions: h.clarifying_questions,
            strudel_references: h.strudel_references,
            doc_references: h.doc_references,
          })),
        });

        if (currentDraftId) {
          storage.deleteDraft(currentDraftId);
          setCurrentDraftId(null);
        }

        setCurrentStrudel(newStrudel.id, newStrudel.title);
        markSaved();

        if (pendingForkId) {
          setPendingForkId(null);
          router.push(`/?fork=${pendingForkId}`);
        } else if (pendingOpenStrudelId) {
          setPendingOpenStrudelId(null);
          router.push(`/?id=${pendingOpenStrudelId}`);
        } else {
          router.replace(`/?id=${newStrudel.id}`, { scroll: false });
        }
      } else if (strudel) {
        await updateStrudel.mutateAsync({
          id: strudel.id,
          data: formData,
        });
      }

      onClose();
    } catch (err) {
      setLocalSaving(false);
      setError(`Failed to ${isCreate ? 'save' : 'update'} strudel. Please try again.`);
      console.error(`failed to ${isCreate ? 'save' : 'update'} strudel:`, err);
    }
  };

  return {
    title,
    setTitle,
    description,
    setDescription,
    tags,
    setTags,
    categories,
    setCategories,
    isPublic,
    setIsPublic,
    license,
    handleLicenseChange,
    ccSignal,
    handleSignalChange,
    signalOverridden,
    error,
    setError,
    isCreate,
    isPending,
    parentCCSignal,
    hasAIAssistance,
    isAuthenticated,
    handleSave,
  };
}
