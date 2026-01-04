import { create } from 'zustand';
import type { SessionRole } from '@/lib/api/sessions/types';
import type { ConnectionStatus, ChatMessage } from '@/lib/websocket/types';

interface Participant {
  id: string;
  userId?: string;
  displayName: string;
  role: SessionRole;
}

interface WebSocketState {
  status: ConnectionStatus;
  sessionId: string | null;
  error: string | null;
  participants: Participant[];
  messages: ChatMessage[];
  myRole: SessionRole | null;
  sessionStateReceived: boolean;

  setStatus: (status: ConnectionStatus) => void;
  setSessionId: (id: string | null) => void;
  setError: (error: string | null) => void;
  setMyRole: (role: SessionRole | null) => void;
  setParticipants: (participants: Participant[]) => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (id: string) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  setSessionStateReceived: (received: boolean) => void;
  reset: () => void;
}

const initialState = {
  status: 'disconnected' as ConnectionStatus,
  sessionId: null,
  error: null,
  participants: [],
  messages: [],
  myRole: null,
  sessionStateReceived: false,
};

export const useWebSocketStore = create<WebSocketState>(set => ({
  ...initialState,

  reset: () => set(initialState),
  setError: error => set({ error }),
  setMyRole: myRole => set({ myRole }),
  setStatus: status => set({ status }),
  clearMessages: () => set({ messages: [] }),
  setSessionId: sessionId => set({ sessionId }),
  setParticipants: participants => set({ participants }),
  setSessionStateReceived: sessionStateReceived => set({ sessionStateReceived }),

  addParticipant: participant => {
    return set(state => ({
      participants: [...state.participants, participant],
    }));
  },

  removeParticipant: id => {
    return set(state => ({
      participants: state.participants.filter(p => p.id !== id),
    }));
  },
  
  addMessage: message => {
    return set(state => ({
      messages: [...state.messages, message],
    }));
  },
}));
