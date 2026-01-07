'use client';

import { useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/stores/ui';
import { useAuthStore } from '@/lib/stores/auth';
import { useEditorStore } from '@/lib/stores/editor';
import { wsClient } from '@/lib/websocket/client';
import { storage } from '@/lib/utils/storage';
import { EDITOR } from '@/lib/constants';

export function useNewStrudelDialog() {
  const router = useRouter();
  const {
    isNewStrudelDialogOpen,
    setNewStrudelDialogOpen,
    setLoginModalOpen,
    setSaveStrudelDialogOpen,
  } = useUIStore();

  const { token } = useAuthStore();
  const { isDirty, code, currentStrudelId, setCode, setCurrentStrudel, setCurrentDraftId, clearHistory } =
    useEditorStore();

  const isAuthenticated = !!token;
  const hasUnsavedChanges =
    isDirty || (!currentStrudelId && code !== EDITOR.DEFAULT_CODE);

  const handleClose = () => {
    setNewStrudelDialogOpen(false);
  };

  const handleLogin = () => {
    setNewStrudelDialogOpen(false);
    setLoginModalOpen(true);
  };

  const handleClearEditor = () => {
    const newDraftId = storage.generateDraftId();

    setCode(EDITOR.DEFAULT_CODE, true);
    setCurrentStrudel(null, null);
    setCurrentDraftId(newDraftId);
    clearHistory();

    wsClient.skipCodeRestoration = true;
    wsClient.sendCodeUpdate(EDITOR.DEFAULT_CODE, undefined, undefined, 'loaded_strudel');

    setNewStrudelDialogOpen(false);
  };

  const handleSaveFirst = () => {
    setNewStrudelDialogOpen(false);
    setSaveStrudelDialogOpen(true);
  };

  const handleStartNew = () => {
    const newDraftId = storage.generateDraftId();

    setCode(EDITOR.DEFAULT_CODE, true);
    setCurrentStrudel(null, null);
    setCurrentDraftId(newDraftId);
    clearHistory();

    wsClient.skipCodeRestoration = true;
    wsClient.sendCodeUpdate(EDITOR.DEFAULT_CODE, undefined, undefined, 'loaded_strudel');

    router.replace('/', { scroll: false });
    setNewStrudelDialogOpen(false);
  };

  return {
    isNewStrudelDialogOpen,
    setNewStrudelDialogOpen,
    isAuthenticated,
    hasUnsavedChanges,
    currentStrudelId,
    handleClose,
    handleLogin,
    handleClearEditor,
    handleSaveFirst,
    handleStartNew,
  };
}
