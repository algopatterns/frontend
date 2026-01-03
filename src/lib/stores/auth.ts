import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/lib/api/auth/types";
import { wsClient } from "@/lib/websocket/client";
import { storage } from "@/lib/utils/storage";
import { useWebSocketStore } from "@/lib/stores/websocket";

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
        // Get the current session ID from WebSocket store (not localStorage - anonymous sessions don't store there)
        const sessionId = useWebSocketStore.getState().sessionId;
        // Also get saved anonymous code as fallback (in case we navigated away and lost the WebSocket store)
        const anonymousCode = storage.getAnonymousCode();
        console.log("[Auth] loginWithReconnect - sessionId:", sessionId, "hasAnonymousCode:", !!anonymousCode);

        // Disconnect current session (if any)
        wsClient.disconnect();
        // Update auth state
        set({ user, token, isLoading: false });

        if (sessionId) {
          // We have a session ID - backend will associate session with user and return code
          wsClient.connect({ sessionId });
          storage.clearAnonymousCode();
        } else if (anonymousCode) {
          // No session ID (page navigated during OAuth), but we have saved code - restore it after connecting
          wsClient.connect();
          wsClient.onceConnected(() => {
            console.log("[Auth] Restoring anonymous code after login (fallback)");
            wsClient.sendCodeUpdate(anonymousCode);
            storage.clearAnonymousCode();
          });
        } else {
          // No session ID and no saved code - just connect fresh
          wsClient.connect();
        }
      },

      logoutWithReconnect: () => {
        // Clear session ID first so we get a fresh session
        storage.clearSessionId();
        // Disconnect authenticated session
        wsClient.disconnect();
        // Clear auth state
        set({ user: null, token: null, isLoading: false });
        // Reconnect as anonymous - will get a fresh session (no session ID)
        wsClient.connect();
      },
    }),
    {
      name: "algorave-auth",
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
