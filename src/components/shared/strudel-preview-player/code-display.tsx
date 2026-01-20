'use client';

import { useMemo } from 'react';
import { highlightStrudelCode } from '@/lib/utils/syntax-highlight';

interface CodeDisplayProps {
  code: string;
}

export function CodeDisplay({ code }: CodeDisplayProps) {
  const highlighted = useMemo(() => highlightStrudelCode(code), [code]);

  return (
    <pre className="font-mono text-[14px] leading-[1.4] whitespace-pre-wrap break-words" style={{ fontFamily: 'var(--font-geist-mono), monospace', color: '#fff' }}>
      {highlighted}
    </pre>
  );
}
