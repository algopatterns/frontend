'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Strudel } from '@/lib/api/strudels/types';
import { useEditorStore } from '@/lib/stores/editor';
import { useUIStore } from '@/lib/stores/ui';
import { EDITOR } from '@/lib/constants';

export function useStrudelPreviewModal(
  strudel: Strudel | null,
  onOpenChange: (open: boolean) => void
) {
  const router = useRouter();
  const { isDirty, code, currentStrudelId } = useEditorStore();
  const { setPendingForkId } = useUIStore();
  const [error, setError] = useState<string | null>(null);

  const handleErrorChange = useCallback((err: string | null) => {
    setError(err);
  }, []);

  const handleFork = useCallback(() => {
    const hasUnsavedChanges = isDirty || (!currentStrudelId && code !== EDITOR.DEFAULT_CODE);

    onOpenChange(false);

    if (hasUnsavedChanges) {
      setPendingForkId(strudel?.id ?? '');
    } else {
      router.push(`/?fork=${strudel?.id}`);
    }
  }, [isDirty, currentStrudelId, code, onOpenChange, setPendingForkId, strudel?.id, router]);

  return {
    error,
    handleErrorChange,
    handleFork,
  };
}
