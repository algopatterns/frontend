"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { strudelsApi } from "@/lib/api/strudels";
import type {
  CreateStrudelRequest,
  UpdateStrudelRequest,
} from "@/lib/api/strudels/types";

export const strudelKeys = {
  all: ["strudels"] as const,
  lists: () => [...strudelKeys.all, "list"] as const,
  details: () => [...strudelKeys.all, "detail"] as const,
  detail: (id: string) => [...strudelKeys.details(), id] as const,
  public: () => [...strudelKeys.all, "public"] as const,
};

export function useStrudels() {
  return useQuery({
    queryKey: strudelKeys.lists(),
    queryFn: () => strudelsApi.list(),
  });
}

export function useStrudel(id: string) {
  return useQuery({
    queryKey: strudelKeys.detail(id),
    queryFn: () => strudelsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateStrudel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStrudelRequest) => strudelsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strudelKeys.lists() });
    },
  });
}

export function useUpdateStrudel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStrudelRequest }) =>
      strudelsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: strudelKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: strudelKeys.lists() });
    },
  });
}

export function useDeleteStrudel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => strudelsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strudelKeys.lists() });
    },
  });
}

export function usePublicStrudels(params?: { limit?: number }) {
  return useQuery({
    queryKey: [...strudelKeys.public(), params],
    queryFn: () => strudelsApi.listPublic(params),
  });
}
