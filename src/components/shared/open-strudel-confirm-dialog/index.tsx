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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-3">
          <DialogTitle>Unsaved Changes</DialogTitle>
          <DialogDescription>
            {currentStrudelId
              ? "You have changes that haven't been autosaved yet. Your current work will be saved as a draft."
              : 'Your current work will be saved as a draft so you can continue later.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleOpen}>
            Save Draft & Open
          </Button>
          {!currentStrudelId && (
            <Button onClick={handleSaveFirst}>Save as Strudel</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
