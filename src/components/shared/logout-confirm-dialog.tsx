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
import { useUIStore } from '@/lib/stores/ui';
import { useAuthStore } from '@/lib/stores/auth';

export function LogoutConfirmDialog() {
  const { isLogoutDialogOpen, setLogoutDialogOpen } = useUIStore();
  const { logoutWithReconnect } = useAuthStore();

  const handleLogout = () => {
    logoutWithReconnect();
    setLogoutDialogOpen(false);
  };

  const handleCancel = () => {
    setLogoutDialogOpen(false);
  };

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
        <DialogFooter className="gap-2 sm:gap-0">
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
