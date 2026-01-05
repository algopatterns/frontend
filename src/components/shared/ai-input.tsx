'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useEditorStore } from '@/lib/stores/editor';
import { ArrowUp, Loader2, X, ChevronUp, ChevronDown } from 'lucide-react';
import { AIMessage } from './ai-message';

interface AIInputProps {
  onSendAIRequest: (query: string) => void;
  disabled?: boolean;
}

export function AIInput({ onSendAIRequest, disabled = false }: AIInputProps) {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const { isAIGenerating, conversationHistory } = useEditorStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // auto-scroll when expanded and new messages arrive
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationHistory, isExpanded]);

  const handleSend = () => {
    if (!input.trim() || disabled || isAIGenerating) return;
    onSendAIRequest(input.trim());
    setInput('');
    setIsExpanded(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-background min-h-footer">
      {isExpanded && conversationHistory.length > 0 && (
        <div className="border-b">
          <div className="flex items-center justify-between px-3 py-2 bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              {isAIGenerating ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Tinkering...
                </>
              ) : (
                "AI Assistant"
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
          <div className="max-h-96 overflow-y-auto p-3 space-y-2">
            {conversationHistory.map(msg => (
              <AIMessage key={msg.id || msg.created_at} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      <div className="p-3 h-footer flex items-center">
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
