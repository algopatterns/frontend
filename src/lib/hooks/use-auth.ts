"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth";
import { authApi } from "@/lib/api/auth";

export function useAuth() {
  const { user, token, isLoading, setAuth, clearAuth, setLoading, setUser } =
    useAuthStore();

  // Hydrate user data from token on mount
  useEffect(() => {
    async function hydrateAuth() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { user } = await authApi.getMe();
        setAuth(user, token);
      } catch {
        clearAuth();
      }
    }

    hydrateAuth();
  }, []);

  const login = (provider: "github" | "google") => {
    const url = authApi.getOAuthUrl(provider);
    window.location.href = url;
  };

  const logout = () => {
    clearAuth();
    localStorage.removeItem("algorave_session_id");
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
