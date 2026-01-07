'use client';

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useStrudelAudio } from '@/lib/hooks/use-strudel-audio';
import { useWebSocket } from '@/lib/hooks/use-websocket';
import { useAutosave } from '@/lib/hooks/use-autosave';
import { useAgentGenerate } from '@/lib/hooks/use-agent';
import { useStrudel, usePublicStrudel } from '@/lib/hooks/use-strudels';
import { useSessionInvites } from '@/lib/hooks/use-sessions';
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

export const useEditor = ({
  strudelId,
  forkStrudelId,
  urlSessionId,
  urlInviteToken,
  urlDisplayName,
}: UseEditorOptions = {}) => {
  // set skip flag before websocket connects
  // this prevents session_state from restoring old code when forking
  useLayoutEffect(() => {
    if (forkStrudelId && !strudelId) {
      wsClient.skipCodeRestoration = true;
    }
  }, [forkStrudelId, strudelId]);

  const router = useRouter();

  const { token } = useAuthStore();
  const agentGenerate = useAgentGenerate();
  const { evaluate, stop } = useStrudelAudio();
  const { saveStatus, handleSave, isAuthenticated } = useAutosave();
  const { isChatPanelOpen, toggleChatPanel, setNewStrudelDialogOpen } = useUIStore();
  const {
    setCode,
    setCurrentStrudel,
    setCurrentDraftId,
    setForkedFromId,
    setParentCCSignal,
    currentStrudelId,
    markSaved,
    setConversationHistory,
  } = useEditorStore();

  // check if we have a stored viewer session (for refresh reconnection)
  const storedViewerSession =
    typeof window !== 'undefined' ? storage.getViewerSession() : null;
  const hasInviteContext = !!(urlInviteToken || storedViewerSession?.inviteToken);

  const {
    sendCode,
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

  // check if host has generated any invites (only for authenticated users)
  const { data: invitesData } = useSessionInvites(token && sessionId ? sessionId : '');
  const hasActiveInvites = (invitesData?.tokens?.length ?? 0) > 0;

  const showChat =
    hasInviteContext ||
    isViewer ||
    isCoAuthor ||
    participants.length > 1 ||
    hasActiveInvites;

  const loadedStrudelIdRef = useRef<string | null>(null);
  const forkedStrudelIdRef = useRef<string | null>(null);
  const previousStrudelIdRef = useRef<string | null | undefined>(undefined);

  // clear conversation when strudel changes to prevent bleed between strudels
  useEffect(() => {
    const currentId = strudelId || null;
    const previousId = previousStrudelIdRef.current;

    // first render - just initialize ref
    if (previousId === undefined) {
      previousStrudelIdRef.current = currentId;
      return;
    }

    // strudel changed - clear conversation immediately
    // loading effect will set new conversation when data arrives
    if (currentId !== previousId) {
      previousStrudelIdRef.current = currentId;
      setConversationHistory([]);
    }
  }, [strudelId, setConversationHistory]);

  // restore strudel from localStorage if navigating back to editor without URL param
  useEffect(() => {
    // skip if we already have a strudel ID in URL or are forking/joining session
    if (strudelId || forkStrudelId || urlSessionId || urlInviteToken) {
      return;
    }

    // check for saved strudel
    const storedStrudelId = storage.getCurrentStrudelId();
    if (storedStrudelId) {
      // redirect to include the strudel ID in URL
      router.replace(`/?id=${storedStrudelId}`, { scroll: false });
    }
    // note: unsaved drafts are accessed via /drafts page, not auto-restored
  }, [strudelId, forkStrudelId, urlSessionId, urlInviteToken, router]);

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

  // handle strudel loading from REST API
  useEffect(() => {
    if (!strudelId) {
      if (loadedStrudelIdRef.current) {
        loadedStrudelIdRef.current = null;
      }
      return;
    }

    // handle errors from API
    if (ownStrudelError) {
      const status = (ownStrudelError as { status?: number })?.status;

      switch (status) {
        case 404:
          toast.error('Strudel not found');
          break;
        case 403:
          toast.error("You don't have access to this strudel");
          break;
        default:
          toast.error('Failed to load strudel');
          break;
      }
      
      router.replace('/');
      return;
    }

    // load strudel data from REST API
    if (ownStrudel && loadedStrudelIdRef.current !== strudelId) {
      loadedStrudelIdRef.current = strudelId;

      // set code and conversation history from strudel
      setCode(ownStrudel.code, true);
      setConversationHistory(ownStrudel.conversation_history || []);

      // set strudel metadata
      setCurrentStrudel(ownStrudel.id, ownStrudel.title);

      // set fork info if this strudel was forked (for AI blocking)
      if (ownStrudel.forked_from) {
        setForkedFromId(ownStrudel.forked_from);
        setParentCCSignal(ownStrudel.parent_cc_signal ?? null);
      }

      markSaved();

      // sync code to WebSocket session
      wsClient.onceConnected(() => {
        wsClient.sendCodeUpdate(ownStrudel.code, undefined, undefined, 'loaded_strudel');
      });
    }
  }, [
    strudelId,
    ownStrudel,
    ownStrudelError,
    router,
    setCode,
    setConversationHistory,
    setCurrentStrudel,
    setForkedFromId,
    setParentCCSignal,
    markSaved,
  ]);

  // handle fork loading (load code but don't set currentStrudelId)
  useEffect(() => {
    if (!forkStrudelId || strudelId) {
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

    // load forked code (no conversation history - forks start fresh)
    if (publicStrudel && forkedStrudelIdRef.current !== forkStrudelId) {
      forkedStrudelIdRef.current = forkStrudelId;

      // use deterministic draft ID based on forked strudel
      // this prevents duplicate drafts when re-forking the same strudel
      const forkDraftId = `fork_${forkStrudelId}`;

      // set local state (forkedFromId is tracked in store and localStorage, not in code)
      setCurrentStrudel(null, null);
      setCurrentDraftId(forkDraftId);
      setForkedFromId(forkStrudelId);
      setParentCCSignal(publicStrudel.cc_signal ?? null);
      setCode(publicStrudel.code, true);
      setConversationHistory([]);

      // save fork to localStorage (overwrites existing fork of same strudel)
      storage.setDraft({
        id: forkDraftId,
        code: publicStrudel.code,
        conversationHistory: [],
        updatedAt: Date.now(),
        title: `Fork of ${publicStrudel.title}`,
        forkedFromId: forkStrudelId,
        parentCCSignal: publicStrudel.cc_signal ?? null,
      });

      // clear fork param from URL
      router.replace('/', { scroll: false });

      toast.success(`Forked "${publicStrudel.title}" - save to create your own copy`);

      // sync forked code with session
      wsClient.onceConnected(() => {
        wsClient.sendCodeUpdate(publicStrudel.code, undefined, undefined, 'forked');
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
    setCurrentDraftId,
    setForkedFromId,
    setParentCCSignal,
    setConversationHistory,
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

    const cleanupSessionEnded = wsClient.onSessionEnded(reason => {
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
    (query: string) => agentGenerate.mutate(query),
    [agentGenerate]
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
