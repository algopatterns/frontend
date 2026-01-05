import { useAuthStore } from "@/lib/stores/auth";
import { useWebSocketStore } from "@/lib/stores/websocket";
import { useEditorStore } from "@/lib/stores/editor";
import { storage } from "@/lib/utils/storage";
import { processSessionState, type SessionStateContext } from "./session-state-machine";
import { WS_BASE_URL, WEBSOCKET, EDITOR } from "@/lib/constants";
import type {
  WebSocketMessage,
  SessionStatePayload,
  CodeUpdateBroadcastPayload,
  ChatMessageBroadcastPayload,
  UserJoinedPayload,
  UserLeftPayload,
  ErrorPayload,
  PlayPayload,
  StopPayload,
  SessionEndedPayload,
} from "./types";

interface ConnectionOptions {
  sessionId?: string;
  previousSessionId?: string;
  inviteToken?: string;
  displayName?: string;
}

interface PendingRequest<T = unknown> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

const REQUEST_TIMEOUT_MS = 30000;

class AlgoraveWebSocket {
  private ws: WebSocket | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private connectionOptions: ConnectionOptions = {};
  private shouldReconnect = true;
  private onConnectedCallbacks: Array<() => void> = [];

  // playback control callbacks
  private onPlayCallback: ((displayName: string) => void) | null = null;
  private onStopCallback: ((displayName: string) => void) | null = null;
  private onSessionEndedCallback: ((reason?: string) => void) | null = null;

  // flag to skip code restoration in session_state when forking
  public skipCodeRestoration = false;

  // generic request/reply correlation
  // maps request_id -> pending request with resolve/reject/timeout
  private pendingRequests = new Map<string, PendingRequest>();

  // track current switch_strudel request to prevent race conditions
  private currentSwitchRequestId: string | null = null;

  // track strudel ID from current switch_strudel (for draft saving before store updates)
  private currentSwitchStrudelId: string | null = null;

  // track initial load to distinguish from reconnects for session_state
  private initialLoadComplete = false;

  // register callbacks for playback control events
  // returns cleanup function to unregister
  onPlay(callback: (displayName: string) => void): () => void {
    this.onPlayCallback = callback;

    return () => {
      if (this.onPlayCallback === callback) {
        this.onPlayCallback = null;
      }
    };
  }

  onStop(callback: (displayName: string) => void): () => void {
    this.onStopCallback = callback;

    return () => {
      if (this.onStopCallback === callback) {
        this.onStopCallback = null;
      }
    };
  }

  onSessionEnded(callback: (reason?: string) => void): () => void {
    this.onSessionEndedCallback = callback;

    return () => {
      if (this.onSessionEndedCallback === callback) {
        this.onSessionEndedCallback = null;
      }
    };
  }

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
    const { setStatus, setError, setSessionStateReceived } = useWebSocketStore.getState();

    setStatus("connecting");
    setError(null);
    setSessionStateReceived(false);

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

