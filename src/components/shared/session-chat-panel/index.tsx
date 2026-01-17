'use client';

import { ChatMessage } from '../chat-message';
import { ParticipantsList } from '../participants-list';
import { useSessionChatPanel } from './hooks';

interface SessionChatPanelProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function SessionChatPanel({
  onSendMessage,
  disabled = false,
}: SessionChatPanelProps) {
  const { chatMessages, messagesEndRef } = useSessionChatPanel(onSendMessage, disabled);

  return (
    <div className="flex flex-col h-full border-b">
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
    </div>
  );
}

export { useSessionChatPanel };
