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
  const { token } = useAuthStore();

  // Use ref to track if we've connected
  const hasConnected = useRef(false);

  // Connect on mount
  useEffect(() => {
    if (autoConnect && !hasConnected.current) {
      hasConnected.current = true;

      // Check for stored session_id for anonymous reconnection
      const storedSessionId =
        options.sessionId || storage.getSessionId() || undefined;

      wsClient.connect({
        sessionId: storedSessionId,
        inviteToken: options.inviteToken,
        displayName: options.displayName,
      });
    }

    return () => {
      // Only disconnect on unmount if we connected
      if (hasConnected.current) {
        wsClient.disconnect();
        hasConnected.current = false;
      }
    };
  }, [autoConnect, options.sessionId, options.inviteToken, options.displayName]);

  // Create debounced send function
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
