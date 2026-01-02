"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/lib/stores/auth";
import { authApi } from "@/lib/api/auth";

export function AuthHydration({ children }: { children: ReactNode }) {
  const { token, setAuth, clearAuth, setLoading } = useAuthStore();

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
  }, [token, setAuth, clearAuth, setLoading]);

  return <>{children}</>;
}
