import { apiClient } from '../client';
import { API_BASE_URL } from '@/lib/constants';
import { useAuthStore } from '@/lib/stores/auth';
import type { GenerateRequest, GenerateResponse, StreamEvent } from './types';

export const agentApi = {
  generate: (data: GenerateRequest) => {
    return apiClient.post<GenerateResponse>('/api/v1/agent/generate', data);
  },

  // streaming generation via SSE
  generateStream: async (
    data: GenerateRequest,
    onEvent: (event: StreamEvent) => void,
    signal?: AbortSignal
  ): Promise<void> => {
    const token = useAuthStore.getState().token;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/agent/generate/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Request failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // process complete SSE events (data: ...\n\n)
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // keep incomplete event in buffer

        for (const eventStr of events) {
          if (!eventStr.startsWith('data: ')) continue;

          const jsonStr = eventStr.slice(6); // remove "data: " prefix
          try {
            const event: StreamEvent = JSON.parse(jsonStr);
            onEvent(event);
          } catch {
            // skip malformed events
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
};

export type { GenerateRequest, GenerateResponse, Message, StreamEvent } from './types';
