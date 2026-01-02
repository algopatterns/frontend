import type { Strudel } from "../strudels/types";

// Session roles
export type SessionRole = "host" | "co-author" | "viewer";

// Participant status
export type ParticipantStatus = "active" | "left";

// Participant in a session
export interface Participant {
  id: string;
  user_id?: string;
  display_name: string;
  role: SessionRole;
  status: ParticipantStatus;
  joined_at: string;
  left_at?: string;
}

// Full session details
export interface Session {
  id: string;
  host_user_id: string;
  title: string;
  code: string;
  is_active: boolean;
  is_discoverable: boolean;
  participants: Participant[];
  created_at: string;
  ended_at?: string;
  last_activity: string;
}

// Create session request/response
export interface CreateSessionRequest {
  title: string;
  code?: string;
  is_discoverable?: boolean;
}

export interface CreateSessionResponse {
  id: string;
  host_user_id: string;
  title: string;
  code: string;
  is_active: boolean;
  is_discoverable: boolean;
  created_at: string;
  last_activity: string;
}

// Update session code
export interface UpdateSessionCodeRequest {
  code: string;
}

export interface UpdateSessionCodeResponse {
  code: string;
  message: string;
}

// Invite tokens
export interface CreateInviteTokenRequest {
  role: "co-author" | "viewer";
  max_uses?: number;
  expires_at?: string;
}

export interface InviteToken {
  id: string;
  session_id: string;
  token: string;
  role: SessionRole;
  max_uses: number;
  uses_count: number;
  expires_at: string;
  created_at: string;
}

export interface InviteTokensListResponse {
  tokens: InviteToken[];
}

// Join session
export interface JoinSessionRequest {
  invite_token: string;
  display_name?: string;
}

export interface JoinSessionResponse {
  session_id: string;
  role: SessionRole;
  display_name: string;
}

// Transfer session to strudel
export interface TransferSessionRequest {
  session_id: string;
  title: string;
}

export interface TransferSessionResponse {
  strudel_id: string;
  strudel: Strudel;
  message: string;
}

// Discoverable/live sessions
export interface SetDiscoverableRequest {
  is_discoverable: boolean;
}

export interface LiveSession {
  id: string;
  title: string;
  participant_count: number;
  created_at: string;
  last_activity: string;
}

export interface LiveSessionsListResponse {
  sessions: LiveSession[];
}

// Session list response
export interface SessionsListResponse {
  sessions: Session[];
}

// Participants list
export interface ParticipantsListResponse {
  participants: Participant[];
}

// Session messages (chat history)
export interface SessionMessage {
  id: string;
  sessionID: string;
  userID?: string;
  role: "user" | "assistant";
  messageType: "user_prompt" | "ai_response" | "chat";
  content: string;
  createdAt: string;
}

export interface MessagesResponse {
  messages: SessionMessage[];
}

// Generic message response
export interface MessageResponse {
  message: string;
}
