'use client';

import { Button } from '@/components/ui/button';
import {
  ArrowUp,
  Loader2,
  X,
  ChevronUp,
  ChevronDown,
  ShieldAlert,
  ClipboardPaste,
} from 'lucide-react';
import { AIMessage } from '../ai-message';
import { useAIInput } from './hooks';
import { useUIStore } from '@/lib/stores/ui';
import { useResizable } from '@/lib/hooks/use-resizable';

interface AIInputProps {
  onSendAIRequest: (query: string) => void;
  disabled?: boolean;
}

export function AIInput({ onSendAIRequest, disabled = false }: AIInputProps) {
  const {
    input,
    setInput,
    isExpanded,
    setIsExpanded,
    isAIGenerating,
    conversationHistory,
    isAIBlocked,
    pasteLocked,
    messagesEndRef,
    handleApplyCode,
    handleSend,
    handleKeyDown,
  } = useAIInput(onSendAIRequest, disabled);

  const { aiDrawerHeight, setAIDrawerHeight } = useUIStore();
  const { handleMouseDown } = useResizable({
    initialSize: aiDrawerHeight,
    onResize: setAIDrawerHeight,
    direction: 'top',
  });

  if (isAIBlocked) {
    return (
      <div className="border-t bg-background min-h-footer">
        <div className="p-3 h-footer flex items-center">
          <div className="bg-muted/30 border border-muted rounded-lg px-3 py-2 flex items-center gap-2 w-full">
            <ShieldAlert className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">
              AI assistant disabled - original creator restricted AI use for
              this strudel
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (pasteLocked) {
    return (
      <div className="border-t bg-background min-h-footer">
        <div className="p-3 h-footer flex items-center">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 flex items-center gap-2 w-full">
            <ClipboardPaste className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-sm text-amber-600 dark:text-amber-400">
              AI paused - make some edits to the pasted code to unlock AI assistance
            </span>
          </div>
        </div>
      </div>
    );
  }

  // calculate max available height for drawer
  const maxDrawerHeight = 'calc(100vh - var(--spacing-toolbar) - var(--spacing-footer) - 3rem)';
  const drawerHeight = `min(${aiDrawerHeight}px, ${maxDrawerHeight})`;

  return (
    <div
      className="border-t bg-background flex flex-col overflow-hidden"
      style={{ maxHeight: `calc(100vh - var(--spacing-toolbar))` }}>
      {isExpanded && conversationHistory.length > 0 && (
        <div className="border-b flex flex-col min-h-0 overflow-hidden" style={{ height: drawerHeight }}>
          {/* resize handle */}
          <div
            onMouseDown={handleMouseDown}
            className="h-1 cursor-row-resize shrink-0"
          />

          <div className="flex items-center justify-between px-3 py-2 bg-muted/30 shrink-0">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              {isAIGenerating ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Tinkering...
                </>
              ) : (
                'AI Assistant'
              )}
            </span>

            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setIsExpanded(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="overflow-y-auto p-3 space-y-2 flex-1 min-h-0">
            {conversationHistory.map(msg => (
              <AIMessage
                key={msg.id || msg.created_at}
                message={msg}
                onApplyCode={handleApplyCode}
              />
            ))}

            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      <div className="p-3 h-footer flex items-center shrink-0">
        <div className="bg-muted/50 border border-muted rounded-lg px-3 py-2 flex items-center gap-2 w-full">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask algorave agent for help or code snippets..."
            disabled={disabled || isAIGenerating}
            className="flex-1 bg-transparent text-sm focus:outline-none disabled:opacity-50"
          />

          {conversationHistory.length > 0 && (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Collapse' : 'Expand'}>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>
          )}

          {isAIGenerating && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
          )}

          <Button
            size="icon"
            className="h-7 w-7 rounded-md bg-primary hover:bg-primary/90 shrink-0"
            onClick={handleSend}
            disabled={disabled || isAIGenerating || !input.trim()}>
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
