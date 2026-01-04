import { STORAGE_KEYS } from "@/lib/constants";

const ANONYMOUS_CODE_KEY = "algorave_anonymous_code";

export const storage = {
  getSessionId: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEYS.SESSION_ID);
  },

  setSessionId: (sessionId: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
  },

  clearSessionId: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
  },

  getAnonymousCode: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ANONYMOUS_CODE_KEY);
  },

  setAnonymousCode: (code: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(ANONYMOUS_CODE_KEY, code);
  },

  clearAnonymousCode: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ANONYMOUS_CODE_KEY);
  },

  getRedirectUrl: (): string | null => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(STORAGE_KEYS.REDIRECT_AFTER_LOGIN);
  },

  setRedirectUrl: (url: string): void => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(STORAGE_KEYS.REDIRECT_AFTER_LOGIN, url);
  },

  clearRedirectUrl: (): void => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(STORAGE_KEYS.REDIRECT_AFTER_LOGIN);
  },

  // previous session ID - used for login transition to transfer code
  // stored in sessionStorage so it survives OAuth redirect but is ephemeral
  getPreviousSessionId: (): string | null => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("algorave_previous_session_id");
  },

  setPreviousSessionId: (sessionId: string): void => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem("algorave_previous_session_id", sessionId);
  },

  clearPreviousSessionId: (): void => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem("algorave_previous_session_id");
  },

  // Viewer/collaborator session - for reconnecting after refresh
  getViewerSession: (): { sessionId: string; inviteToken: string; displayName?: string } | null => {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem("algorave_viewer_session");
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  setViewerSession: (sessionId: string, inviteToken: string, displayName?: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      "algorave_viewer_session",
      JSON.stringify({ sessionId, inviteToken, displayName })
    );
  },

  clearViewerSession: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("algorave_viewer_session");
  },
};
