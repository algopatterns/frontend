'use client';

import { useRef, useEffect, useState } from 'react';
import { useWebSocketStore } from '@/lib/stores/websocket';

export function useSessionChatPanel(onSendMessage: (message: string) => void, disabled: boolean) {
  const { messages } = useWebSocketStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');

  const chatMessages = messages.filter(
    msg => (msg.type === 'chat' || msg.type === 'system') && !msg.isAIRequest
  );

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

  return {
    chatMessages,
    messagesEndRef,
    input,
    setInput,
    handleSend,
    handleKeyDown,
  };
}
