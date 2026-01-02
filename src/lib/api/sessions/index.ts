import { apiClient } from "../client";
import type {
  CreateSessionRequest,
  CreateSessionResponse,
  CreateInviteTokenRequest,
  InviteToken,
  InviteTokensListResponse,
  TransferSessionRequest,
  TransferSessionResponse,
  JoinSessionRequest,
  JoinSessionResponse,
  SetDiscoverableRequest,
  Session,
  SessionsListResponse,
  LiveSessionsListResponse,
  UpdateSessionCodeRequest,
  UpdateSessionCodeResponse,
  ParticipantsListResponse,
  MessagesResponse,
  MessageResponse,
} from "./types";

export const sessionsApi = {
  // Session CRUD
  list: (params?: { active_only?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.active_only) searchParams.set("active_only", "true");

    const query = searchParams.toString();
    return apiClient.get<SessionsListResponse>(
      `/api/v1/sessions${query ? `?${query}` : ""}`,
      { requireAuth: true }
    );
  },

  get: (id: string) =>
    apiClient.get<Session>(`/api/v1/sessions/${id}`, {
      requireAuth: true,
    }),

  create: (data: CreateSessionRequest) =>
    apiClient.post<CreateSessionResponse>("/api/v1/sessions", data, {
      requireAuth: true,
    }),

  updateCode: (id: string, data: UpdateSessionCodeRequest) =>
    apiClient.put<UpdateSessionCodeResponse>(`/api/v1/sessions/${id}`, data, {
      requireAuth: true,
    }),

  delete: (id: string) =>
    apiClient.delete<MessageResponse>(`/api/v1/sessions/${id}`, {
      requireAuth: true,
    }),

  leave: (id: string) =>
    apiClient.post<MessageResponse>(
      `/api/v1/sessions/${id}/leave`,
      undefined,
      { requireAuth: true }
    ),

  // Invite tokens
  createInvite: (sessionId: string, data: CreateInviteTokenRequest) =>
    apiClient.post<InviteToken>(`/api/v1/sessions/${sessionId}/invite`, data, {
      requireAuth: true,
    }),

  listInvites: (sessionId: string) =>
    apiClient.get<InviteTokensListResponse>(
      `/api/v1/sessions/${sessionId}/invite`,
      { requireAuth: true }
    ),

  revokeInvite: (sessionId: string, tokenId: string) =>
    apiClient.delete<MessageResponse>(
      `/api/v1/sessions/${sessionId}/invite/${tokenId}`,
      { requireAuth: true }
    ),

  // Join session
  join: (data: JoinSessionRequest) =>
    apiClient.post<JoinSessionResponse>("/api/v1/sessions/join", data),

  // Transfer to strudel
  transfer: (data: TransferSessionRequest) =>
    apiClient.post<TransferSessionResponse>("/api/v1/sessions/transfer", data, {
      requireAuth: true,
    }),

  // Live/discoverable sessions
  getLive: (params?: { limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", params.limit.toString());

    const query = searchParams.toString();
    return apiClient.get<LiveSessionsListResponse>(
      `/api/v1/sessions/live${query ? `?${query}` : ""}`
    );
  },

  setDiscoverable: (sessionId: string, data: SetDiscoverableRequest) =>
    apiClient.put<Session>(`/api/v1/sessions/${sessionId}/discoverable`, data, {
      requireAuth: true,
    }),

  // Participants
  getParticipants: (sessionId: string) =>
    apiClient.get<ParticipantsListResponse>(
      `/api/v1/sessions/${sessionId}/participants`,
      { requireAuth: true }
    ),

  removeParticipant: (sessionId: string, participantId: string) =>
    apiClient.delete<MessageResponse>(
      `/api/v1/sessions/${sessionId}/participants/${participantId}`,
      { requireAuth: true }
    ),

  // Messages
  getMessages: (sessionId: string, params?: { limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", params.limit.toString());

    const query = searchParams.toString();
    return apiClient.get<MessagesResponse>(
      `/api/v1/sessions/${sessionId}/messages${query ? `?${query}` : ""}`,
      { requireAuth: true }
    );
  },
};
