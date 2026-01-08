import type { Pagination, PaginationParams } from '../strudels/types';

export type { Pagination, PaginationParams };

export type SessionRole = "host" | "co-author" | "viewer";
export type ParticipantStatus = "active" | "left";

export interface Participant {
  id: string;
  user_id?: string;
  display_name: string;
  role: SessionRole;
  status: ParticipantStatus;
  joined_at: string;
  left_at?: string;
}

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

export interface UpdateSessionCodeRequest {
  code: string;
}

export interface UpdateSessionCodeResponse {
  code: string;
  message: string;
}

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

export interface JoinSessionRequest {
  invite_token: string;
  display_name?: string;
}

export interface JoinSessionResponse {
  session_id: string;
  role: SessionRole;
  display_name: string;
}

export interface SetDiscoverableRequest {
  is_discoverable: boolean;
}

export interface LiveSession {
  id: string;
  title: string;
  participant_count: number;
  is_member: boolean;
  created_at: string;
  last_activity: string;
}

export interface LiveSessionsListResponse {
  sessions: LiveSession[];
  pagination: Pagination;
}

export interface SessionsListResponse {
  sessions: Session[];
}

export interface ParticipantsListResponse {
  participants: Participant[];
}

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

export interface MessageResponse {
  message: string;
}

export interface SoftEndSessionResponse {
  message: string;
  participants_kicked: number;
  invites_revoked: boolean;
}

export interface LiveStatusResponse {
  is_live: boolean;
  participant_count: number;
  has_active_invite_tokens: boolean;
}
