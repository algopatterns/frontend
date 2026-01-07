'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useForkConfirmDialog } from './hooks';

export function ForkConfirmDialog() {
  const {
    pendingForkId,
    isAuthenticated,
    hasUnsavedChanges,
    isReforkingSameStrudel,
    currentStrudelId,
    handleClose,
    handleLogin,
    handleFork,
    handleSaveFirst,
  } = useForkConfirmDialog();

  if (!isAuthenticated) {
    const description = isReforkingSameStrudel
      ? 'Your changes to this fork will be overwritten with the original. Sign in to save first, or continue as a guest.'
      : hasUnsavedChanges
      ? 'Sign in to save your current work before forking, or continue as a guest. Your current unsaved work will be lost.'
      : 'Sign in to save your current work before forking, or continue as a guest.';

    return (
      <Dialog open={!!pendingForkId} onOpenChange={open => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isReforkingSameStrudel ? 'Re-fork Strudel' : 'Fork Strudel'}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleFork}>
              {isReforkingSameStrudel
                ? 'Overwrite & Re-fork'
                : hasUnsavedChanges
                ? 'Fork Anyway'
                : 'Fork'}
            </Button>
            <Button onClick={handleLogin}>Sign In</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (hasUnsavedChanges) {
    const title = isReforkingSameStrudel ? 'Re-fork Strudel' : 'Unsaved Changes';
    const description = isReforkingSameStrudel
      ? 'Your changes to this fork will be overwritten with the original. Save first to keep your work.'
      : currentStrudelId
      ? "You have changes that haven't been autosaved yet. If you fork now, these changes will be lost."
      : 'You have unsaved work that will be lost if you fork without saving first.';

    return (
      <Dialog open={!!pendingForkId} onOpenChange={open => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleFork}>
              {isReforkingSameStrudel ? 'Overwrite & Re-fork' : 'Discard & Fork'}
            </Button>
            {!currentStrudelId && <Button onClick={handleSaveFirst}>Save First</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
