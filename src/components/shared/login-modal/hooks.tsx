'use client';

import { useUIStore } from '@/lib/stores/ui';

export function useLoginModal() {
  const { isLoginModalOpen, setLoginModalOpen } = useUIStore();
  return { isLoginModalOpen, setLoginModalOpen };
}
