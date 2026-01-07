import type { SessionRole } from "@/lib/api/sessions/types";

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting";

export type ClientMessageType =
  | "code_update"
  | "chat_message"
  | "play"
  | "stop"
  | "ping";

export type ServerMessageType =
  | "session_state"
  | "code_update"
  | "chat_message"
  | "user_joined"
  | "user_left"
  | "play"
  | "stop"
  | "session_ended"
  | "paste_lock_changed"
  | "error"
  | "pong";

export interface WebSocketMessage<T = unknown> {
  type: ServerMessageType | ClientMessageType;
  session_id: string;
  user_id?: string;
  timestamp: string;
  payload: T;
}

// code update source types
export type CodeUpdateSource = 'typed' | 'loaded_strudel' | 'forked' | 'paste';

// client payloads
export interface CodeUpdatePayload {
  code: string;
  cursor_line?: number;
  cursor_col?: number;
  source?: CodeUpdateSource;
}

export interface ChatMessagePayload {
  message: string;
}

// server payloads
export interface SessionStateChatMessage {
  display_name: string;
  avatar_url: string;
  content: string;
  timestamp: number;
}

export interface SessionStatePayload {
  code: string;
  your_role: SessionRole;
  chat_history?: SessionStateChatMessage[];
  participants: Array<{
    user_id: string;
    display_name: string;
    role: SessionRole;
  }>;
  request_id?: string;
}

export interface CodeUpdateBroadcastPayload {
  code: string;
  cursor_line?: number;
  cursor_col?: number;
  display_name: string;
}

export interface ChatMessageBroadcastPayload {
  message: string;
  display_name: string;
}

export interface UserJoinedPayload {
  user_id: string;
  display_name: string;
  role: SessionRole;
}

export interface UserLeftPayload {
  user_id: string;
  display_name: string;
}

export interface ErrorPayload {
  error: string;
  message: string;
  details?: string;
  request_id?: string;
}

// chat message for UI
export interface ChatMessage {
  id: string;
  type: "user" | "assistant" | "chat" | "system";
  content: string;
  displayName?: string;
  isActionable?: boolean;
  isCodeResponse?: boolean;
  isAIRequest?: boolean;
  clarifyingQuestions?: string[];
  timestamp: string;
}

// playback control payloads
export interface PlayPayload {
  display_name: string;
}

export interface StopPayload {
  display_name: string;
}

export interface SessionEndedPayload {
  reason?: string;
}

export interface PasteLockChangedPayload {
  locked: boolean;
  reason?: string; // "paste_detected", "edits_sufficient", "ttl_expired"
}
