'use client';

import { useUIStore } from '@/lib/stores/ui';
import { useAuthStore } from '@/lib/stores/auth';

export function useLogoutConfirmDialog() {
  const { isLogoutDialogOpen, setLogoutDialogOpen } = useUIStore();
  const { logoutWithReconnect } = useAuthStore();

  const handleLogout = () => {
    logoutWithReconnect();
    setLogoutDialogOpen(false);
  };

  const handleCancel = () => {
    setLogoutDialogOpen(false);
  };

  return {
    isLogoutDialogOpen,
    setLogoutDialogOpen,
    handleLogout,
    handleCancel,
  };
}
