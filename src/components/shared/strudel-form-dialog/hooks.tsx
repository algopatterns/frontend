'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateStrudel, useUpdateStrudel } from '@/lib/hooks/use-strudels';
import { useEditorStore } from '@/lib/stores/editor';
import { useUIStore } from '@/lib/stores/ui';
import { storage } from '@/lib/utils/storage';
import type { Strudel, CCSignal } from '@/lib/api/strudels/types';
import { SIGNAL_RESTRICTIVENESS } from '@/lib/api/strudels/types';

export function useStrudelForm(
  strudel: Strudel | null | undefined,
  mode: 'create' | 'edit',
  onClose: () => void
) {
  const router = useRouter();
  const createStrudel = useCreateStrudel();
  const updateStrudel = useUpdateStrudel();

  const {
    code,
    conversationHistory,
    currentDraftId,
    forkedFromId,
    parentCCSignal,
    setCurrentStrudel,
    setCurrentDraftId,
    markSaved,
  } = useEditorStore();

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

  const [ccSignal, setCCSignal] = useState<CCSignal | null>(
    mode === 'edit' && strudel ? strudel.cc_signal ?? null : null
  );

  const [error, setError] = useState('');

  const isCreate = mode === 'create';
  const isPending = isCreate ? createStrudel.isPending : updateStrudel.isPending;

  const getEffectiveSignal = (): CCSignal | null => {
    if (!isPublic) return null;
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
      cc_signal: getEffectiveSignal(),
    };

    try {
      if (isCreate) {
        const newStrudel = await createStrudel.mutateAsync({
          ...formData,
          code,
          forked_from: forkedFromId || undefined,
          conversation_history: conversationHistory.map(h => ({
            role: h.role as 'user' | 'assistant',
            content: h.content,
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
    ccSignal,
    setCCSignal,
    error,
    setError,
    isCreate,
    isPending,
    parentCCSignal,
    handleSave,
  };
}
