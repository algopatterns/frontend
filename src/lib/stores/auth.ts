import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/lib/api/auth/types";
import { wsClient } from "@/lib/websocket/client";
import { storage } from "@/lib/utils/storage";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  hasHydrated: boolean;

  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setUser: (user: User) => void;
  setHasHydrated: (hydrated: boolean) => void;
  loginWithReconnect: (user: User, token: string) => void;
  logoutWithReconnect: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: true,
      hasHydrated: false,

      setAuth: (user, token) => set({ user, token, isLoading: false }),
      clearAuth: () => set({ user: null, token: null, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      setUser: (user) => set({ user }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      loginWithReconnect: (user, token) => {
        // get the previous session ID from sessionStorage (saved before OAuth redirect)
        const previousSessionId = storage.getPreviousSessionId();

        // disconnect current session (if any)
        wsClient.disconnect();
        // update auth state
        set({ user, token, isLoading: false });

        // connect with previousSessionId - backend will copy code from old session
        wsClient.connect({ previousSessionId: previousSessionId || undefined });

        // clean up
        storage.clearPreviousSessionId();
      },

      logoutWithReconnect: () => {
        // clear session ID first so we get a fresh session
        storage.clearSessionId();
        // disconnect authenticated session
        wsClient.disconnect();
        // clear auth state
        set({ user: null, token: null, isLoading: false });
        // reconnect as anonymous - will get a fresh session (no session ID)
        wsClient.connect();
      },
    }),
    {
      name: "algojams-auth",
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
