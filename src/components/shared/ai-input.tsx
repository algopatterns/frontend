'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useEditorStore } from '@/lib/stores/editor';
import { useWebSocketStore } from '@/lib/stores/websocket';
import {
  Sparkles,
  Send,
  Loader2,
  X,
  ChevronUp,
  ChevronDown,
  Settings,
} from 'lucide-react';
import { ChatMessage } from './chat-message';

interface AIInputProps {
  onSendAIRequest: (query: string) => void;
  disabled?: boolean;
}

export function AIInput({ onSendAIRequest, disabled = false }: AIInputProps) {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const { isAIGenerating } = useEditorStore();
  const { messages } = useWebSocketStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // filter to only AI messages
  const aiMessages = messages.filter(
    msg => msg.type === 'assistant' || (msg.type === 'user' && msg.isAIRequest)
  );

  // auto-scroll when expanded and new messages arrive
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, isExpanded]);

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
      {isExpanded && aiMessages.length > 0 && (
        <div className="border-b">
          <div className="flex items-center justify-between px-3 py-2 bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground">
              AI Assistant
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setIsExpanded(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="max-h-48 overflow-y-auto p-3 space-y-2">
            {aiMessages.map(msg => (
              <ChatMessage key={msg.id} message={msg} compact />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      <div className="p-3">
        {isAIGenerating ? (
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing...
          </p>
        ) : (
          <a
            href="https://algorave.ai/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Settings className="h-3.5 w-3.5" />
            configure
          </a>
        )}

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 flex-1 rounded-none border bg-muted/30">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI to help with your music..."
              disabled={disabled || isAIGenerating}
              className="flex-1 bg-transparent text-sm focus:outline-none disabled:opacity-50"
            />
            {aiMessages.length > 0 && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0"
                onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronUp className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={disabled || isAIGenerating || !input.trim()}>
            {isAIGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
