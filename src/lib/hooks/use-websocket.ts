"use client";

import { useEffect, useCallback, useRef } from "react";
import { wsClient } from "@/lib/websocket/client";
import { useWebSocketStore } from "@/lib/stores/websocket";
import { useEditorStore } from "@/lib/stores/editor";
import { useAuthStore } from "@/lib/stores/auth";
import { storage } from "@/lib/utils/storage";
import { debounce } from "@/lib/utils/debounce";

interface UseWebSocketOptions {
  sessionId?: string;
  inviteToken?: string;
  displayName?: string;
  autoConnect?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { autoConnect = true } = options;
  const { status, sessionId, error, participants, messages, myRole } =
    useWebSocketStore();
  const { cursorLine, cursorCol } = useEditorStore();
  const { hasHydrated } = useAuthStore();

  // track if we initiated a connection
  const hasConnected = useRef(false);

  // connect once auth has hydrated
  useEffect(() => {
    if (!hasHydrated || !autoConnect) return;
    if (hasConnected.current) return;

    // if already connected (e.g., from join page), don't reconnect
    if (wsClient.isConnected) {
      hasConnected.current = true;
      return;
    }

    hasConnected.current = true;

    // priority: URL params > stored viewer session > stored host session
    let sessionId = options.sessionId;
    let inviteToken = options.inviteToken;
    let displayName = options.displayName;

    // check for stored viewer session if no URL params
    if (!sessionId && !inviteToken) {
      const viewerSession = storage.getViewerSession();
      if (viewerSession) {
        sessionId = viewerSession.sessionId;
        inviteToken = viewerSession.inviteToken;
        if (!displayName && viewerSession.displayName) {
          displayName = viewerSession.displayName;
        }
      }
    }

    // fall back to host session ID
    if (!sessionId) {
      sessionId = storage.getSessionId() || undefined;
    }

    // save viewer session for future reconnects
    if (sessionId && inviteToken) {
      storage.setViewerSession(sessionId, inviteToken, displayName);
    }

    wsClient.connect({
      sessionId,
      inviteToken,
      displayName,
    });

    // don't disconnect on unmount - WebSocket is a singleton that persists
    // across page navigations. only disconnect explicitly (e.g., on logout).
  }, [hasHydrated, autoConnect, options.sessionId, options.inviteToken, options.displayName]);

  // create debounced send function
  const debouncedSendCodeRef = useRef(
    debounce((code: string, line: number, col: number) => {
      wsClient.sendCodeUpdate(code, line, col);
    }, 100)
  );

  const sendCode = useCallback(
    (newCode: string) => {
      debouncedSendCodeRef.current(newCode, cursorLine, cursorCol);
    },
    [cursorLine, cursorCol]
  );

  const sendChatMessage = useCallback((message: string) => {
    wsClient.sendChatMessage(message);
  }, []);

  const sendPlay = useCallback(() => {
    wsClient.sendPlay();
  }, []);

  const sendStop = useCallback(() => {
    wsClient.sendStop();
  }, []);

  const connect = useCallback(
    (opts?: UseWebSocketOptions) => {
      wsClient.connect({
        sessionId: opts?.sessionId || options.sessionId,
        inviteToken: opts?.inviteToken || options.inviteToken,
        displayName: opts?.displayName || options.displayName,
      });
    },
    [options]
  );

  const disconnect = useCallback(() => {
    wsClient.disconnect();
  }, []);

  return {
    status,
    sessionId,
    error,
    participants,
    messages,
    myRole,
    isConnected: status === "connected",
    isConnecting: status === "connecting" || status === "reconnecting",
    canEdit: myRole === "host" || myRole === "co-author",
    isHost: myRole === "host",
    isCoAuthor: myRole === "co-author",
    isViewer: myRole === "viewer",
    sendCode,
    sendChatMessage,
    sendPlay,
    sendStop,
    connect,
    disconnect,
  };
}
