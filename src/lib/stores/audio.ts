import { create } from "zustand";

type PendingPlaybackAction = "play" | "stop" | null;

interface AudioState {
  isPlaying: boolean;
  isInitialized: boolean;
  error: string | null;
  pendingPlaybackAction: PendingPlaybackAction;
  showSyncOverlay: boolean;

  setPlaying: (playing: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setError: (error: string | null) => void;
  setPendingPlayback: (action: PendingPlaybackAction) => void;
  setShowSyncOverlay: (show: boolean) => void;
  reset: () => void;
}

const initialState = {
  isPlaying: false,
  isInitialized: false,
  error: null,
  pendingPlaybackAction: null as PendingPlaybackAction,
  showSyncOverlay: false,
};

export const useAudioStore = create<AudioState>((set) => ({
  ...initialState,

  setPlaying: (isPlaying) => set({ isPlaying }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  setError: (error) => set({ error }),
  setPendingPlayback: (pendingPlaybackAction) => set({ pendingPlaybackAction }),
  setShowSyncOverlay: (showSyncOverlay) => set({ showSyncOverlay }),
  reset: () => set(initialState),
}));
