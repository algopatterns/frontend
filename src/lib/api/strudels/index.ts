import { apiClient } from '../client';
import type {
  Strudel,
  CreateStrudelRequest,
  UpdateStrudelRequest,
  StrudelsListResponse,
  PaginationParams,
  StrudelFilterParams,
  TagsResponse,
  StrudelStatsResponse,
} from './types';
import type { MessageResponse } from '../sessions/types';

export const strudelsApi = {
  list: (params?: PaginationParams) => {
    const searchParams = new URLSearchParams();

    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const query = searchParams.toString();
    const url = `/api/v1/strudels${query ? `?${query}` : ''}`;

    return apiClient.get<StrudelsListResponse>(url, {
      requireAuth: true,
    });
  },

  get: (id: string) => {
    const url = `/api/v1/strudels/${id}`;
    return apiClient.get<Strudel>(url, {
      requireAuth: true,
    });
  },

  create: (data: CreateStrudelRequest) => {
    const url = '/api/v1/strudels';
    return apiClient.post<Strudel>(url, data, {
      requireAuth: true,
    });
  },

  update: (id: string, data: UpdateStrudelRequest) => {
    const url = `/api/v1/strudels/${id}`;
    return apiClient.put<Strudel>(url, data, {
      requireAuth: true,
    });
  },

  delete: (id: string) => {
    const url = `/api/v1/strudels/${id}`;
    return apiClient.delete<MessageResponse>(url, {
      requireAuth: true,
    });
  },

  listPublic: (params?: StrudelFilterParams) => {
    const searchParams = new URLSearchParams();

    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.tags?.length) searchParams.set('tags', params.tags.join(','));

    const query = searchParams.toString();
    return apiClient.get<StrudelsListResponse>(
      `/api/v1/public/strudels${query ? `?${query}` : ''}`
    );
  },

  getPublicTags: () => {
    return apiClient.get<TagsResponse>('/api/v1/public/strudels/tags');
  },

  getPublic: (id: string) => {
    const url = `/api/v1/public/strudels/${id}`;
    return apiClient.get<Strudel>(url);
  },

  getStats: (id: string) => {
    const url = `/api/v1/public/strudels/${id}/stats`;
    return apiClient.get<StrudelStatsResponse>(url);
  },
};
