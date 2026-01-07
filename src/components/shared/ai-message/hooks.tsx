'use client';

import { useState } from 'react';

export const STRUDEL_BASE_URL = 'https://strudel.cc';
export const STRUDEL_DOCS_URL = 'https://strudel.cc/learn';

export function useAIMessage(content: string | undefined, onApplyCode?: (code: string) => void) {
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleCopy = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (!content || !onApplyCode) return;
    onApplyCode(content);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  return {
    copied,
    applied,
    handleCopy,
    handleApply,
  };
}

export function formatTime(dateStr: string | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}
