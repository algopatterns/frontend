'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/lib/stores/editor';
import { useWebSocketStore } from '@/lib/stores/websocket';
import { useUIStore } from '@/lib/stores/ui';
import { toast } from 'sonner';

// padding/chrome around content (header + padding + borders)
const DRAWER_CHROME_HEIGHT = 80;
const MIN_AUTO_HEIGHT = 120;

export function useAIInput(onSendAIRequest: (query: string) => void, disabled: boolean) {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [userControlledDrawer, setUserControlledDrawer] = useState(false);

  const { pasteLocked } = useWebSocketStore();
  const { isAIGenerating, conversationHistory, setCode, parentCCSignal, forkedFromId } =
    useEditorStore();
  const { aiDrawerHeight, setAIDrawerHeight } = useUIStore();

  // permanent AI block from parent CC signal takes precedence over websocket paste lock
  // if forked and parent has no signal or 'no-ai', AI is disabled (default to restrictive)
  const parentSignalBlocksAI = !parentCCSignal || parentCCSignal === 'no-ai';
  const isAIBlocked = !!(forkedFromId && parentSignalBlocksAI);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleApplyCode = useCallback(
    (code: string) => {
      setCode(code, false);
      toast.success('Code applied to editor');
    },
    [setCode]
  );

  // reset user control when drawer closes
  useEffect(() => {
    if (!isExpanded) {
      setUserControlledDrawer(false);
    }
  }, [isExpanded]);

  // auto-expand drawer during streaming (if user hasn't taken control)
  useEffect(() => {
    if (!isExpanded || userControlledDrawer || !contentRef.current) return;

    const lastMessage = conversationHistory[conversationHistory.length - 1];
    const isStreaming = lastMessage?.is_streaming;

    if (!isStreaming && !isAIGenerating) return;

    // measure content and expand drawer to fit
    const contentHeight = contentRef.current.scrollHeight + DRAWER_CHROME_HEIGHT;
    const maxHeight = window.innerHeight * 0.6; // cap at 60% viewport
    const targetHeight = Math.min(Math.max(contentHeight, MIN_AUTO_HEIGHT), maxHeight);

    // only expand, never shrink during streaming
    if (targetHeight > aiDrawerHeight) {
      setAIDrawerHeight(targetHeight);
    }
  }, [conversationHistory, isExpanded, userControlledDrawer, isAIGenerating, aiDrawerHeight, setAIDrawerHeight]);

  // scroll to bottom when content changes
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationHistory, isExpanded]);

  // mark drawer as user-controlled when manually resized
  const handleManualResize = useCallback((height: number) => {
    setUserControlledDrawer(true);
    setAIDrawerHeight(height);
  }, [setAIDrawerHeight]);

  const handleSend = () => {
    if (!input.trim() || disabled || isAIGenerating) return;
    // reset user control on new message so auto-expand works again
    setUserControlledDrawer(false);
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
    contentRef,
    handleApplyCode,
    handleSend,
    handleKeyDown,
    handleManualResize,
  };
}
