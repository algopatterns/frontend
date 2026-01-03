"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { QueryProvider } from "./query-provider";
import { AuthHydration } from "./auth-hydration";
import { Toaster } from "@/components/ui/sonner";
import { LoginModal } from "@/components/shared/login-modal";
import { LogoutConfirmDialog } from "@/components/shared/logout-confirm-dialog";
import { NewStrudelDialog } from "@/components/shared/new-strudel-dialog";
import { SaveStrudelDialog } from "@/components/shared/save-strudel-dialog";
import { InviteDialog } from "@/components/shared/invite-dialog";

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
          <LogoutConfirmDialog />
          <NewStrudelDialog />
          <SaveStrudelDialog />
          <InviteDialog />
          <Toaster />
        </AuthHydration>
      </QueryProvider>
    </ThemeProvider>
  );
}
