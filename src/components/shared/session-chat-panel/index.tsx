'use client';

import { ChatMessage } from '../chat-message';
import { ParticipantsList } from '../participants-list';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';
import { useSessionChatPanel } from './hooks';

interface SessionChatPanelProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function SessionChatPanel({
  onSendMessage,
  disabled = false,
}: SessionChatPanelProps) {
  const {
    chatMessages,
    messagesEndRef,
    input,
    setInput,
    handleSend,
    handleKeyDown,
  } = useSessionChatPanel(onSendMessage, disabled);

  return (
    <div className="flex flex-col h-full">
      <ParticipantsList />

      <div className="flex-1 overflow-y-auto p-3">
        {chatMessages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            <p className="mt-1">Join the party!</p>
          </div>
        ) : (
          chatMessages.map(msg => <ChatMessage key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t h-footer flex items-center">
        <div className="bg-muted/50 border border-muted rounded-lg px-3 py-2 flex items-center gap-2 w-full">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            disabled={disabled}
            className="flex-1 bg-transparent text-sm focus:outline-none disabled:opacity-50"
          />
          <Button
            size="icon"
            className="h-7 w-7 rounded-md bg-primary hover:bg-primary/90 shrink-0"
            onClick={handleSend}
            disabled={disabled || !input.trim()}>
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
