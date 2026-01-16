"use client";

import { useEffect, useCallback, useRef } from "react";
import { wsClient } from "@/lib/websocket/client";
import { useWebSocketStore } from "@/lib/stores/websocket";
import { useEditorStore } from "@/lib/stores/editor";
import { useAuthStore } from "@/lib/stores/auth";
import { storage } from "@/lib/utils/storage";
import { debounce, throttle } from "@/lib/utils/debounce";
import { setCursorChangeCallback } from "@/components/shared/strudel-editor/hooks";

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

  // create debounced send function (300ms reduces Redis usage by ~90%)
  // cursor position is bundled with code updates to keep them in sync for viewers
  const debouncedSendCodeRef = useRef(
    debounce((code: string, line: number, col: number, source: 'typed' | 'loaded_strudel' | 'forked' | 'paste') => {
      wsClient.sendCodeUpdate(code, line, col, source);
      wsClient.setPendingCodeUpdate(false);
    }, 300)
  );

  // create throttled cursor position sender (50ms = max 20 updates/sec)
  // only sends when there's no pending code update (cursor will be sent with code)
  const throttledSendCursorRef = useRef(
    throttle((line: number, col: number) => {
      // skip if code update is pending - cursor will be sent with code_update
      if (wsClient.hasPendingCodeUpdate) {
        return;
      }
      wsClient.sendCursorPosition(line, col);
    }, 50)
  );

  // set up cursor change callback for collaboration
  useEffect(() => {
    const canEdit = myRole === "host" || myRole === "co-author";

    if (canEdit && status === "connected") {
      setCursorChangeCallback((line, col) => {
        throttledSendCursorRef.current(line, col);
      });
    } else {
      setCursorChangeCallback(null);
    }

    return () => {
      setCursorChangeCallback(null);
    };
  }, [myRole, status]);

  const sendCode = useCallback(
    (newCode: string) => {
      // consume the source set by paste detection (defaults to 'typed')
      const source = useEditorStore.getState().consumeNextUpdateSource();

      // paste/load/fork events bypass debounce for immediate server-side detection
      if (source !== 'typed') {
        debouncedSendCodeRef.current.cancel(); // cancel pending debounced call
        wsClient.setPendingCodeUpdate(false);
        wsClient.sendCodeUpdate(newCode, cursorLine, cursorCol, source);
      } else {
        // mark that we have a pending code update - cursor updates will be skipped
        // until this code update is sent (cursor position is bundled with code)
        wsClient.setPendingCodeUpdate(true);
        debouncedSendCodeRef.current(newCode, cursorLine, cursorCol, source);
      }
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
