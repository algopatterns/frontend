"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/stores/auth";
import { authApi } from "@/lib/api/auth";
import { useWebSocketStore } from "@/lib/stores/websocket";
import { storage } from "@/lib/utils/storage";

export function useAuth() {
  const { user, token, isLoading, hasHydrated, setAuth, clearAuth, setLoading, setUser } =
    useAuthStore();

  // track if we've already attempted hydration to avoid duplicate calls
  const hasAttemptedHydration = useRef(false);

  // hydrate user data from token after store hydration
  useEffect(() => {
    // wait for zustand persist to hydrate from localStorage
    if (!hasHydrated) return;
    // only attempt once
    if (hasAttemptedHydration.current) return;
    hasAttemptedHydration.current = true;

    async function hydrateAuth() {
      // read fresh token value after hydration
      const currentToken = useAuthStore.getState().token;

      if (!currentToken) {
        setLoading(false);
        return;
      }

      try {
        const { user } = await authApi.getMe();
        setAuth(user, currentToken);
      } catch {
        clearAuth();
      }
    }

    hydrateAuth();
  }, [hasHydrated, setAuth, setLoading, clearAuth]);

  const login = (provider: "github" | "google") => {
    // save current session ID so backend can transfer code after login
    const currentSessionId = useWebSocketStore.getState().sessionId;

    if (currentSessionId) {
      storage.setPreviousSessionId(currentSessionId);
    }

    const url = authApi.getOAuthUrl(provider);
    window.location.href = url;
  };

  const logout = () => {
    clearAuth();
    localStorage.removeItem("algojams_session_id");
  };

  const updateProfile = async (data: { name: string; avatar_url?: string }) => {
    const { user: updatedUser } = await authApi.updateMe(data);
    setUser(updatedUser);
    return updatedUser;
  };

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    updateProfile,
  };
}
