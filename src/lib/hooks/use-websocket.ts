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
  const { code, cursorLine, cursorCol, conversationHistory } = useEditorStore();
  const { hasHydrated } = useAuthStore();

  // track if we initiated a connection
  const hasConnected = useRef(false);

  // connect once auth has hydrated
  useEffect(() => {
    if (!hasHydrated || !autoConnect) return;
    if (hasConnected.current) return;

    hasConnected.current = true;

    const storedSessionId =
      options.sessionId || storage.getSessionId() || undefined;

    wsClient.connect({
      sessionId: storedSessionId,
      inviteToken: options.inviteToken,
      displayName: options.displayName,
    });

    return () => {
      // Only disconnect if actually connected, not if still connecting
      // This prevents StrictMode from closing the socket mid-handshake
      if (wsClient.isConnected) {
        wsClient.disconnect();
      }
      hasConnected.current = false;
    };
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

  const sendAgentRequest = useCallback(
    (
      query: string,
      provider?: "anthropic" | "openai",
      providerApiKey?: string
    ) => {
      wsClient.sendAgentRequest(
        query,
        code,
        conversationHistory,
        provider,
        providerApiKey
      );
    },
    [code, conversationHistory]
  );

  const sendChatMessage = useCallback((message: string) => {
    wsClient.sendChatMessage(message);
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
    sendCode,
    sendAgentRequest,
    sendChatMessage,
    connect,
    disconnect,
  };
}
