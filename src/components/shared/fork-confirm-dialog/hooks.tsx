'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUIStore } from '@/lib/stores/ui';
import { useAuthStore } from '@/lib/stores/auth';
import { useEditorStore } from '@/lib/stores/editor';
import { EDITOR } from '@/lib/constants';

export function useForkConfirmDialog() {
  const router = useRouter();
  const pathname = usePathname();
  const { pendingForkId, setPendingForkId, setLoginModalOpen, setSaveStrudelDialogOpen } =
    useUIStore();

  const { token } = useAuthStore();
  const { isDirty, code, currentStrudelId, currentDraftId } = useEditorStore();

  const isAuthenticated = !!token;
  const hasUnsavedChanges =
    isDirty || (!currentStrudelId && code !== EDITOR.DEFAULT_CODE);

  const isReforkingSameStrudel =
    pendingForkId && currentDraftId === `fork_${pendingForkId}`;

  useEffect(() => {
    if (pendingForkId && pathname !== '/explore') {
      setPendingForkId(null);
    }
  }, [pathname, pendingForkId, setPendingForkId]);

  const handleClose = () => {
    setPendingForkId(null);
  };

  const handleLogin = () => {
    setPendingForkId(null);
    setLoginModalOpen(true);
  };

  const handleFork = () => {
    if (pendingForkId) {
      router.push(`/?fork=${pendingForkId}`);
    }
    setPendingForkId(null);
  };

  const handleSaveFirst = () => {
    setSaveStrudelDialogOpen(true);
  };

  return {
    pendingForkId,
    isAuthenticated,
    hasUnsavedChanges,
    isReforkingSameStrudel,
    currentStrudelId,
    handleClose,
    handleLogin,
    handleFork,
    handleSaveFirst,
  };
}
