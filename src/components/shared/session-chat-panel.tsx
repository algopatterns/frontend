'use client';

import { useRef, useEffect, useState } from 'react';
import { useWebSocketStore } from '@/lib/stores/websocket';
import { ChatMessage } from './chat-message';
import { ParticipantsList } from './participants-list';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface SessionChatPanelProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function SessionChatPanel({
  onSendMessage,
  disabled = false,
}: SessionChatPanelProps) {
  const { messages } = useWebSocketStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');

  // filter to only chat and system messages (no AI)
  const chatMessages = messages.filter(
    msg => msg.type === 'chat' || msg.type === 'system' || msg.type === 'user'
  );

  // auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = () => {
    if (!input.trim() || disabled) {
      return;
    }

    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ParticipantsList />

      <div className="flex-1 overflow-y-auto p-3 border-t">
        {chatMessages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            <p>No messages yet.</p>
            <p className="mt-1">Chat with other participants!</p>
          </div>
        ) : (
          chatMessages.map(msg => <ChatMessage key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t h-footer">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            disabled={disabled}
            className="flex-1 px-3 py-2 text-sm rounded-none border bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <Button size="icon" onClick={handleSend} disabled={disabled || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
