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
  const { pendingForkId, setPendingForkId, setLoginModalOpen, setSaveStrudelDialogOpen } =
    useUIStore();

  const { token } = useAuthStore();
  const { isDirty, code, currentStrudelId, currentDraftId } = useEditorStore();

  const isAuthenticated = !!token;
  const hasUnsavedChanges =
    isDirty || (!currentStrudelId && code !== EDITOR.DEFAULT_CODE);

  const isReforkingSameStrudel =
    pendingForkId && currentDraftId === `fork_${pendingForkId}`;

  // clear pending fork if user navigates away from explore page
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
    // keep pendingForkId so we can fork after saving
    setSaveStrudelDialogOpen(true);
  };

  // not authenticated - prompt to login or fork anyway
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

  // authenticated with unsaved changes
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

  // authenticated, no unsaved changes - just fork
  // this shouldn't normally be shown since we skip the dialog in this case
  return null;
}
