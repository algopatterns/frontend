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
import { useLogoutConfirmDialog } from './hooks';

export function LogoutConfirmDialog() {
  const { isLogoutDialogOpen, setLogoutDialogOpen, handleLogout, handleCancel } =
    useLogoutConfirmDialog();

  return (
    <AlertDialog open={isLogoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Log out?</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogBody>
          Your current session code will not be saved. You&apos;ll start fresh as a guest when
          you reconnect.
        </AlertDialogBody>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            className="bg-red-500 text-destructive-foreground hover:bg-red-600"
          >
            Log out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
