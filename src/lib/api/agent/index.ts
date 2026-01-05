import { apiClient } from '../client';
import type { GenerateRequest, GenerateResponse } from './types';

export const agentApi = {
  generate: (data: GenerateRequest) => {
    return apiClient.post<GenerateResponse>('/api/v1/agent/generate', data);
  },
};

export type { GenerateRequest, GenerateResponse, Message } from './types';
