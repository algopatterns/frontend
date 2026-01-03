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
};
