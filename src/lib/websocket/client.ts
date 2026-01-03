import { useAuthStore } from "@/lib/stores/auth";
import { useWebSocketStore } from "@/lib/stores/websocket";
import { useEditorStore } from "@/lib/stores/editor";
import { storage } from "@/lib/utils/storage";
import { WS_BASE_URL, WEBSOCKET, EDITOR } from "@/lib/constants";
import type {
  WebSocketMessage,
  SessionStatePayload,
  CodeUpdateBroadcastPayload,
  AgentRequestBroadcastPayload,
  AgentResponsePayload,
  ChatMessageBroadcastPayload,
  UserJoinedPayload,
  UserLeftPayload,
  ErrorPayload,
} from "./types";

interface ConnectionOptions {
  sessionId?: string;
  previousSessionId?: string;
  inviteToken?: string;
  displayName?: string;
}

class AlgoraveWebSocket {
  private ws: WebSocket | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private connectionOptions: ConnectionOptions = {};
  private shouldReconnect = true;
  private onConnectedCallbacks: Array<() => void> = [];

  // flag to skip code restoration in session_state when forking
  public skipCodeRestoration = false;

  onceConnected(callback: () => void) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      callback();
    } else {
      this.onConnectedCallbacks.push(callback);
    }
  }

  connect(options: ConnectionOptions = {}) {
    // don't interrupt an existing connection
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    // clean up any stale connection
    this.cleanup();

    this.connectionOptions = options;
    this.shouldReconnect = true;

    const { token } = useAuthStore.getState();
    const { setStatus, setError } = useWebSocketStore.getState();

    setStatus("connecting");
    setError(null);

    const params = new URLSearchParams();
    
    if (options.sessionId) params.set("session_id", options.sessionId);
    if (options.previousSessionId) params.set("previous_session_id", options.previousSessionId);
    if (token) params.set("token", token);
    if (options.inviteToken) params.set("invite", options.inviteToken);
    if (options.displayName) params.set("display_name", options.displayName);

    const wsUrl = `${WS_BASE_URL}/api/v1/ws${params.toString() ? `?${params}` : ""}`;

    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
      this.startConnectionTimeout();
    } catch (error) {
      console.error("[WS] Failed to create WebSocket:", error);
      setStatus("disconnected");
      setError("Failed to connect");
    }
  }

  private startConnectionTimeout() {
    this.connectionTimeout = setTimeout(() => {
      if (this.ws?.readyState === WebSocket.CONNECTING) {
        // connection is still pending after timeout - close and retry
        this.ws.close();
      }
    }, WEBSOCKET.CONNECTION_TIMEOUT_MS);
  }

  private clearConnectionTimeout() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  private cleanup() {
    this.stopPing();
    this.clearConnectionTimeout();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      // remove handlers before closing to prevent triggering reconnect
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000, "Cleanup");
      }
      this.ws = null;
    }
  }

  private setupEventHandlers() {
    if (!this.ws) return;

    const { setStatus, setError } = useWebSocketStore.getState();

    this.ws.onopen = () => {
      this.clearConnectionTimeout();
      this.reconnectAttempts = 0;
      setStatus("connected");
      setError(null);
      this.startPing();

      // execute and clear onceConnected callbacks
      const callbacks = this.onConnectedCallbacks;
      this.onConnectedCallbacks = [];
      callbacks.forEach((cb) => cb());
    };

    this.ws.onclose = (event) => {
      this.clearConnectionTimeout();
      this.stopPing();

      if (this.shouldReconnect && event.code !== 1000) {
        this.scheduleReconnect();
      } else {
        setStatus("disconnected");
      }
    };

    this.ws.onerror = () => {
      // onclose will follow and handle status
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error("[WS] Failed to parse message:", error);
      }
    };
  }

  private scheduleReconnect() {
    const { setStatus } = useWebSocketStore.getState();

    if (this.reconnectAttempts >= WEBSOCKET.RECONNECT_MAX_ATTEMPTS) {
      setStatus("disconnected");
      return;
    }

    setStatus("reconnecting");
    this.reconnectAttempts++;

    const delay = Math.min(
      WEBSOCKET.RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts - 1),
      10000
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connect(this.connectionOptions);
    }, delay);
  }

  private handleMessage(message: WebSocketMessage) {
    const {
      setSessionId,
      setMyRole,
      setParticipants,
      addParticipant,
      removeParticipant,
      addMessage,
      setError,
    } = useWebSocketStore.getState();
    const { setCode, setAIGenerating, addToHistory } = useEditorStore.getState();

    switch (message.type) {
      case "session_state": {
        const payload = message.payload as SessionStatePayload;
        const hasToken = !!useAuthStore.getState().token;
        const savedAnonymousCode = storage.getAnonymousCode();

        setSessionId(message.session_id);
        setMyRole(payload.your_role);
        setParticipants(
          payload.participants.map((p, index) => ({
            id: p.user_id || `participant-${index}`,
            userId: p.user_id,
            displayName: p.display_name,
            role: p.role,
          }))
        );

        // if we have saved anonymous code and server sent empty code, restore the saved code
        // this handles anonymous refresh (login transition is handled by backend via previous_session_id)
        // skip if skipCodeRestoration flag is set (e.g., when forking)
        if (this.skipCodeRestoration) {
          this.skipCodeRestoration = false; // Reset flag after use
        } else if (savedAnonymousCode && !payload.code) {
          setCode(savedAnonymousCode, true);
          // sendCodeUpdate also saves to localStorage, keeping it for future refreshes
          this.sendCodeUpdate(savedAnonymousCode);
        } else {
          const code = payload.code || EDITOR.DEFAULT_CODE;
          setCode(code, true);

          // if we had to use default code, sync it with the server
          if (!payload.code) {
            this.sendCodeUpdate(code);
          }
        }

        // only store session ID for authenticated users
        // anonymous sessions are ephemeral - code is saved separately
        if (hasToken) {
          storage.setSessionId(message.session_id);
        }

        break;
      }

      case "code_update": {
        const payload = message.payload as CodeUpdateBroadcastPayload;
        setCode(payload.code, true);
        break;
      }

      case "agent_request": {
        const payload = message.payload as AgentRequestBroadcastPayload;
        setAIGenerating(true);
        addMessage({
          id: crypto.randomUUID(),
          type: "user",
          content: payload.user_query,
          displayName: payload.display_name,
          timestamp: message.timestamp,
        });
        addToHistory("user", payload.user_query);
        break;
      }

      case "agent_response": {
        const payload = message.payload as AgentResponsePayload;
        setAIGenerating(false);
        if (payload.code && payload.is_actionable) {
          setCode(payload.code, true);
          addToHistory("assistant", payload.code);
        }
        addMessage({
          id: crypto.randomUUID(),
          type: "assistant",
          content: payload.code || "",
          isActionable: payload.is_actionable,
          clarifyingQuestions: payload.clarifying_questions,
          timestamp: message.timestamp,
        });
        break;
      }

      case "chat_message": {
        const payload = message.payload as ChatMessageBroadcastPayload;
        addMessage({
          id: crypto.randomUUID(),
          type: "chat",
          content: payload.message,
          displayName: payload.display_name,
          timestamp: message.timestamp,
        });
        break;
      }

      case "user_joined": {
        const payload = message.payload as UserJoinedPayload;
        addParticipant({
          id: payload.user_id || crypto.randomUUID(),
          userId: payload.user_id,
          displayName: payload.display_name,
          role: payload.role,
        });
        addMessage({
          id: crypto.randomUUID(),
          type: "system",
          content: `${payload.display_name} joined`,
          timestamp: message.timestamp,
        });
        break;
      }

      case "user_left": {
        const payload = message.payload as UserLeftPayload;
        removeParticipant(payload.user_id);
        addMessage({
          id: crypto.randomUUID(),
          type: "system",
          content: `${payload.display_name} left`,
          timestamp: message.timestamp,
        });
        break;
      }

      case "error": {
        const payload = message.payload as ErrorPayload;
        setError(payload.message);
        if (payload.error === "too_many_requests") {
          setAIGenerating(false);
        }
        break;
      }

      case "pong":
        break;
    }
  }

  send(type: string, payload: Record<string, unknown>) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const { sessionId } = useWebSocketStore.getState();
    const message = { type, session_id: sessionId, payload };
    this.ws.send(JSON.stringify(message));
  }

  sendCodeUpdate(code: string, cursorLine?: number, cursorCol?: number) {
    // save code for anonymous users so it can be restored after login
    if (!useAuthStore.getState().token) {
      storage.setAnonymousCode(code);
    }

    this.send("code_update", { code, cursor_line: cursorLine, cursor_col: cursorCol });
  }

  sendAgentRequest(
    query: string,
    editorState: string,
    conversationHistory?: Array<{ role: string; content: string }>,
    provider?: "anthropic" | "openai",
    providerApiKey?: string
  ) {
    this.send("agent_request", {
      user_query: query,
      editor_state: editorState,
      conversation_history: conversationHistory || [],
      ...(provider && { provider }),
      ...(providerApiKey && { provider_api_key: providerApiKey }),
    });
  }

  sendChatMessage(message: string) {
    this.send("chat_message", { message });
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      this.send("ping", {});
    }, WEBSOCKET.PING_INTERVAL_MS);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    this.cleanup();
    useWebSocketStore.getState().reset();
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get isConnecting() {
    return this.ws?.readyState === WebSocket.CONNECTING;
  }
}

export const wsClient = new AlgoraveWebSocket();
