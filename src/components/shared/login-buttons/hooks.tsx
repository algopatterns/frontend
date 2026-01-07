'use client';

import { useAuth } from '@/lib/hooks/use-auth';

export function useLoginButtons() {
  const { login } = useAuth();
  return { login };
}
