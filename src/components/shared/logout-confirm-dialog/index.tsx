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
import { useLogoutConfirmDialog } from './hooks';

export function LogoutConfirmDialog() {
  const { isLogoutDialogOpen, setLogoutDialogOpen, handleLogout, handleCancel } =
    useLogoutConfirmDialog();

  return (
    <Dialog open={isLogoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log out?</DialogTitle>
          <DialogDescription>
            Your current session code will not be saved. You&apos;ll start fresh as a guest when
            you reconnect.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            Log out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
