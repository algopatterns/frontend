"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { QueryProvider } from "./query-provider";
import { AuthHydration } from "./auth-hydration";
import { TransferSessionHandler } from "./transfer-session-handler";
import { Toaster } from "@/components/ui/sonner";
import { LoginModal } from "@/components/shared/login-modal";
import { TransferSessionDialog } from "@/components/shared/transfer-session-dialog";
import { LogoutConfirmDialog } from "@/components/shared/logout-confirm-dialog";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      storageKey="algorave-theme"
      disableTransitionOnChange
    >
      <QueryProvider>
        <AuthHydration>
          {children}
          <LoginModal />
          <TransferSessionDialog />
          <LogoutConfirmDialog />
          <Suspense fallback={null}>
            <TransferSessionHandler />
          </Suspense>
          <Toaster />
        </AuthHydration>
      </QueryProvider>
    </ThemeProvider>
  );
}
