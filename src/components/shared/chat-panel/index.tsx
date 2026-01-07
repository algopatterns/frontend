'use client';

import { ChatMessage } from '../chat-message';
import { ChatInput } from '../chat-input';
import { ParticipantsList } from '../participants-list';
import { Loader2 } from 'lucide-react';
import { useChatPanel } from './hooks';

interface ChatPanelProps {
  onSendMessage: (message: string) => void;
  onSendAIRequest: (query: string) => void;
  disabled?: boolean;
}

export function ChatPanel({
  onSendMessage,
  onSendAIRequest,
  disabled = false,
}: ChatPanelProps) {
  const { chatMessages, isAIGenerating, messagesEndRef } = useChatPanel();

  return (
    <div className="flex flex-col h-full border-l border-t bg-background">
      <div className="p-3 border-b">
        <h2 className="font-medium flex items-center gap-2">
          {isAIGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            'Chat'
          )}
        </h2>
      </div>

      <ParticipantsList />

      <div className="flex-1 overflow-y-auto p-3 border-t">
        {chatMessages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            <p>No messages yet.</p>
            <p className="mt-1">Start chatting with other participants!</p>
          </div>
        ) : (
          chatMessages.map(msg => <ChatMessage key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSendMessage={onSendMessage}
        onSendAIRequest={onSendAIRequest}
        disabled={disabled}
      />
    </div>
  );
}