      // fallback to localStorage if we never got session_state
      if (!this.initialLoadComplete) {
        this.restoreFromLocalStorage();
      }
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
      setSessionStateReceived,
      clearMessages,
    } = useWebSocketStore.getState();
    
    const { setCode, setConversationHistory, currentStrudelId, currentDraftId, setCurrentDraftId } = useEditorStore.getState();

    switch (message.type) {
      case "session_state": {
        const payload = message.payload as SessionStatePayload;
        const hasToken = !!useAuthStore.getState().token;

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

        // restore chat history
        clearMessages();

        if (payload.chat_history?.length) {
          for (const msg of payload.chat_history) {
            addMessage({
              id: crypto.randomUUID(),
              type: "chat",
              content: msg.content,
              displayName: msg.display_name,
              timestamp: (() => {
                // handle string timestamps, seconds, or milliseconds
                if (typeof msg.timestamp === "string") {
                  return new Date(msg.timestamp).toISOString();
                }
                
                // if numeric and < 1e12, assume seconds
                return new Date(
                  msg.timestamp < 1e12 ? msg.timestamp * 1000 : msg.timestamp
                ).toISOString();
              })(),
            });
          }
        }

        // restore conversation history (for AI context and UI display)
        if (payload.conversation_history?.length) {
          setConversationHistory(payload.conversation_history);

          // sort by timestamp and add to messages for UI display
          const sortedHistory = [...payload.conversation_history].sort(
            (a, b) => a.timestamp - b.timestamp
          );

          for (const msg of sortedHistory) {
            addMessage({
              id: msg.id,
              type: msg.role === "assistant" ? "assistant" : "user",
              content: msg.content,
              displayName: msg.display_name,
              isAIRequest: msg.role === "user",
              isCodeResponse: msg.is_code_response,
              timestamp: new Date(msg.timestamp).toISOString(),
            });
          }
        }

        // use state machine to decide what to do with code
        const storedDraftId = storage.getCurrentDraftId();
        const requestId = payload.request_id ?? null;

        const ctx: SessionStateContext = {
          hasToken,
          currentStrudelId: this.currentSwitchStrudelId || currentStrudelId,
          currentDraftId: currentDraftId ?? null,
          latestDraft: storage.getLatestDraft(),
          currentDraft: storedDraftId ? storage.getDraft(storedDraftId) : null,
          initialLoadComplete: this.initialLoadComplete,
          skipCodeRestoration: this.skipCodeRestoration,
          requestId,
          currentSwitchRequestId: this.currentSwitchRequestId,
          payload,
          serverCode: payload.code || null,
          defaultCode: EDITOR.DEFAULT_CODE,
        };

        const decision = processSessionState(ctx);

        // log decision for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log('[SessionState] Decision:', {
            action: decision.codeAction.type,
            reason: decision.codeAction.reason,
            draftSave: decision.draftSave,
            debug: decision.debug.context,
          });
        }

        // clear skip flag after reading it
        if (this.skipCodeRestoration) {
          this.skipCodeRestoration = false;
        }

        // execute code action
        switch (decision.codeAction.type) {
          case 'RESTORE_DRAFT': {
            const draft = decision.codeAction.draft;
            setCode(draft.code, true);
            setCurrentDraftId(draft.id);
            if (draft.conversationHistory?.length) {
              setConversationHistory(draft.conversationHistory.map((msg, i) => ({
                id: `restored-${i}`,
                role: msg.role,
                content: msg.content,
                timestamp: draft.updatedAt,
                is_code_response: msg.role === 'assistant',
              })));
            }
            // sync restored draft to server
            this.sendCodeUpdate(draft.code);
            break;
          }

          case 'USE_SERVER_CODE': {
            setCode(decision.codeAction.code, true);
            // restore conversation history from server
            if (payload.conversation_history?.length) {
              setConversationHistory(payload.conversation_history.map((msg, i) => ({
                id: `server-${i}`,
                role: msg.role,
                content: msg.content,
                timestamp: Date.now(),
                is_code_response: msg.role === 'assistant',
              })));
            }
            break;
          }

          case 'USE_DEFAULT_CODE': {
            setCode(decision.codeAction.code, true);
            // sync default code to server
            this.sendCodeUpdate(decision.codeAction.code);
            break;
          }

          case 'SKIP_CODE_UPDATE':
            // do nothing
            break;
        }

        // execute draft save decision
        if (decision.draftSave.shouldSave) {
          const { draftId, code } = decision.draftSave;

          // set draft ID in store if it's a new draft (not a strudel backup)
          if (!currentDraftId && !this.currentSwitchStrudelId && !currentStrudelId) {
            setCurrentDraftId(draftId);
          }

          storage.setDraft({
            id: draftId,
            code,
            conversationHistory: payload.conversation_history?.map(msg => ({
              role: msg.role,
              content: msg.content,
            })) || [],
            updatedAt: Date.now(),
          });
        }

        // mark initial load complete
        this.initialLoadComplete = true;

        // clear switch tracking
        const isCurrentSwitchResponse = requestId && requestId === this.currentSwitchRequestId;
        if (isCurrentSwitchResponse) {
          this.currentSwitchRequestId = null;
          this.currentSwitchStrudelId = null;
        }

        // resolve pending request if this is a response to switch_strudel
        if (requestId) {
          this.resolvePendingRequest(requestId, payload);
        }

        // only store session ID for authenticated users
        if (hasToken) {
          storage.setSessionId(message.session_id);
        }

        setSessionStateReceived(true);
        break;
      }

      case "code_update": {
        const payload = message.payload as CodeUpdateBroadcastPayload;
        setCode(payload.code, true);
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
        removeParticipant(payload.user_id, payload.display_name);

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

        // reject pending request if error has matching request_id
        if (payload.request_id) {
          const pending = this.pendingRequests.get(payload.request_id);
          if (pending) {
            clearTimeout(pending.timeoutId);
            this.pendingRequests.delete(payload.request_id);
            pending.reject(new Error(payload.message));
          }
        }

        break;
      }

      case "play": {
        const payload = message.payload as PlayPayload;

        if (this.onPlayCallback) {
          this.onPlayCallback(payload.display_name);
        }

        addMessage({
          id: crypto.randomUUID(),
          type: "system",
          content: `${payload.display_name} started playback`,
          timestamp: message.timestamp,
        });

        break;
      }

      case "stop": {
        const payload = message.payload as StopPayload;

        if (this.onStopCallback) {
          this.onStopCallback(payload.display_name);
        }

        addMessage({
          id: crypto.randomUUID(),
          type: "system",
          content: `${payload.display_name} stopped playback`,
          timestamp: message.timestamp,
        });

        break;
      }

      case "session_ended": {
        const payload = message.payload as SessionEndedPayload;

        if (this.onSessionEndedCallback) {
          this.onSessionEndedCallback(payload.reason);
        }

        addMessage({
          id: crypto.randomUUID(),
          type: "system",
          content: payload.reason || "Session ended by host",
          timestamp: message.timestamp,
        });

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

  /**
   * Send a message and wait for a response with matching request_id.
   * Returns a Promise that resolves with the response payload.
   * Rejects on timeout or disconnect.
   */
  sendWithReply<T>(type: string, payload: Record<string, unknown>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected"));
        return;
      }

      const requestId = crypto.randomUUID();

      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timeout: ${type}`));
      }, REQUEST_TIMEOUT_MS);

      this.pendingRequests.set(requestId, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeoutId,
      });

      this.send(type, { ...payload, request_id: requestId });
    });
  }

  /**
   * Resolve a pending request by its request_id.
   * Called from handleMessage when a response contains a request_id.
   */
  private resolvePendingRequest(requestId: string, payload: unknown): boolean {
    const pending = this.pendingRequests.get(requestId);
    if (pending) {
      clearTimeout(pending.timeoutId);
      this.pendingRequests.delete(requestId);
      pending.resolve(payload);
      return true;
    }
    return false;
  }

  /**
   * Reject all pending requests (called on disconnect).
   */
  private rejectAllPendingRequests(error: Error) {
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timeoutId);
      pending.reject(error);
    }
    this.pendingRequests.clear();
  }

  sendCodeUpdate(code: string, cursorLine?: number, cursorCol?: number) {
    this.send("code_update", { code, cursor_line: cursorLine, cursor_col: cursorCol });
  }

  sendChatMessage(message: string) {
    this.send("chat_message", { message });
  }

  sendPlay() {
    this.send("play", {});
  }

  sendStop() {
    this.send("stop", {});
  }

  /**
   * Switch strudel context within the same session.
   * - Pass strudelId to load a saved strudel (auth users only)
   * - Pass null for fresh scratch context
   * - Pass null with code/conversationHistory to restore from localStorage
   * Returns a Promise that resolves when session_state is received.
   * Cancels any in-flight switch request to prevent race conditions.
   */
  sendSwitchStrudel(
    strudelId: string | null,
    code?: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<SessionStatePayload> {
    // cancel any in-flight switch request
    if (this.currentSwitchRequestId) {
      const pending = this.pendingRequests.get(this.currentSwitchRequestId);
      if (pending) {
        clearTimeout(pending.timeoutId);
        pending.reject(new Error("Superseded by new switch request"));
        this.pendingRequests.delete(this.currentSwitchRequestId);
      }
    }

    // generate request ID and track as current
    const requestId = crypto.randomUUID();
    this.currentSwitchRequestId = requestId;
    this.currentSwitchStrudelId = strudelId;

    const payload: Record<string, unknown> = {
      strudel_id: strudelId,
      request_id: requestId,
    };

    if (code !== undefined) {
      payload.code = code;
    }

    if (conversationHistory !== undefined) {
      payload.conversation_history = conversationHistory;
    }

    // manually handle request tracking (don't use sendWithReply since we need custom ID)
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.currentSwitchRequestId = null;
        reject(new Error("WebSocket not connected"));
        return;
      }

      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        if (this.currentSwitchRequestId === requestId) {
          this.currentSwitchRequestId = null;
        }
        reject(new Error("Request timeout: switch_strudel"));
      }, REQUEST_TIMEOUT_MS);

      this.pendingRequests.set(requestId, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeoutId,
      });

      this.send("switch_strudel", payload);
    });
  }

  /**
   * Restore editor state from localStorage when WS connection fails.
   * Used as fallback so user isn't blocked from working.
   */
  private restoreFromLocalStorage() {
    const { setCode, setCurrentDraftId, setConversationHistory } = useEditorStore.getState();
    const latestDraft = storage.getLatestDraft();

    if (latestDraft) {
      setCode(latestDraft.code, true);
      setCurrentDraftId(latestDraft.id);
      if (latestDraft.conversationHistory?.length) {
        setConversationHistory(latestDraft.conversationHistory.map((msg, i) => ({
          id: `restored-${i}`,
          role: msg.role,
          content: msg.content,
          timestamp: latestDraft.updatedAt,
          is_code_response: msg.role === 'assistant',
        })));
      }
    }
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
    // reject all pending requests
    this.rejectAllPendingRequests(new Error("WebSocket disconnected"));
    // reset state for fresh start on next connect
    this.initialLoadComplete = false;
    this.currentSwitchRequestId = null;
    this.currentSwitchStrudelId = null;
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
