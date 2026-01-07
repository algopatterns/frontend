'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUIStore } from '@/lib/stores/ui';
import { useEditorStore } from '@/lib/stores/editor';
import { EDITOR } from '@/lib/constants';

export function useOpenStrudelConfirmDialog() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    pendingOpenStrudelId,
    setPendingOpenStrudelId,
    setSaveStrudelDialogOpen,
  } = useUIStore();

  const { isDirty, code, currentStrudelId } = useEditorStore();

  const hasUnsavedChanges =
    isDirty || (!currentStrudelId && code !== EDITOR.DEFAULT_CODE);

  useEffect(() => {
    if (pendingOpenStrudelId && pathname !== '/') {
      setPendingOpenStrudelId(null);
    }
  }, [pathname, pendingOpenStrudelId, setPendingOpenStrudelId]);

  const handleClose = () => {
    setPendingOpenStrudelId(null);
  };

  const handleOpen = () => {
    if (pendingOpenStrudelId) {
      router.push(`/?id=${pendingOpenStrudelId}`);
    }
    setPendingOpenStrudelId(null);
  };

  const handleSaveFirst = () => {
    setSaveStrudelDialogOpen(true);
  };

  return {
    pendingOpenStrudelId,
    hasUnsavedChanges,
    currentStrudelId,
    handleClose,
    handleOpen,
    handleSaveFirst,
  };
}
