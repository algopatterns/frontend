import { create } from "zustand";
import type { SessionRole } from "@/lib/api/sessions/types";
import type { ConnectionStatus, ChatMessage } from "@/lib/websocket/types";

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

  setStatus: (status: ConnectionStatus) => void;
  setSessionId: (id: string | null) => void;
  setError: (error: string | null) => void;
  setMyRole: (role: SessionRole | null) => void;
  setParticipants: (participants: Participant[]) => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (id: string) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  reset: () => void;
}

const initialState = {
  status: "disconnected" as ConnectionStatus,
  sessionId: null,
  error: null,
  participants: [],
  messages: [],
  myRole: null,
};

export const useWebSocketStore = create<WebSocketState>((set) => ({
  ...initialState,

  setStatus: (status) => set({ status }),
  setSessionId: (sessionId) => set({ sessionId }),
  setError: (error) => set({ error }),
  setMyRole: (myRole) => set({ myRole }),
  setParticipants: (participants) => set({ participants }),
  addParticipant: (participant) =>
    set((state) => ({
      participants: [...state.participants, participant],
    })),
  removeParticipant: (id) =>
    set((state) => ({
      participants: state.participants.filter((p) => p.id !== id),
    })),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  clearMessages: () => set({ messages: [] }),
  reset: () => set(initialState),
}));
