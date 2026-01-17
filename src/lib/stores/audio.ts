import { create } from "zustand";

type PendingPlaybackAction = "play" | "stop" | null;

export interface EditorToast {
  id: string;
  type: 'error' | 'warning';
  message: string;
}

interface AudioState {
  isPlaying: boolean;
  isInitialized: boolean;
  error: string | null;
  editorToasts: EditorToast[];
  pendingPlaybackAction: PendingPlaybackAction;
  showSyncOverlay: boolean;
  isCodeDirty: boolean;

  setPlaying: (playing: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setError: (error: string | null) => void;
  addEditorToast: (toast: Omit<EditorToast, 'id'>) => void;
  dismissEditorToast: (id: string) => void;
  clearEditorToasts: () => void;
  setPendingPlayback: (action: PendingPlaybackAction) => void;
  setShowSyncOverlay: (show: boolean) => void;
  setCodeDirty: (dirty: boolean) => void;
  reset: () => void;
}

const initialState = {
  isPlaying: false,
  isInitialized: false,
  error: null,
  editorToasts: [] as EditorToast[],
  pendingPlaybackAction: null as PendingPlaybackAction,
  showSyncOverlay: false,
  isCodeDirty: false,
};

export const useAudioStore = create<AudioState>((set) => ({
  ...initialState,

  setPlaying: (isPlaying) => {
    // clear toasts when playback starts successfully
    if (isPlaying) {
      set({ isPlaying, editorToasts: [] });
    } else {
      set({ isPlaying });
    }
  },
  setInitialized: (isInitialized) => set({ isInitialized }),
  setError: (error) => {
    if (error) {
      // add error as toast
      set((state) => ({
        error,
        editorToasts: [...state.editorToasts, { id: Date.now().toString(), type: 'error', message: error }],
      }));
    } else {
      set({ error });
    }
  },
  addEditorToast: (toast) => set((state) => ({
    editorToasts: [...state.editorToasts, { ...toast, id: Date.now().toString() }],
  })),
  dismissEditorToast: (id) => set((state) => ({
    editorToasts: state.editorToasts.filter((t) => t.id !== id),
  })),
  clearEditorToasts: () => set({ editorToasts: [] }),
  setPendingPlayback: (pendingPlaybackAction) => set({ pendingPlaybackAction }),
  setShowSyncOverlay: (showSyncOverlay) => set({ showSyncOverlay }),
  setCodeDirty: (isCodeDirty) => set({ isCodeDirty }),
  reset: () => set(initialState),
}));
