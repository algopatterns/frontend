import { create } from "zustand";

interface EditorState {
  code: string;
  cursorLine: number;
  cursorCol: number;
  isDirty: boolean;
  lastSyncedCode: string;
  isAIGenerating: boolean;
  conversationHistory: Array<{ role: string; content: string }>;

  setCode: (code: string, fromRemote?: boolean) => void;
  setCursor: (line: number, col: number) => void;
  setAIGenerating: (generating: boolean) => void;
  markSynced: () => void;
  addToHistory: (role: string, content: string) => void;
  clearHistory: () => void;
  reset: () => void;
}

const initialState = {
  code: "",
  cursorLine: 1,
  cursorCol: 0,
  isDirty: false,
  lastSyncedCode: "",
  isAIGenerating: false,
  conversationHistory: [] as Array<{ role: string; content: string }>,
};

export const useEditorStore = create<EditorState>((set, get) => ({
  ...initialState,

  setCode: (code, fromRemote = false) =>
    set({
      code,
      isDirty: !fromRemote && code !== get().lastSyncedCode,
      ...(fromRemote ? { lastSyncedCode: code } : {}),
    }),

  setCursor: (cursorLine, cursorCol) => set({ cursorLine, cursorCol }),

  setAIGenerating: (isAIGenerating) => set({ isAIGenerating }),

  markSynced: () =>
    set((state) => ({ lastSyncedCode: state.code, isDirty: false })),

  addToHistory: (role, content) =>
    set((state) => ({
      conversationHistory: [...state.conversationHistory, { role, content }],
    })),

  clearHistory: () => set({ conversationHistory: [] }),

  reset: () => set(initialState),
}));
