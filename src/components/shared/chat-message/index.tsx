'use client';

import { cn } from '@/lib/utils';
import { Highlight, themes } from 'prism-react-renderer';
import type { ChatMessage as ChatMessageType } from '@/lib/websocket/types';
import { getUserColor, formatTimestamp } from './hooks';

interface ChatMessageProps {
  message: ChatMessageType;
  compact?: boolean;
}

export function ChatMessage({ message, compact = false }: ChatMessageProps) {
  const { type, content, displayName, clarifyingQuestions, timestamp, isCodeResponse } =
    message;

  const formattedTime = formatTimestamp(timestamp);

  if (type === 'system') {
    return (
      <div
        data-message-type="system"
        className={cn(
          'text-center text-muted-foreground',
          compact ? 'text-[10px] py-0.5' : 'text-xs py-1 mb-5'
        )}>
        {content}
      </div>
    );
  }

  if (type === 'assistant') {
    return (
      <div className={cn('rounded-sm', compact ? 'bg-black/30 p-3' : 'mb-4')}>
        <div className={cn('flex items-center gap-2', compact ? 'mb-2' : 'mb-1.5')}>
          <span
            className={cn(
              'font-medium',
              compact ? 'text-teal-300/70 text-[12px]' : 'text-cyan-400 text-xs'
            )}>
            Assistant
          </span>
          <span
            className={cn('text-muted-foreground', compact ? 'text-[10px]' : 'text-xs')}>
            {formattedTime}
          </span>
        </div>

        {content && (
          <>
            {isCodeResponse ? (
              <Highlight
                theme={themes.duotoneDark}
                code={`/* generated */\n\n${content}`}
                language="javascript">
                {({ style, tokens, getLineProps, getTokenProps }) => (
                  <pre
                    className={cn(
                      'whitespace-pre-wrap font-mono overflow-x-auto grayscale-100',
                      compact ? 'text-[13px]' : 'text-sm'
                    )}
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
            ) : (
              <p
                className={cn(
                  'whitespace-pre-wrap text-foreground/70',
                  compact ? 'text-[13px]' : 'text-sm'
                )}>
                {content}
              </p>
            )}
          </>
        )}

        {clarifyingQuestions && clarifyingQuestions.length > 0 && (
          <div className={cn('space-y-1', compact ? 'mt-1' : 'mt-2')}>
            <p
              className={cn(
                'text-muted-foreground',
                compact ? 'text-[10px]' : 'text-xs'
              )}>
              I need more information:
            </p>
            <ul
              className={cn(
                'list-disc list-inside space-y-1 text-foreground/70',
                compact ? 'text-xs' : 'text-sm'
              )}>
              {clarifyingQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('rounded-sm', compact ? 'bg-black/30 p-3' : 'mb-4')}>
      <div className={cn('flex items-center gap-2', compact ? 'mb-1' : 'mb-1.5')}>
        <span
          className={cn(
            'font-medium',
            compact
              ? 'text-rose-300/70 text-[12px]'
              : `${getUserColor(displayName || 'You')} text-xs`
          )}>
          {displayName || 'You'}
        </span>
        <span
          className={cn('text-muted-foreground', compact ? 'text-[10px]' : 'text-xs')}>
          {formattedTime}
        </span>
      </div>
      <p className={cn('text-foreground/70', compact ? 'text-[13px]' : 'text-sm')}>
        {content}
      </p>
    </div>
  );
}
