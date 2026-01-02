import { useAuthStore } from "@/lib/stores/auth";
import { useWebSocketStore } from "@/lib/stores/websocket";
import { useEditorStore } from "@/lib/stores/editor";
import { storage } from "@/lib/utils/storage";
import { WS_BASE_URL, WEBSOCKET } from "@/lib/constants";
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
  inviteToken?: string;
  displayName?: string;
}

class AlgoraveWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = WEBSOCKET.RECONNECT_MAX_ATTEMPTS;
  private reconnectDelay = WEBSOCKET.RECONNECT_DELAY_MS;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private connectionOptions: ConnectionOptions = {};

  connect(options: ConnectionOptions = {}) {
    // Don't connect if already connecting or connected
    const currentStatus = useWebSocketStore.getState().status;
    if (currentStatus === "connecting" || currentStatus === "connected") {
      return;
    }

    this.connectionOptions = options;
    const { token } = useAuthStore.getState();
    const { setStatus, setError } = useWebSocketStore.getState();

    setStatus("connecting");
    setError(null);

    const params = new URLSearchParams();
    if (options.sessionId) params.set("session_id", options.sessionId);
    if (token) params.set("token", token);
    if (options.inviteToken) params.set("invite", options.inviteToken);
    if (options.displayName) params.set("display_name", options.displayName);

    const wsUrl = `${WS_BASE_URL}/api/v1/ws${params.toString() ? `?${params}` : ""}`;

    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      setStatus("disconnected");
      setError("Failed to connect to WebSocket");
    }
  }

  private setupEventHandlers() {
    if (!this.ws) return;

    const { setStatus, setError } = useWebSocketStore.getState();

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      setStatus("connected");
      this.reconnectAttempts = 0;
      this.startPing();
    };

    this.ws.onclose = (event) => {
      console.log("WebSocket closed:", event.code, event.reason);
      this.stopPing();
      if (event.wasClean) {
        setStatus("disconnected");
      } else {
        this.attemptReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("WebSocket connection error");
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };
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
        setSessionId(message.session_id);
        setMyRole(payload.your_role);
        setCode(payload.code, true);
        setParticipants(
          payload.participants.map((p, index) => ({
            id: p.user_id || `participant-${index}`,
            userId: p.user_id,
            displayName: p.display_name,
            role: p.role,
          }))
        );
        // Store session_id for anonymous users
        if (!useAuthStore.getState().token) {
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
        // Connection is alive
        break;
    }
  }

  send(type: string, payload: Record<string, unknown>) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not connected");
      return;
    }

    const { sessionId } = useWebSocketStore.getState();
    const message = {
      type,
      session_id: sessionId,
      payload,
    };

    this.ws.send(JSON.stringify(message));
  }

  sendCodeUpdate(code: string, cursorLine?: number, cursorCol?: number) {
    this.send("code_update", {
      code,
      cursor_line: cursorLine,
      cursor_col: cursorCol,
    });
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

  private attemptReconnect() {
    const { setStatus } = useWebSocketStore.getState();

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("Max reconnection attempts reached");
      setStatus("disconnected");
      return;
    }

    setStatus("reconnecting");
    this.reconnectAttempts++;

    const delay =
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    setTimeout(() => {
      this.connect(this.connectionOptions);
    }, delay);
  }

  disconnect() {
    this.stopPing();
    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }
    useWebSocketStore.getState().reset();
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const wsClient = new AlgoraveWebSocket();
