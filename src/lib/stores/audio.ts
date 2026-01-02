import { create } from "zustand";

interface AudioState {
  isPlaying: boolean;
  isInitialized: boolean;
  error: string | null;

  setPlaying: (playing: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  isPlaying: false,
  isInitialized: false,
  error: null,
};

export const useAudioStore = create<AudioState>((set) => ({
  ...initialState,

  setPlaying: (isPlaying) => set({ isPlaying }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
