import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/lib/api/auth/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;

  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: true,

      setAuth: (user, token) => set({ user, token, isLoading: false }),
      clearAuth: () => set({ user: null, token: null, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      setUser: (user) => set({ user }),
    }),
    {
      name: "algorave-auth",
      partialize: (state) => ({ token: state.token }),
    }
  )
);
