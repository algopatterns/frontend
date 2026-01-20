import { STORAGE_KEYS } from '@/lib/constants';
import type { AgentMessage, CCSignal } from '@/lib/api/strudels/types';

const DRAFT_PREFIX = 'algojams_draft_';
const CURRENT_DRAFT_ID_KEY = 'algojams_current_draft_id';
const GOOD_VERSION_PREFIX = 'algojams_good_version_';

export interface GoodVersion {
  code: string;
  timestamp: number;
}

export interface Draft {
  id: string;
  code: string;
  conversationHistory: AgentMessage[];
  updatedAt: number;
  title?: string;
  forkedFromId?: string;
  parentCCSignal?: CCSignal | null; // inherit CC signal restriction from parent
}

export const storage = {
  getSessionId: (): string | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(STORAGE_KEYS.SESSION_ID);
  },

  setSessionId: (sessionId: string): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
  },

  clearSessionId: (): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_ID);
  },

  getRedirectUrl: (): string | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(STORAGE_KEYS.REDIRECT_AFTER_LOGIN);
  },

  setRedirectUrl: (url: string): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(STORAGE_KEYS.REDIRECT_AFTER_LOGIN, url);
  },

  clearRedirectUrl: (): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(STORAGE_KEYS.REDIRECT_AFTER_LOGIN);
  },

  // previous session ID - used for login transition to transfer code
  // stored in sessionStorage so it survives OAuth redirect but is ephemeral
  getPreviousSessionId: (): string | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('algojams_previous_session_id');
  },

  setPreviousSessionId: (sessionId: string): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('algojams_previous_session_id', sessionId);
  },

  clearPreviousSessionId: (): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('algojams_previous_session_id');
  },

  // viewer/collaborator session - for reconnecting after refresh (within same browser session)
  getViewerSession: (): {
    sessionId: string;
    inviteToken: string;
    displayName?: string;
  } | null => {
    if (typeof window === 'undefined') {
      return null;
    }

    const data = sessionStorage.getItem('algojams_viewer_session');

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  setViewerSession: (
    sessionId: string,
    inviteToken: string,
    displayName?: string
  ): void => {
    if (typeof window === 'undefined') return;

    sessionStorage.setItem(
      'algojams_viewer_session',
      JSON.stringify({ sessionId, inviteToken, displayName })
    );
  },

  clearViewerSession: (): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('algojams_viewer_session');
  },

  // current strudel being edited - per tab, survives refresh
  getCurrentStrudelId: (): string | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('algojams_current_strudel_id');
  },

  setCurrentStrudelId: (id: string): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('algojams_current_strudel_id', id);
  },

  clearCurrentStrudelId: (): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('algojams_current_strudel_id');
  },

  // draft system - for preserving unsaved work
  // currentDraftId in sessionStorage so multiple tabs don't interfere
  // actual draft data in localStorage so user can access from /drafts page
  getCurrentDraftId: (): string | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(CURRENT_DRAFT_ID_KEY);
  },

  setCurrentDraftId: (id: string): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(CURRENT_DRAFT_ID_KEY, id);
  },

  clearCurrentDraftId: (): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(CURRENT_DRAFT_ID_KEY);
  },

  getDraft: (id: string): Draft | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(`${DRAFT_PREFIX}${id}`);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  setDraft: (draft: Draft): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`${DRAFT_PREFIX}${draft.id}`, JSON.stringify(draft));
  },

  deleteDraft: (id: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${DRAFT_PREFIX}${id}`);
  },

  getAllDrafts: (): Draft[] => {
    if (typeof window === 'undefined') return [];
    const drafts: Draft[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(DRAFT_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            drafts.push(JSON.parse(data));
          } catch {
            // skip invalid entries
          }
        }
      }
    }
    return drafts.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  generateDraftId: (): string => {
    return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  },

  getLatestDraft: (): Draft | null => {
    const drafts = storage.getAllDrafts();
    return drafts.length > 0 ? drafts[0] : null;
  },

  // good version - last manually saved state for recovery
  getGoodVersion: (strudelId: string): GoodVersion | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(`${GOOD_VERSION_PREFIX}${strudelId}`);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  setGoodVersion: (strudelId: string, code: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(
      `${GOOD_VERSION_PREFIX}${strudelId}`,
      JSON.stringify({ code, timestamp: Date.now() })
    );
  },

  clearGoodVersion: (strudelId: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${GOOD_VERSION_PREFIX}${strudelId}`);
  },
};
