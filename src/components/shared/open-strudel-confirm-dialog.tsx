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
import { useEditorStore } from '@/lib/stores/editor';
import { EDITOR } from '@/lib/constants';

export function OpenStrudelConfirmDialog() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    pendingOpenStrudelId,
    setPendingOpenStrudelId,
    setSaveStrudelDialogOpen,
  } = useUIStore();

  const { isDirty, code, currentStrudelId } = useEditorStore();

  const hasUnsavedChanges =
    isDirty || (!currentStrudelId && code !== EDITOR.DEFAULT_CODE);

  // Clear pending open if user navigates away from dashboard
  useEffect(() => {
    if (pendingOpenStrudelId && pathname !== '/dashboard') {
      setPendingOpenStrudelId(null);
    }
  }, [pathname, pendingOpenStrudelId, setPendingOpenStrudelId]);

  const handleClose = () => {
    setPendingOpenStrudelId(null);
  };

  const handleOpen = () => {
    if (pendingOpenStrudelId) {
      router.push(`/?id=${pendingOpenStrudelId}`);
    }
    setPendingOpenStrudelId(null);
  };

  const handleSaveFirst = () => {
    // Keep pendingOpenStrudelId so we can open after saving
    setSaveStrudelDialogOpen(true);
  };

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
