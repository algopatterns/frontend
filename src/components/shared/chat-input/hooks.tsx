'use client';

import { useState, useRef, type KeyboardEvent } from 'react';
import { useEditorStore } from '@/lib/stores/editor';

export function useChatInput(
  onSendMessage: (message: string) => void,
  onSendAIRequest: (query: string) => void,
  disabled: boolean
) {
  const [message, setMessage] = useState('');
  const [isAIMode, setIsAIMode] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isAIGenerating } = useEditorStore();

  const handleSubmit = () => {
    if (!message.trim() || disabled || isAIGenerating) return;

    if (isAIMode) {
      onSendAIRequest(message.trim());
    } else {
      onSendMessage(message.trim());
    }

    setMessage('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return {
    message,
    setMessage,
    isAIMode,
    setIsAIMode,
    inputRef,
    isAIGenerating,
    handleSubmit,
    handleKeyDown,
  };
}
