import { apiClient } from '../client';
import { API_BASE_URL } from '@/lib/constants';
import type { UserResponse, UpdateProfileRequest } from './types';
import type { MessageResponse } from '../sessions/types';

export const authApi = {
  getMe: () => {
    return apiClient.get<UserResponse>('/api/v1/auth/me', { requireAuth: true });
  },

  updateMe: (data: UpdateProfileRequest) => {
    return apiClient.put<UserResponse>('/api/v1/auth/me', data, {
      requireAuth: true,
    });
  },

  getOAuthUrl: (provider: 'github' | 'google' | 'apple') => {
    const callbackUrl = `${window.location.origin}/callback/${provider}`;
    return `${API_BASE_URL}/api/v1/auth/${provider}?redirect_url=${encodeURIComponent(callbackUrl)}`;
  },

  logout: () => {
    return apiClient.post<MessageResponse>('/api/v1/auth/logout', undefined);
  },
};
