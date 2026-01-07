'use client';

import { useUIStore } from '@/lib/stores/ui';

export function useSaveStrudelDialog() {
  const { isSaveStrudelDialogOpen, setSaveStrudelDialogOpen } = useUIStore();
  return { isSaveStrudelDialogOpen, setSaveStrudelDialogOpen };
}
