"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { authApi } from "@/lib/api/auth";
import { storage } from "@/lib/utils/storage";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const hasProcessed = useRef(false);

  useEffect(() => {
    async function handleCallback() {
      // Prevent double processing
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      const token = searchParams.get("token");
      const error = searchParams.get("error");

      if (error) {
        router.push(`/login?error=${encodeURIComponent(error)}`);
        return;
      }

      if (!token) {
        router.push("/login?error=No token received");
        return;
      }

      try {
        // Store token temporarily to make authenticated request
        useAuthStore.setState({ token });

        // Fetch user profile
        const { user } = await authApi.getMe();

        // Update store
        setAuth(user, token);

        // Check for pending session transfer
        const pendingSessionId = storage.getSessionId();
        const redirectPath = storage.getRedirectUrl() || "/dashboard";
        storage.clearRedirectUrl();

        if (pendingSessionId) {
          // Offer to transfer anonymous session
          router.push(`/dashboard?transfer_session=${pendingSessionId}`);
        } else {
          router.push(redirectPath);
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        useAuthStore.getState().clearAuth();
        router.push("/login?error=Failed to authenticate");
      }
    }

    handleCallback();
  }, [searchParams, router, setAuth]);

  return (
    <div className="text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
      <p className="text-muted-foreground">Completing sign in...</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense
        fallback={
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        }
      >
        <CallbackContent />
      </Suspense>
    </div>
  );
}
