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
import { useOpenStrudelConfirmDialog } from './hooks';

export function OpenStrudelConfirmDialog() {
  const {
    pendingOpenStrudelId,
    hasUnsavedChanges,
    currentStrudelId,
    handleClose,
    handleOpen,
    handleSaveFirst,
  } = useOpenStrudelConfirmDialog();

  if (!pendingOpenStrudelId || !hasUnsavedChanges) {
    return null;
  }

  return (
    <Dialog open={!!pendingOpenStrudelId} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Unsaved Changes</DialogTitle>
          <DialogDescription>
            {currentStrudelId
              ? "You have changes that haven't been autosaved yet. If you open another strudel, these changes will be lost."
              : 'You have unsaved work that will be lost if you continue without saving first.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleOpen}>
            Discard & Open
          </Button>
          {!currentStrudelId && (
            <Button onClick={handleSaveFirst}>Save First</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
