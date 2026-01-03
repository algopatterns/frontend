'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useStrudelAudio } from '@/lib/hooks/use-strudel-audio';
import { useWebSocket } from '@/lib/hooks/use-websocket';
import { useAutosave } from '@/lib/hooks/use-autosave';
import { useStrudel } from '@/lib/hooks/use-strudels';
import { useUIStore } from '@/lib/stores/ui';
import { useAuthStore } from '@/lib/stores/auth';
import { useEditorStore } from '@/lib/stores/editor';
import { wsClient } from '@/lib/websocket/client';

interface UseEditorOptions {
  strudelId?: string | null;
}

export const useEditor = ({ strudelId }: UseEditorOptions = {}) => {
  const router = useRouter();
  const { token } = useAuthStore();
  const { setCode, setCurrentStrudel, currentStrudelId } = useEditorStore();
  const { evaluate, stop } = useStrudelAudio();
  const { isChatPanelOpen, toggleChatPanel, setNewStrudelDialogOpen } = useUIStore();
  const { sendCode, sendAgentRequest, sendChatMessage, isConnected, canEdit, sessionId } =
    useWebSocket({
      autoConnect: true,
    });
  const { saveStatus, handleSave, isAuthenticated } = useAutosave();

  // Track if we've already loaded this strudel to prevent re-fetching
  const loadedStrudelIdRef = useRef<string | null>(null);

  // Fetch strudel if ID is provided
  const {
    data: strudel,
    isLoading: isLoadingStrudel,
    error: strudelError,
  } = useStrudel(strudelId || '');

  // Handle strudel loading
  useEffect(() => {
    if (!strudelId) {
      // No strudel ID - reset if we had one before
      if (loadedStrudelIdRef.current) {
        loadedStrudelIdRef.current = null;
      }
      return;
    }

    // Handle errors
    if (strudelError) {
      const status = (strudelError as { status?: number })?.status;
      if (status === 404) {
        toast.error('Strudel not found');
      } else if (status === 403) {
        toast.error("You don't have access to this strudel");
      } else {
        toast.error('Failed to load strudel');
      }
      router.replace('/');
      return;
    }

    // Load strudel data once fetched
    if (strudel && loadedStrudelIdRef.current !== strudelId) {
      loadedStrudelIdRef.current = strudelId;
      setCurrentStrudel(strudel.id, strudel.title);
      setCode(strudel.code, true);

      // Sync to WebSocket session once connected
      wsClient.onceConnected(() => {
        wsClient.sendCodeUpdate(strudel.code);
      });
    }
  }, [strudelId, strudel, strudelError, router, setCode, setCurrentStrudel]);

  const handlePlay = useCallback(() => evaluate(), [evaluate]);
  const handleStop = useCallback(() => stop(), [stop]);

  const handleCodeChange = useCallback(
    (newCode: string) => {
      if (isConnected && canEdit) {
        sendCode(newCode);
      }
    },
    [isConnected, canEdit, sendCode]
  );

  const handleSendAIRequest = useCallback(
    (query: string) => sendAgentRequest(query),
    [sendAgentRequest]
  );

  const handleSendMessage = useCallback(
    (message: string) => sendChatMessage(message),
    [sendChatMessage]
  );

  const handleNewStrudel = useCallback(() => {
    setNewStrudelDialogOpen(true);
  }, [setNewStrudelDialogOpen]);

  return {
    handleCodeChange,
    handlePlay,
    handleStop,
    handleSendAIRequest,
    handleSendMessage,
    handleSave,
    handleNewStrudel,
    isChatPanelOpen,
    toggleChatPanel,
    isConnected,
    canEdit,
    sessionId,
    token,
    saveStatus,
    isAuthenticated,
    isLoadingStrudel,
    currentStrudelId,
  };
};
