"use client";

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsApi } from "@/lib/api/sessions";
import type {
  CreateSessionRequest,
  CreateInviteTokenRequest,
  SetDiscoverableRequest,
  JoinSessionRequest,
  LiveSessionsListResponse,
} from "@/lib/api/sessions/types";

const DEFAULT_PAGE_SIZE = 20;

export const sessionKeys = {
  all: ["sessions"] as const,
  lists: () => [...sessionKeys.all, "list"] as const,
  details: () => [...sessionKeys.all, "detail"] as const,
  detail: (id: string) => [...sessionKeys.details(), id] as const,
  live: () => [...sessionKeys.all, "live"] as const,
  lastSession: () => [...sessionKeys.all, "last"] as const,
  liveStatus: (sessionId: string) =>
    [...sessionKeys.all, "live-status", sessionId] as const,
  invites: (sessionId: string) =>
    [...sessionKeys.all, "invites", sessionId] as const,
  participants: (sessionId: string) =>
    [...sessionKeys.all, "participants", sessionId] as const,
  messages: (sessionId: string) =>
    [...sessionKeys.all, "messages", sessionId] as const,
};

export function useSessions(params?: { active_only?: boolean }) {
  return useQuery({
    queryKey: [...sessionKeys.lists(), params],
    queryFn: () => sessionsApi.list(params),
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: sessionKeys.detail(id),
    queryFn: () => sessionsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSessionRequest) => sessionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sessionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
    },
  });
}

export function useLeaveSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sessionsApi.leave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
    },
  });
}

export function useCreateInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      data,
    }: {
      sessionId: string;
      data: CreateInviteTokenRequest;
    }) => sessionsApi.createInvite(sessionId, data),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({
        queryKey: sessionKeys.invites(sessionId),
      });
    },
  });
}

export function useSessionInvites(sessionId: string) {
  return useQuery({
    queryKey: sessionKeys.invites(sessionId),
    queryFn: () => sessionsApi.listInvites(sessionId),
    enabled: !!sessionId,
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      tokenId,
    }: {
      sessionId: string;
      tokenId: string;
    }) => sessionsApi.revokeInvite(sessionId, tokenId),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({
        queryKey: sessionKeys.invites(sessionId),
      });
    },
  });
}

export function useJoinSession() {
  return useMutation({
    mutationFn: (data: JoinSessionRequest) => sessionsApi.join(data),
  });
}


export function useLiveSessions(params?: { limit?: number }) {
  return useQuery({
    queryKey: [...sessionKeys.live(), params],
    queryFn: () => sessionsApi.getLive(params),
    refetchInterval: 30000,
  });
}

export function useInfiniteLiveSessions(pageSize = DEFAULT_PAGE_SIZE) {
  return useInfiniteQuery({
    queryKey: [...sessionKeys.live(), "infinite"],
    queryFn: ({ pageParam = 0 }) =>
      sessionsApi.getLive({ limit: pageSize, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: LiveSessionsListResponse) =>
      lastPage.pagination.has_more
        ? lastPage.pagination.offset + lastPage.pagination.limit
        : undefined,
    refetchInterval: 30000,
  });
}

export function useSetDiscoverable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      data,
    }: {
      sessionId: string;
      data: SetDiscoverableRequest;
    }) => sessionsApi.setDiscoverable(sessionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.live() });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.detail(variables.sessionId),
      });
    },
  });
}

export function useSessionParticipants(sessionId: string) {
  return useQuery({
    queryKey: sessionKeys.participants(sessionId),
    queryFn: () => sessionsApi.getParticipants(sessionId),
    enabled: !!sessionId,
  });
}

export function useRemoveParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      participantId,
    }: {
      sessionId: string;
      participantId: string;
    }) => sessionsApi.removeParticipant(sessionId, participantId),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({
        queryKey: sessionKeys.participants(sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.detail(sessionId),
      });
    },
  });
}

export function useSessionMessages(
  sessionId: string,
  params?: { limit?: number }
) {
  return useQuery({
    queryKey: [...sessionKeys.messages(sessionId), params],
    queryFn: () => sessionsApi.getMessages(sessionId, params),
    enabled: !!sessionId,
  });
}

// get user's last active session (for recovery from /live page)
export function useLastSession() {
  return useQuery({
    queryKey: sessionKeys.lastSession(),
    queryFn: () => sessionsApi.getLastSession(),
    retry: false, // don't retry on 404 (no active session)
  });
}

// check if session is live (has other participants or active invite tokens)
export function useSessionLiveStatus(sessionId: string, enabled = true) {
  return useQuery({
    queryKey: sessionKeys.liveStatus(sessionId),
    queryFn: () => sessionsApi.getLiveStatus(sessionId),
    enabled: enabled && !!sessionId,
    refetchInterval: 30000, // refresh every 30 seconds
  });
}

// soft-end a live session (kick participants, revoke invites, keep code)
export function useSoftEndSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => sessionsApi.softEndSession(sessionId),
    onSuccess: (_, sessionId) => {
      // invalidate related queries
      queryClient.invalidateQueries({ queryKey: sessionKeys.live() });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.liveStatus(sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.participants(sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.invites(sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.detail(sessionId),
      });
    },
  });
}
