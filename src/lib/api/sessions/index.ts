import { apiClient } from '../client';
import type {
  CreateSessionRequest,
  CreateSessionResponse,
  CreateInviteTokenRequest,
  InviteToken,
  InviteTokensListResponse,
  JoinSessionRequest,
  JoinSessionResponse,
  SetDiscoverableRequest,
  Session,
  SessionsListResponse,
  LiveSessionsListResponse,
  LiveSession,
  UpdateSessionCodeRequest,
  UpdateSessionCodeResponse,
  ParticipantsListResponse,
  MessagesResponse,
  MessageResponse,
  PaginationParams,
  SoftEndSessionResponse,
  LiveStatusResponse,
} from './types';

export const sessionsApi = {
  list: (params?: { active_only?: boolean }) => {
    const searchParams = new URLSearchParams();

    if (params?.active_only) {
      searchParams.set('active_only', 'true');
    }

    const query = searchParams.toString();
    const url = `/api/v1/sessions${query ? `?${query}` : ''}`;
    
    return apiClient.get<SessionsListResponse>(url, {
      requireAuth: true,
    });
  },

  get: (id: string) => {
    return apiClient.get<Session>(`/api/v1/sessions/${id}`, {
      requireAuth: true,
    });
  },

  create: (data: CreateSessionRequest) => {
    return apiClient.post<CreateSessionResponse>('/api/v1/sessions', data, {
      requireAuth: true,
    });
  },

  updateCode: (id: string, data: UpdateSessionCodeRequest) => {
    return apiClient.put<UpdateSessionCodeResponse>(`/api/v1/sessions/${id}`, data, {
      requireAuth: true,
    });
  },

  delete: (id: string) => {
    return apiClient.delete<MessageResponse>(`/api/v1/sessions/${id}`, {
      requireAuth: true,
    });
  },

  leave: (id: string) => {
    return apiClient.post<MessageResponse>(`/api/v1/sessions/${id}/leave`, undefined, {
      requireAuth: true,
    });
  },

  // invite tokens
  createInvite: (sessionId: string, data: CreateInviteTokenRequest) => {
    const url = `/api/v1/sessions/${sessionId}/invite`;
    return apiClient.post<InviteToken>(url, data, {
      requireAuth: true,
    });
  },

  listInvites: (sessionId: string) => {
    const url = `/api/v1/sessions/${sessionId}/invite`;
    return apiClient.get<InviteTokensListResponse>(url, { requireAuth: true });
  },

  revokeInvite: (sessionId: string, tokenId: string) => {
    const url = `/api/v1/sessions/${sessionId}/invite/${tokenId}`;
    return apiClient.delete<MessageResponse>(url, {
      requireAuth: true,
    });
  },

  join: (data: JoinSessionRequest) => {
    return apiClient.post<JoinSessionResponse>('/api/v1/sessions/join', data);
  },

  getLive: (params?: PaginationParams) => {
    const searchParams = new URLSearchParams();

    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const query = searchParams.toString();
    const url = `/api/v1/sessions/live${query ? `?${query}` : ''}`;

    return apiClient.get<LiveSessionsListResponse>(url);
  },

  setDiscoverable: (sessionId: string, data: SetDiscoverableRequest) => {
    const url = `/api/v1/sessions/${sessionId}/discoverable`;
    return apiClient.put<Session>(url, data, {
      requireAuth: true,
    });
  },

  getParticipants: (sessionId: string) => {
    const url = `/api/v1/sessions/${sessionId}/participants`;
    return apiClient.get<ParticipantsListResponse>(url, { requireAuth: true });
  },

  removeParticipant: (sessionId: string, participantId: string) => {
    const url = `/api/v1/sessions/${sessionId}/participants/${participantId}`;
    return apiClient.delete<MessageResponse>(url, { requireAuth: true });
  },

  getMessages: (sessionId: string, params?: { limit?: number }) => {
    const searchParams = new URLSearchParams();

    if (params?.limit) {
      searchParams.set('limit', params.limit.toString());
    }

    const query = searchParams.toString();
    const url = `/api/v1/sessions/${sessionId}/messages${query ? `?${query}` : ''}`;

    return apiClient.get<MessagesResponse>(url, { requireAuth: true });
  },

  // get user's last active session (for recovery)
  getLastSession: () => {
    return apiClient.get<LiveSession>('/api/v1/sessions/last', {
      requireAuth: true,
    });
  },

  // soft-end a live session (kick participants, revoke invites, keep code)
  softEndSession: (sessionId: string) => {
    return apiClient.post<SoftEndSessionResponse>(
      `/api/v1/sessions/${sessionId}/end-live`,
      undefined,
      { requireAuth: true }
    );
  },

  // check if session is live (has other participants or active invite tokens)
  getLiveStatus: (sessionId: string) => {
    return apiClient.get<LiveStatusResponse>(
      `/api/v1/sessions/${sessionId}/live-status`,
      { requireAuth: true }
    );
  },
};
