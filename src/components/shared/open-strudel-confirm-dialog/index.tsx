'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
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
    <AlertDialog open={!!pendingOpenStrudelId} onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogBody>
          {currentStrudelId
            ? "You have changes that haven't been autosaved yet. Your current work will be saved as a draft."
            : 'Your current work will be saved as a draft so you can continue later.'}
        </AlertDialogBody>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
          <AlertDialogCancel onClick={handleOpen}>Save Draft & Open</AlertDialogCancel>
          {!currentStrudelId && (
            <AlertDialogAction onClick={handleSaveFirst}>Save as Strudel</AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
