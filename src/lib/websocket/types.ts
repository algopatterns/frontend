import type { SessionRole } from "@/lib/api/sessions/types";

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting";

export type ClientMessageType =
  | "code_update"
  | "agent_request"
  | "chat_message"
  | "play"
  | "stop"
  | "ping";

export type ServerMessageType =
  | "session_state"
  | "code_update"
  | "agent_request"
  | "agent_response"
  | "chat_message"
  | "user_joined"
  | "user_left"
  | "play"
  | "stop"
  | "session_ended"
  | "error"
  | "pong";

export interface WebSocketMessage<T = unknown> {
  type: ServerMessageType | ClientMessageType;
  session_id: string;
  user_id?: string;
  timestamp: string;
  payload: T;
}

// client payloads
export interface CodeUpdatePayload {
  code: string;
  cursor_line?: number;
  cursor_col?: number;
}

export interface AgentRequestPayload {
  user_query: string;
  editor_state?: string;
  conversation_history?: Array<{ role: string; content: string }>;
  provider?: "anthropic" | "openai";
  provider_api_key?: string;
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
  conversation_history?: Array<{ role: string; content: string }>;
  participants: Array<{
    user_id: string;
    display_name: string;
    role: SessionRole;
  }>;
}

export interface CodeUpdateBroadcastPayload {
  code: string;
  cursor_line?: number;
  cursor_col?: number;
  display_name: string;
}

export interface AgentRequestBroadcastPayload {
  user_query: string;
  display_name: string;
}

export interface AgentResponsePayload {
  code?: string;
  is_actionable: boolean;
  is_code_response: boolean;
  clarifying_questions?: string[];
  docs_retrieved: number;
  examples_retrieved: number;
  model: string;
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
}

// chat message for UI
export interface ChatMessage {
  id: string;
  type: "user" | "assistant" | "chat" | "system";
  content: string;
  displayName?: string;
  isActionable?: boolean;
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
