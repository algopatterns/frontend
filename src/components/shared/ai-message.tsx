'use client';

import { cn } from '@/lib/utils';
import { Highlight, themes } from 'prism-react-renderer';
import type { AgentMessage } from '@/lib/api/strudels/types';

interface AIMessageProps {
  message: AgentMessage;
}

export function AIMessage({ message }: AIMessageProps) {
  const { role, content, is_code_response, clarifying_questions, created_at } = message;

  const formattedTime = created_at
    ? new Date(created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  if (role === 'user') {
    return (
      <div className="rounded-sm bg-black/30 p-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-rose-300/70 text-[12px]">You</span>
          {formattedTime && (
            <span className="text-muted-foreground text-[10px]">{formattedTime}</span>
          )}
        </div>
        <p className="text-foreground/70 text-[13px]">{content}</p>
      </div>
    );
  }

  // assistant message
  return (
    <div className="rounded-sm bg-black/30 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-medium text-teal-300/70 text-[12px]">Assistant</span>
        {formattedTime && (
          <span className="text-muted-foreground text-[10px]">{formattedTime}</span>
        )}
      </div>

      {content && (
        <>
          {is_code_response ? (
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
          ) : (
            <p className="whitespace-pre-wrap text-foreground/70 text-[13px]">{content}</p>
          )}
        </>
      )}

      {clarifying_questions && clarifying_questions.length > 0 && (
        <div className="space-y-1 mt-1">
          <p className="text-muted-foreground text-[10px]">I need more information:</p>
          <ul className="list-disc list-inside space-y-1 text-foreground/70 text-xs">
            {clarifying_questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
