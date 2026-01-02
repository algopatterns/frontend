"use client";

import { useRef, useEffect } from "react";
import { useWebSocketStore } from "@/lib/stores/websocket";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ParticipantsList } from "./participants-list";

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
  const { messages } = useWebSocketStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full border-l bg-background">
      <div className="p-3 border-b">
        <h2 className="font-medium">Chat & AI Assistant</h2>
      </div>

      <ParticipantsList />

      <div className="flex-1 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            <p>No messages yet.</p>
            <p className="mt-1">Ask AI to help you create music!</p>
          </div>
        ) : (
          messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
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
