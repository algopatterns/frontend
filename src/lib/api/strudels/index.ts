import { apiClient } from '../client';
import type {
  Strudel,
  CreateStrudelRequest,
  UpdateStrudelRequest,
  StrudelsListResponse,
  PaginationParams,
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

  listPublic: (params?: PaginationParams) => {
    const searchParams = new URLSearchParams();

    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const query = searchParams.toString();
    return apiClient.get<StrudelsListResponse>(
      `/api/v1/public/strudels${query ? `?${query}` : ''}`
    );
  },

  getPublic: (id: string) => {
    const url = `/api/v1/public/strudels/${id}`;
    return apiClient.get<Strudel>(url);
  },
};
