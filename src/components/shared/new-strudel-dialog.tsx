'use client';

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/lib/stores/ui';
import { useAuthStore } from '@/lib/stores/auth';
import { useEditorStore } from '@/lib/stores/editor';
import { wsClient } from '@/lib/websocket/client';
import { storage } from '@/lib/utils/storage';
import { EDITOR } from '@/lib/constants';

export function NewStrudelDialog() {
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
    wsClient.sendCodeUpdate(EDITOR.DEFAULT_CODE);

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
    wsClient.sendCodeUpdate(EDITOR.DEFAULT_CODE);

    router.replace('/', { scroll: false });
    setNewStrudelDialogOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <Dialog open={isNewStrudelDialogOpen} onOpenChange={setNewStrudelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start a New Strudel</DialogTitle>
            <DialogDescription>
              Sign in to save your strudels and access them later. As a guest, you can
              clear the editor to start fresh.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleClearEditor}>
              Clear Editor
            </Button>
            <Button onClick={handleLogin}>Sign In</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isNewStrudelDialogOpen} onOpenChange={setNewStrudelDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start a New Strudel</DialogTitle>
          <DialogDescription>
            {hasUnsavedChanges
              ? currentStrudelId
                ? "You have changes that haven't been autosaved yet. If you continue, these changes will be lost."
                : 'You have unsaved work that will be lost if you continue without saving first.'
              : 'Start fresh with a new strudel session.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          {hasUnsavedChanges ? (
            <>
              <Button variant="outline" onClick={handleStartNew}>
                Discard & Start New
              </Button>
              {!currentStrudelId && <Button onClick={handleSaveFirst}>Save First</Button>}
            </>
          ) : (
            <Button onClick={handleStartNew}>Start New</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
