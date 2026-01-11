'use client';

import { useState, useCallback } from 'react';
import { useStrudelStats, usePublicStrudel } from '@/lib/hooks/use-strudels';

export function useStrudelStatsDialog(strudelId: string | null, open: boolean) {
  const { data, isLoading } = useStrudelStats(open ? strudelId : null);
  const [previewStrudelId, setPreviewStrudelId] = useState<string | null>(null);

  const { data: previewStrudel } = usePublicStrudel(previewStrudelId || '');

  const handleOpenPreview = useCallback((id: string) => {
    setPreviewStrudelId(id);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewStrudelId(null);
  }, []);

  return {
    data,
    isLoading,
    previewStrudel: previewStrudel || null,
    isPreviewOpen: !!previewStrudelId,
    handleOpenPreview,
    handleClosePreview,
  };
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
