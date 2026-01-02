"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "./query-provider";
import { AuthHydration } from "./auth-hydration";
import { Toaster } from "@/components/ui/sonner";
import { LoginModal } from "@/components/shared/login-modal";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthHydration>
        {children}
        <LoginModal />
        <Toaster />
      </AuthHydration>
    </QueryProvider>
  );
}
