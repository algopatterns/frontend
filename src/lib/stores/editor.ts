import { create } from 'zustand';
import { storage } from '@/lib/utils/storage';
import { EDITOR } from '@/lib/constants';

// debounce draft saves to avoid excessive writes
let draftSaveTimeout: ReturnType<typeof setTimeout> | null = null;
const DRAFT_SAVE_DEBOUNCE_MS = 1000;

/**
 * loads initial code from localStorage draft (sync, for immediate display).
 * falls back to default code if no draft exists.
 *
 * this is a visual optimization - the state machine will still make the
 * authoritative decision when session_state arrives from the server.
 */
function getInitialCodeFromDraft(): { code: string; draftId: string | null } {
  if (typeof window === 'undefined') {
    return { code: EDITOR.DEFAULT_CODE, draftId: null };
  }

  // try current tab's draft first (sessionStorage has draft ID)
  const currentDraftId = storage.getCurrentDraftId();
  if (currentDraftId) {
    const currentDraft = storage.getDraft(currentDraftId);
    if (currentDraft) {
      return { code: currentDraft.code, draftId: currentDraftId };
    }
  }

  // fallback to latest draft (cross-tab, anonymous users)
  const latestDraft = storage.getLatestDraft();
  if (latestDraft) {
    return { code: latestDraft.code, draftId: latestDraft.id };
  }

  return { code: EDITOR.DEFAULT_CODE, draftId: null };
}

const initialDraft = getInitialCodeFromDraft();

interface EditorState {
  code: string;
  cursorLine: number;
  cursorCol: number;
  isDirty: boolean;
  lastSyncedCode: string;
  lastSavedCode: string;
  isAIGenerating: boolean;
  conversationHistory: Array<{ role: string; content: string }>;
  currentStrudelId: string | null;
  currentStrudelTitle: string | null;
  currentDraftId: string | null;

  setCode: (code: string, fromRemote?: boolean) => void;
  setCursor: (line: number, col: number) => void;
  setAIGenerating: (generating: boolean) => void;
  markSynced: () => void;
  markSaved: () => void;
  setCurrentStrudel: (id: string | null, title: string | null) => void;
  setCurrentDraftId: (id: string | null) => void;
  addToHistory: (role: string, content: string) => void;
  setConversationHistory: (history: Array<{ role: string; content: string }>) => void;
  clearHistory: () => void;
  reset: () => void;
}

const initialState = {
  code: initialDraft.code,
  cursorLine: 1,
  cursorCol: 0,
  isDirty: false,
  lastSyncedCode: initialDraft.code,
  lastSavedCode: initialDraft.code,
  isAIGenerating: false,
  conversationHistory: [] as Array<{ role: string; content: string }>,
  currentStrudelId: null as string | null,
  currentStrudelTitle: null as string | null,
  currentDraftId: initialDraft.draftId,
};

export const useEditorStore = create<EditorState>((set, get) => ({
  ...initialState,

  reset: () => set(initialState),
  clearHistory: () => set({ conversationHistory: [] }),
  setConversationHistory: conversationHistory => set({ conversationHistory }),
  setAIGenerating: isAIGenerating => set({ isAIGenerating }),
  setCursor: (cursorLine, cursorCol) => set({ cursorLine, cursorCol }),

  markSynced: () => {
    return set(state => ({ lastSyncedCode: state.code }));
  },

  markSaved: () => {
    return set(state => ({ lastSavedCode: state.code, isDirty: false }));
  },

  setCurrentStrudel: (currentStrudelId, currentStrudelTitle) => {
    // persist to localStorage for navigation/refresh recovery
    if (currentStrudelId) {
      storage.setCurrentStrudelId(currentStrudelId);
      // clear draft ID when switching to a saved strudel
      storage.clearCurrentDraftId();
    } else {
      storage.clearCurrentStrudelId();
    }

    return set({
      currentStrudelId,
      currentStrudelTitle,
      // clear draft ID when switching to a saved strudel
      ...(currentStrudelId ? { currentDraftId: null } : {}),
    });
  },

  setCurrentDraftId: (currentDraftId) => {
    // persist to localStorage for navigation/refresh recovery
    if (currentDraftId) {
      storage.setCurrentDraftId(currentDraftId);
    } else {
      storage.clearCurrentDraftId();
    }

    return set({ currentDraftId });
  },

  setCode: (code, fromRemote = false) => {
    const state = get();
    const result = set({
      code,
      isDirty: !fromRemote && code !== state.lastSavedCode,
      ...(fromRemote ? { lastSyncedCode: code } : {}),
    });

    // save draft to localStorage on local code changes (backup for all users)
    if (!fromRemote) {
      // debounce draft saves
      if (draftSaveTimeout) {
        clearTimeout(draftSaveTimeout);
      }
      draftSaveTimeout = setTimeout(() => {
        const { currentDraftId, currentStrudelId, conversationHistory } = get();
        // use strudel ID as draft ID for saved strudels, otherwise generate/use draft ID
        const draftId = currentStrudelId || currentDraftId || storage.generateDraftId();

        if (!currentDraftId && !currentStrudelId) {
          // store the new draft ID
          storage.setCurrentDraftId(draftId);
          set({ currentDraftId: draftId });
        }

        storage.setDraft({
          id: draftId,
          code,
          conversationHistory,
          updatedAt: Date.now(),
        });
      }, DRAFT_SAVE_DEBOUNCE_MS);
    }

    return result;
  },

  addToHistory: (role, content) => {
    const result = set(state => ({
      conversationHistory: [...state.conversationHistory, { role, content }],
    }));

    // save draft to localStorage when conversation updates (backup for all users)
    const { currentDraftId, currentStrudelId, code, conversationHistory } = get();
    const draftId = currentStrudelId || currentDraftId;
    if (draftId) {
      storage.setDraft({
        id: draftId,
        code,
        conversationHistory,
        updatedAt: Date.now(),
      });
    }

    return result;
  },
}));
