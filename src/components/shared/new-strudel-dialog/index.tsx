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
      <AlertDialog open={isNewStrudelDialogOpen} onOpenChange={setNewStrudelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a New Strudel</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogBody>
            Sign in to save your strudels and access them later. As a guest, you can
            clear the editor to start fresh.
          </AlertDialogBody>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
            <AlertDialogCancel onClick={handleClearEditor}>Clear Editor</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogin}>Sign In</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={isNewStrudelDialogOpen} onOpenChange={setNewStrudelDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Start a New Strudel</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogBody>
          {hasUnsavedChanges
            ? currentStrudelId
              ? "You have changes that haven't been autosaved yet. Your current work will be saved as a draft."
              : 'Your current work will be saved as a draft so you can continue later.'
            : 'Start fresh with a new strudel session.'}
        </AlertDialogBody>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
          {hasUnsavedChanges ? (
            <>
              <AlertDialogCancel onClick={handleStartNew}>Start New</AlertDialogCancel>
              {!currentStrudelId && <AlertDialogAction onClick={handleSaveFirst}>Save First</AlertDialogAction>}
            </>
          ) : (
            <AlertDialogAction onClick={handleStartNew}>Start New</AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
