'use client';

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useStrudelAudio } from '@/lib/hooks/use-strudel-audio';
import { useWebSocket } from '@/lib/hooks/use-websocket';
import { useAutosave } from '@/lib/hooks/use-autosave';
import { useStrudel, usePublicStrudel } from '@/lib/hooks/use-strudels';
import { useUIStore } from '@/lib/stores/ui';
import { useAuthStore } from '@/lib/stores/auth';
import { useEditorStore } from '@/lib/stores/editor';
import { useAudioStore } from '@/lib/stores/audio';
import { wsClient } from '@/lib/websocket/client';
import { storage } from '@/lib/utils/storage';
import {
  evaluateStrudel,
  stopStrudel,
  isAudioContextSuspended,
} from '@/components/shared/strudel-editor';

interface UseEditorOptions {
  strudelId?: string | null;
  forkStrudelId?: string | null;
  urlSessionId?: string | null;
  urlInviteToken?: string | null;
  urlDisplayName?: string | null;
}

export const useEditor = ({ strudelId, forkStrudelId, urlSessionId, urlInviteToken, urlDisplayName }: UseEditorOptions = {}) => {
  // set skip flag before webSocket connects
  // this prevents session_state from restoring old code when forking

  useLayoutEffect(() => {
    if (forkStrudelId && !strudelId) {
      wsClient.skipCodeRestoration = true;
    }
  }, [forkStrudelId, strudelId]);

  const router = useRouter();

  const { token } = useAuthStore();
  const { evaluate, stop } = useStrudelAudio();
  const { saveStatus, handleSave, isAuthenticated } = useAutosave();
  const { setCode, setCurrentStrudel, currentStrudelId } = useEditorStore();
  const { isChatPanelOpen, toggleChatPanel, setNewStrudelDialogOpen } = useUIStore();
  
  // check if we have a stored viewer session (for refresh reconnection)
  const storedViewerSession = typeof window !== 'undefined' ? storage.getViewerSession() : null;
  const hasInviteContext = !!(urlInviteToken || storedViewerSession?.inviteToken);

  const {
    sendCode,
    sendAgentRequest,
    sendChatMessage,
    sendPlay,
    sendStop,
    isConnected,
    canEdit,
    isViewer,
    isCoAuthor,
    sessionId,
    participants,
  } = useWebSocket({
    autoConnect: true,
    sessionId: urlSessionId || undefined,
    inviteToken: urlInviteToken || undefined,
    displayName: urlDisplayName || undefined,
  });

  const showChat = hasInviteContext || isViewer || isCoAuthor || participants.length > 1;

  const loadedStrudelIdRef = useRef<string | null>(null);
  const forkedStrudelIdRef = useRef<string | null>(null);

  // clear anonymous code when forking
  useEffect(() => {
    if (forkStrudelId && !strudelId) {
      storage.clearAnonymousCode();
    }
  }, [forkStrudelId, strudelId]);

  // fetch strudel for edit mode (requires auth - user's own strudel)
  const {
    data: ownStrudel,
    isLoading: isLoadingOwnStrudel,
    error: ownStrudelError,
  } = useStrudel(strudelId || '');

  // fetch strudel for fork mode (public endpoint - no auth required)
  const {
    data: publicStrudel,
    isLoading: isLoadingPublicStrudel,
    error: publicStrudelError,
  } = usePublicStrudel(forkStrudelId || '');

  const isLoadingStrudel = isLoadingOwnStrudel || isLoadingPublicStrudel;

  // handle strudel loading (edit mode)
  useEffect(() => {
    if (!strudelId) {
      // no strudel ID - reset if we had one before
      if (loadedStrudelIdRef.current) {
        loadedStrudelIdRef.current = null;
      }

      return;
    }

    // handle errors
    if (ownStrudelError) {
      const status = (ownStrudelError as { status?: number })?.status;
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

    // load strudel data once fetched
    if (ownStrudel && loadedStrudelIdRef.current !== strudelId) {
      loadedStrudelIdRef.current = strudelId;
      setCurrentStrudel(ownStrudel.id, ownStrudel.title);
      setCode(ownStrudel.code, true);

      // sync to WebSocket session once connected
      wsClient.onceConnected(() => {
        wsClient.sendCodeUpdate(ownStrudel.code);
      });
    }
  }, [strudelId, ownStrudel, ownStrudelError, router, setCode, setCurrentStrudel]);

  // handle fork loading (load code but don't set currentStrudelId)
  useEffect(() => {
    if (!forkStrudelId || strudelId) {
      // skip if no fork ID or if we're in edit mode
      return;
    }

    // handle errors
    if (publicStrudelError) {
      const status = (publicStrudelError as { status?: number })?.status;

      if (status === 404) {
        toast.error('Strudel not found');
      } else {
        toast.error('Failed to load strudel');
      }

      router.replace('/');
      return;
    }

    // load code only (not as owner) - saving will create new strudel
    if (publicStrudel && forkedStrudelIdRef.current !== forkStrudelId) {
      forkedStrudelIdRef.current = forkStrudelId;
      setCurrentStrudel(null, null);
      setCode(publicStrudel.code, true);

      // clear fork param from URL
      router.replace('/', { scroll: false });

      toast.success(`Forked "${publicStrudel.title}" - save to create your own copy`);

      // sync to WebSocket session once connected
      wsClient.onceConnected(() => {
        wsClient.sendCodeUpdate(publicStrudel.code);
      });
    }
  }, [
    forkStrudelId,
    strudelId,
    publicStrudel,
    publicStrudelError,
    router,
    setCode,
    setCurrentStrudel,
  ]);

  // register WebSocket callbacks for remote play/stop
  useEffect(() => {
    const { setPendingPlayback, setShowSyncOverlay } = useAudioStore.getState();

    const cleanupPlay = wsClient.onPlay(() => {
      // always update pending action to latest
      setPendingPlayback('play');

      if (isAudioContextSuspended()) {
        // audio needs user interaction - show sync overlay
        setShowSyncOverlay(true);
      } else {
        // audio is ready - play immediately
        evaluateStrudel();
      }
    });

    const cleanupStop = wsClient.onStop(() => {
      // always update pending action to latest
      setPendingPlayback('stop');

      if (isAudioContextSuspended()) {
        // audio needs user interaction - show sync overlay
        setShowSyncOverlay(true);
      } else {
        // audio is ready - stop immediately
        stopStrudel();
      }
    });

    const cleanupSessionEnded = wsClient.onSessionEnded((reason) => {
      stopStrudel();
      setShowSyncOverlay(false);
      setPendingPlayback(null);
      toast.info(reason || 'Session ended by host');
    });

    return () => {
      cleanupPlay();
      cleanupStop();
      cleanupSessionEnded();
    };
  }, []);

  const handlePlay = useCallback(() => {
    evaluate();
    
    // if user can edit (host/co-author), broadcast play to other participants
    if (canEdit) {
      sendPlay();
    }
  }, [evaluate, canEdit, sendPlay]);

  const handleStop = useCallback(() => {
    stop();
    
    // if user can edit (host/co-author), broadcast stop to other participants
    if (canEdit) {
      sendStop();
    }
  }, [stop, canEdit, sendStop]);

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
    isViewer,
    sessionId,
    token,
    saveStatus,
    isAuthenticated,
    isLoadingStrudel,
    currentStrudelId,
    showChat,
  };
};
