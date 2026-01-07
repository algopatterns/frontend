'use client';

import { useRef, useEffect } from 'react';
import { useWebSocketStore } from '@/lib/stores/websocket';
import { useEditorStore } from '@/lib/stores/editor';

export function useChatPanel() {
  const { messages } = useWebSocketStore();
  const { isAIGenerating } = useEditorStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      const lastMessage = messages[messages.length - 1];

      if (lastMessage?.type === 'assistant') {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  const chatMessages = messages.filter(msg => {
    return msg.type !== 'assistant' && !msg.isAIRequest;
  });

  return {
    messages,
    chatMessages,
    isAIGenerating,
    messagesEndRef,
  };
}
