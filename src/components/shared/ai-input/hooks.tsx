'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/lib/stores/editor';
import { useWebSocketStore } from '@/lib/stores/websocket';
import { toast } from 'sonner';

export function useAIInput(onSendAIRequest: (query: string) => void, disabled: boolean) {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const { pasteLocked } = useWebSocketStore();
  const { isAIGenerating, conversationHistory, setCode, parentCCSignal, forkedFromId } =
    useEditorStore();

  // permanent AI block from parent CC signal takes precedence over websocket paste lock
  // if parent strudel has 'no-ai' restriction, AI is permanently disabled for all forks
  const isAIBlocked = !!(forkedFromId && parentCCSignal === 'no-ai');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleApplyCode = useCallback(
    (code: string) => {
      setCode(code, false);
      toast.success('Code applied to editor');
    },
    [setCode]
  );

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

  return {
    input,
    setInput,
    isExpanded,
    setIsExpanded,
    isAIGenerating,
    conversationHistory,
    isAIBlocked,
    pasteLocked,
    messagesEndRef,
    handleApplyCode,
    handleSend,
    handleKeyDown,
  };
}
