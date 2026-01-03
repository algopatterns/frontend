'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { authApi } from '@/lib/api/auth';
import { storage } from '@/lib/utils/storage';

function CallbackContent() {
  const router = useRouter();
  const hasProcessed = useRef(false);
  const searchParams = useSearchParams();

  const { loginWithReconnect } = useAuthStore();

  useEffect(() => {
    async function handleCallback() {
      // prevent double processing
      if (hasProcessed.current) return;

      hasProcessed.current = true;

      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        router.push(`/login?error=${encodeURIComponent(error)}`);
        return;
      }

      if (!token) {
        router.push('/login?error=No token received');
        return;
      }

      try {
        // store token temporarily to make authenticated request
        useAuthStore.setState({ token });

        // fetch user profile
        const { user } = await authApi.getMe();

        // update store with reconnect - this will reconnect WebSocket with auth
        // and pass previous_session_id to preserve code from anonymous session
        loginWithReconnect(user, token);

        const redirectPath = storage.getRedirectUrl() || '/';
        storage.clearRedirectUrl();

        router.push(redirectPath);
      } catch (error) {
        console.error('auth callback error:', error);
        useAuthStore.getState().clearAuth();
        router.push('/login?error=failed to authenticate');
      }
    }

    handleCallback();
  }, [searchParams, router, loginWithReconnect]);

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
        }>
        <CallbackContent />
      </Suspense>
    </div>
  );
}
