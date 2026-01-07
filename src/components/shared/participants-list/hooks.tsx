'use client';

import { useWebSocketStore } from '@/lib/stores/websocket';

export function useParticipantsList() {
  const { participants } = useWebSocketStore();
  return { participants };
}
