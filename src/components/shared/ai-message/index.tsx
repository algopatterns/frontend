'use client';

import { Highlight, themes } from 'prism-react-renderer';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Check, Copy, ExternalLink } from 'lucide-react';
import type { AgentMessage } from '@/lib/api/strudels/types';
import Link from 'next/link';
import { useAIMessage, formatTime, STRUDEL_BASE_URL, STRUDEL_DOCS_URL } from './hooks';
import { getUserColor } from '../chat-message/hooks';
import { useWebSocketStore } from '@/lib/stores/websocket';

interface AIMessageProps {
  message: AgentMessage;
  onApplyCode?: (code: string) => void;
}

export function AIMessage({ message, onApplyCode }: AIMessageProps) {
  const {
    role,
    content,
    is_code_response,
    is_streaming,
    clarifying_questions,
    strudel_references,
    doc_references,
    created_at,
  } = message;

  // backwards compat: old messages stored clarifying questions separately
  const displayContent = content || (
    clarifying_questions?.length
      ? `I need a bit more info:\n${clarifying_questions.map(q => `- ${q}`).join('\n')}`
      : ''
  );

  const { copied, applied, handleCopy, handleApply } = useAIMessage(displayContent, onApplyCode);
  const myDisplayName = useWebSocketStore(state => state.myDisplayName);
  const formattedTime = formatTime(created_at);
  const userColor = getUserColor(myDisplayName || 'Anonymous');
  const assistantColor = getUserColor('Assistant');

  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="rounded-lg rounded-br-none bg-transparent border border-muted/40 p-3 w-fit max-w-full">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-medium text-[12px] ${userColor}`}>You</span>
            {formattedTime && (
              <span className="text-muted-foreground/60 text-[10px]">{formattedTime}</span>
            )}
          </div>
          <p className="text-foreground/70 text-[13px]">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg rounded-bl-none bg-muted/30 border border-muted/60 p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className={`font-medium text-[12px] ${assistantColor}`}>Assistant</span>
          {formattedTime && !is_streaming && (
            <span className="text-muted-foreground/60 text-[10px]">{formattedTime}</span>
          )}
        </div>

      {/* streaming indicator when no content yet */}
      {is_streaming && !displayContent && (
        <div className="flex items-center gap-1 text-muted-foreground/60 text-[13px]">
          <span className="animate-pulse">●</span>
          <span className="animate-pulse animation-delay-150">●</span>
          <span className="animate-pulse animation-delay-300">●</span>
        </div>
      )}

      {displayContent && (
        <>
          {is_code_response && !is_streaming ? (
            <>
              <Highlight
                theme={themes.duotoneDark}
                code={`/* generated */\n\n${displayContent}`}
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
            <div className="prose prose-sm prose-invert max-w-none text-foreground/70 text-[13px] [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_code]:bg-muted/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[12px] [&_pre]:bg-muted/30 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto [&_a]:text-teal-400/70 [&_a:hover]:text-teal-300 [&_strong]:text-foreground/80">
              <ReactMarkdown>{displayContent}</ReactMarkdown>
            </div>
          )}
        </>
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
