'use client';

import { Highlight, themes } from 'prism-react-renderer';
import { Button } from '@/components/ui/button';
import { Check, Copy, ExternalLink } from 'lucide-react';
import type { AgentMessage } from '@/lib/api/strudels/types';
import Link from 'next/link';
import { useAIMessage, formatTime, STRUDEL_BASE_URL, STRUDEL_DOCS_URL } from './hooks';

interface AIMessageProps {
  message: AgentMessage;
  onApplyCode?: (code: string) => void;
}

export function AIMessage({ message, onApplyCode }: AIMessageProps) {
  const {
    role,
    content,
    is_code_response,
    clarifying_questions,
    strudel_references,
    doc_references,
    created_at,
  } = message;

  const { copied, applied, handleCopy, handleApply } = useAIMessage(content, onApplyCode);
  const formattedTime = formatTime(created_at);

  if (role === 'user') {
    return (
      <div className="rounded-sm bg-black/30 p-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-rose-300/70 text-[12px]">You</span>
          {formattedTime && (
            <span className="text-muted-foreground/60 text-[10px]">{formattedTime}</span>
          )}
        </div>
        <p className="text-foreground/70 text-[13px]">{content}</p>
      </div>
    );
  }

  return (
    <div className="rounded-sm bg-black/30 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-medium text-teal-300/70 text-[12px]">Assistant</span>
        {formattedTime && (
          <span className="text-muted-foreground/60 text-[10px]">{formattedTime}</span>
        )}
      </div>

      {content && (
        <>
          {is_code_response ? (
            <>
              <Highlight
                theme={themes.duotoneDark}
                code={`/* generated */\n\n${content}`}
                language="javascript">
                {({ style, tokens, getLineProps, getTokenProps }) => (
                  <pre
                    className="whitespace-pre-wrap font-mono overflow-x-auto grayscale-100 text-[13px]"
                    style={{
                      ...style,
                      background: 'transparent',
                      backgroundColor: 'transparent',
                    }}>
                    {tokens.map((line, i) => (
                      <div key={i} {...getLineProps({ line })}>
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-24 text-xs text-foreground/70 hover:text-rose-300/50 focus:text-emerald-300/50 bg-accent/30"
                  onClick={handleApply}>
                  {applied ? (
                    <>
                      <Check className="h-3 w-3" />
                      Applied
                    </>
                  ) : (
                    'Apply'
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-24 text-xs text-foreground/70 hover:text-rose-300/50 focus:text-emerald-300/50"
                  onClick={handleCopy}>
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <p className="whitespace-pre-wrap text-foreground/70 text-[13px]">
              {content}
            </p>
          )}
        </>
      )}

      {clarifying_questions && clarifying_questions.length > 0 && (
        <div className="space-y-1 mt-1">
          <p className="text-muted-foreground text-sm">I need more information:</p>
          <ul className="list-disc list-inside space-y-1 text-foreground/70 text-xs">
            {clarifying_questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {(strudel_references?.length || doc_references?.length) && (
        <div className="mt-3 pt-2 border-t border-muted/30">
          <p className="text-muted-foreground text-[12px] mb-1">Referenced:</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {strudel_references?.map(ref => (
              <Link
                key={ref.id}
                href={ref.url}
                className="text-[11px] text-teal-400/70 hover:text-teal-300 hover:underline inline-flex items-center gap-1">
                {ref.title}{' '}
                <span className="text-muted-foreground">by {ref.author_name}</span>
              </Link>
            ))}

            {doc_references?.map((ref, i) => (
              <a
                key={i}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-orange-400/70 hover:text-orange-300 hover:underline inline-flex items-center gap-1"
                href={
                  `${STRUDEL_BASE_URL}/${ref.page_name
                    .toLowerCase()
                    .replace(/ /g, '-')
                    .replace('.mdx', '')}` || STRUDEL_DOCS_URL
                }>
                {ref.page_name}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
