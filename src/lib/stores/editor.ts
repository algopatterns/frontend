import { create } from 'zustand';
import { storage } from '@/lib/utils/storage';
import { EDITOR } from '@/lib/constants';
import type { AgentMessage, CCSignal } from '@/lib/api/strudels/types';
import type { CodeUpdateSource } from '@/lib/websocket/types';

// debounce draft saves to avoid excessive writes
let draftSaveTimeout: ReturnType<typeof setTimeout> | null = null;
const DRAFT_SAVE_DEBOUNCE_MS = 1000;

type InitialDraftState = {
  code: string;
  draftId: string | null;
  conversationHistory: AgentMessage[];
  forkedFromId: string | null;
  parentCCSignal: CCSignal | null;
};

// loads initial state from localStorage draft (sync, for immediate display)
function getInitialStateFromDraft(): InitialDraftState {
  if (typeof window === 'undefined') {
    return { code: EDITOR.DEFAULT_CODE, draftId: null, conversationHistory: [], forkedFromId: null, parentCCSignal: null };
  }

  // try current tab's draft first (sessionStorage has draft ID)
  const currentDraftId = storage.getCurrentDraftId();
  if (currentDraftId) {
    const currentDraft = storage.getDraft(currentDraftId);
    if (currentDraft) {
      return {
        code: currentDraft.code,
        draftId: currentDraftId,
        conversationHistory: currentDraft.conversationHistory || [],
        forkedFromId: currentDraft.forkedFromId || null,
        parentCCSignal: currentDraft.parentCCSignal ?? null,
      };
    }
  }

  // fallback to latest draft (cross-tab, anonymous users)
  const latestDraft = storage.getLatestDraft();
  if (latestDraft) {
    return {
      code: latestDraft.code,
      draftId: latestDraft.id,
      conversationHistory: latestDraft.conversationHistory || [],
      forkedFromId: latestDraft.forkedFromId || null,
      parentCCSignal: latestDraft.parentCCSignal ?? null,
    };
  }

  return { code: EDITOR.DEFAULT_CODE, draftId: null, conversationHistory: [], forkedFromId: null, parentCCSignal: null };
}

const initialDraft = getInitialStateFromDraft();

interface EditorState {
  code: string;
  cursorLine: number;
  cursorCol: number;
  isDirty: boolean;
  lastSyncedCode: string;
  lastSavedCode: string;
  isAIGenerating: boolean;
  conversationHistory: AgentMessage[];
  currentStrudelId: string | null;
  currentStrudelTitle: string | null;
  currentDraftId: string | null;
  forkedFromId: string | null;
  parentCCSignal: CCSignal | null;
  nextUpdateSource: CodeUpdateSource;

  setCode: (code: string, fromRemote?: boolean) => void;
  setCursor: (line: number, col: number) => void;
  setAIGenerating: (generating: boolean) => void;
  markSynced: () => void;
  markSaved: () => void;
  setCurrentStrudel: (id: string | null, title: string | null) => void;
  setCurrentDraftId: (id: string | null) => void;
  setForkedFromId: (id: string | null) => void;
  setParentCCSignal: (signal: CCSignal | null) => void;
  setNextUpdateSource: (source: CodeUpdateSource) => void;
  consumeNextUpdateSource: () => CodeUpdateSource;
  addToHistory: (message: AgentMessage) => void;
  setConversationHistory: (history: AgentMessage[]) => void;
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
  conversationHistory: initialDraft.conversationHistory,
  currentStrudelId: null as string | null,
  currentStrudelTitle: null as string | null,
  currentDraftId: initialDraft.draftId,
  forkedFromId: initialDraft.forkedFromId,
  parentCCSignal: initialDraft.parentCCSignal,
  nextUpdateSource: 'typed' as CodeUpdateSource,
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
      // always clear fork restrictions when switching strudels or starting fresh
      currentDraftId: null,
      forkedFromId: null,
      parentCCSignal: null,
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

  setForkedFromId: (forkedFromId) => set({ forkedFromId }),

  setParentCCSignal: (parentCCSignal) => set({ parentCCSignal }),

  setNextUpdateSource: (nextUpdateSource) => set({ nextUpdateSource }),

  consumeNextUpdateSource: () => {
    const source = get().nextUpdateSource;
    set({ nextUpdateSource: 'typed' });
    return source;
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
        const { currentDraftId, currentStrudelId, conversationHistory, forkedFromId } = get();
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
          forkedFromId: forkedFromId || undefined,
          parentCCSignal: get().parentCCSignal,
        });
      }, DRAFT_SAVE_DEBOUNCE_MS);
    }

    return result;
  },

  addToHistory: (message: AgentMessage) => {
    const result = set(state => ({
      conversationHistory: [...state.conversationHistory, message],
    }));

    // save draft to localStorage when conversation updates
    const { currentDraftId, currentStrudelId, code, conversationHistory, forkedFromId, parentCCSignal } = get();
    const draftId = currentStrudelId || currentDraftId;
    if (draftId) {
      storage.setDraft({
        id: draftId,
        code,
        conversationHistory,
        updatedAt: Date.now(),
        forkedFromId: forkedFromId || undefined,
        parentCCSignal,
      });
    }

    return result;
  },
}));
