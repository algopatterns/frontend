'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
import { EDITOR } from '@/lib/constants';

export function ForkConfirmDialog() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    pendingForkId,
    setPendingForkId,
    setLoginModalOpen,
    setSaveStrudelDialogOpen,
  } = useUIStore();

  const { token } = useAuthStore();
  const { isDirty, code, currentStrudelId } = useEditorStore();

  const isAuthenticated = !!token;
  const hasUnsavedChanges =
    isDirty || (!currentStrudelId && code !== EDITOR.DEFAULT_CODE);

  // Clear pending fork if user navigates away from explore page
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
    // Keep pendingForkId so we can fork after saving
    setSaveStrudelDialogOpen(true);
  };

  // Not authenticated - prompt to login or fork anyway
  if (!isAuthenticated) {
    return (
      <Dialog open={!!pendingForkId} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fork Strudel</DialogTitle>
            <DialogDescription>
              Sign in to save your current work before forking, or continue as a guest.
              {hasUnsavedChanges && ' Your current unsaved work will be lost.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleFork}>
              {hasUnsavedChanges ? 'Fork Anyway' : 'Fork'}
            </Button>
            <Button onClick={handleLogin}>Sign In</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Authenticated with unsaved changes
  if (hasUnsavedChanges) {
    return (
      <Dialog open={!!pendingForkId} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              {currentStrudelId
                ? "You have changes that haven't been autosaved yet. If you fork now, these changes will be lost."
                : 'You have unsaved work that will be lost if you fork without saving first.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleFork}>
              Discard & Fork
            </Button>
            {!currentStrudelId && (
              <Button onClick={handleSaveFirst}>Save First</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Authenticated, no unsaved changes - just fork
  // This shouldn't normally be shown since we skip the dialog in this case
  return null;
}
