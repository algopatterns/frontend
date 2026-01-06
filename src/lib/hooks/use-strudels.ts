'use client';

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { strudelsApi } from '@/lib/api/strudels';
import type {
  CreateStrudelRequest,
  UpdateStrudelRequest,
  StrudelsListResponse,
  StrudelFilterParams,
} from '@/lib/api/strudels/types';

const DEFAULT_PAGE_SIZE = 20;

export const strudelKeys = {
  all: ['strudels'] as const,
  lists: () => [...strudelKeys.all, 'list'] as const,
  details: () => [...strudelKeys.all, 'detail'] as const,
  detail: (id: string) => [...strudelKeys.details(), id] as const,
  public: () => [...strudelKeys.all, 'public'] as const,
};

export function useStrudels() {
  return useQuery({
    queryKey: strudelKeys.lists(),
    queryFn: () => strudelsApi.list(),
  });
}

export function useInfiniteStrudels(pageSize = DEFAULT_PAGE_SIZE) {
  return useInfiniteQuery({
    queryKey: [...strudelKeys.lists(), 'infinite'],
    queryFn: ({ pageParam = 0 }) =>
      strudelsApi.list({ limit: pageSize, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: StrudelsListResponse) =>
      lastPage.pagination.has_more
        ? lastPage.pagination.offset + lastPage.pagination.limit
        : undefined,
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
    mutationFn: ({ id, data }: { id: string; data: UpdateStrudelRequest }) => {
      return strudelsApi.update(id, data);
    },

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

export function useInfinitePublicStrudels(
  filters?: Omit<StrudelFilterParams, 'limit' | 'offset'>,
  pageSize = DEFAULT_PAGE_SIZE
) {
  return useInfiniteQuery({
    initialPageParam: 0,
    queryKey: [...strudelKeys.public(), 'infinite', filters],
    queryFn: ({ pageParam = 0 }) => {
      return strudelsApi.listPublic({
        limit: pageSize,
        offset: pageParam,
        search: filters?.search,
        tags: filters?.tags,
      });
    },
    getNextPageParam: (lastPage: StrudelsListResponse) =>
      lastPage.pagination.has_more
        ? lastPage.pagination.offset + lastPage.pagination.limit
        : undefined,
  });
}

export function usePublicTags() {
  return useQuery({
    queryKey: [...strudelKeys.public(), 'tags'],
    queryFn: () => strudelsApi.getPublicTags(),
  });
}

export function usePublicStrudel(id: string) {
  return useQuery({
    queryKey: [...strudelKeys.public(), 'detail', id],
    queryFn: () => strudelsApi.getPublic(id),
    enabled: !!id,
  });
}

export function useStrudelStats(id: string | null) {
  return useQuery({
    queryKey: [...strudelKeys.public(), 'stats', id],
    queryFn: () => strudelsApi.getStats(id!),
    enabled: !!id,
  });
}
