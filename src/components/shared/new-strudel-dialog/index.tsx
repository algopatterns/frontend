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
import { useNewStrudelDialog } from './hooks';

export function NewStrudelDialog() {
  const {
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
  } = useNewStrudelDialog();

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
