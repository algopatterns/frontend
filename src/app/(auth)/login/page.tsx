'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LoginButtons } from '@/components/shared/login-buttons';
import { useAuthStore } from '@/lib/stores/auth';
import { storage } from '@/lib/utils/storage';
import Link from 'next/link';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();
  const error = searchParams.get('error');

  useEffect(() => {
    if (token) {
      const redirectUrl = storage.getRedirectUrl() || '/';
      storage.clearRedirectUrl();
      router.push(redirectUrl);
    }
  }, [token, router]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome to Algorave</CardTitle>
        <CardDescription>
          Sign in to save your work and collaborate with others
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {decodeURIComponent(error)}
          </div>
        )}
        <LoginButtons />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Or{' '}
          <Link href="/" className="underline hover:text-primary cursor-pointer">
            continue as guest
          </Link>{' '}
          to try it out
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="h-6 bg-muted rounded w-48 mx-auto mb-2" />
            <div className="h-4 bg-muted rounded w-64 mx-auto" />
          </CardHeader>
          <CardContent>
            <div className="h-10 bg-muted rounded mb-3" />
            <div className="h-10 bg-muted rounded" />
          </CardContent>
        </Card>
      }>
      <LoginContent />
    </Suspense>
  );
}
