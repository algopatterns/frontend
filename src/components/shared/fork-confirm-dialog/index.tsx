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
      ? 'Sign in to save your current work before forking, or continue as a guest. Your work will be saved as a draft.'
      : 'Sign in to save your current work before forking, or continue as a guest.';

    return (
      <AlertDialog open={!!pendingForkId} onOpenChange={open => !open && handleClose()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isReforkingSameStrudel ? 'Re-fork Strudel' : 'Fork Strudel'}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogBody>{description}</AlertDialogBody>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
            <AlertDialogCancel onClick={handleFork}>
              {isReforkingSameStrudel
                ? 'Overwrite & Re-fork'
                : hasUnsavedChanges
                ? 'Save Draft & Fork'
                : 'Fork'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleLogin}>Sign In</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (hasUnsavedChanges) {
    const title = isReforkingSameStrudel ? 'Re-fork Strudel' : 'Unsaved Changes';
    const description = isReforkingSameStrudel
      ? 'Your changes to this fork will be overwritten with the original. Save first to keep your work.'
      : currentStrudelId
      ? "You have changes that haven't been autosaved yet. Your current work will be saved as a draft."
      : 'Your current work will be saved as a draft so you can continue later.';

    return (
      <AlertDialog open={!!pendingForkId} onOpenChange={open => !open && handleClose()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogBody>{description}</AlertDialogBody>
          <AlertDialogFooter>
            <AlertDialogCancel className='border-none hover:bg-transparent hover:opacity-80' onClick={handleClose}>Cancel</AlertDialogCancel>
            <AlertDialogCancel onClick={handleFork}>
              {isReforkingSameStrudel ? 'Overwrite' : 'Fork Anyways'}
            </AlertDialogCancel>
            {!currentStrudelId && <AlertDialogAction onClick={handleSaveFirst}>Save First</AlertDialogAction>}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return null;
}
