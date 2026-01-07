'use client';

import { useStrudelStats } from '@/lib/hooks/use-strudels';

export function useStrudelStatsDialog(strudelId: string | null, open: boolean) {
  const { data, isLoading } = useStrudelStats(open ? strudelId : null);
  return { data, isLoading };
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
