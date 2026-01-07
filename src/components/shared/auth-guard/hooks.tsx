'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { storage } from '@/lib/utils/storage';

export function useAuthGuard() {
  const { token, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !token) {
      storage.setRedirectUrl(window.location.pathname);
      router.push('/login');
    }
  }, [isLoading, token, router]);

  return { token, isLoading };
}
