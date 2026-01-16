'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { wsClient } from '@/lib/websocket/client';
import { useWebSocketStore } from '@/lib/stores/websocket';
import { useAuth } from '@/lib/hooks/use-auth';
import { sessionsApi } from '@/lib/api/sessions';
import { Loader2, AlertTriangle, Radio } from 'lucide-react';
import Link from 'next/link';

interface SessionInfo {
  id: string;
  title: string;
  is_discoverable: boolean;
  is_member?: boolean;
}

export default function SessionJoinPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { status, error: wsError } = useWebSocketStore();

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // fetch session info (only for authenticated users)
  // for anonymous users, we skip the fetch and just try to connect
  useEffect(() => {
    if (!sessionId || isAuthLoading) return;

    async function fetchSession() {
      // for anonymous users, skip the API call and show join form directly
      // the WebSocket connection will validate if the session is discoverable
      if (!isAuthenticated) {
        setSessionInfo({
          id: sessionId,
          title: 'Live Session',
          is_discoverable: true, // assume true, WS will reject if not
        });
        setIsLoadingSession(false);
        return;
      }

      try {
        // for authenticated users, get session info
        const response = await sessionsApi.get(sessionId);
        setSessionInfo({
          id: response.id,
          title: response.title,
          is_discoverable: response.is_discoverable,
        });
      } catch (err) {
        // check if it's a 404 or auth error
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load session';
        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          setError('Session not found or has ended');
        } else if (errorMessage.includes('401')) {
          // user might not be a member, let them try to connect
          // if session is discoverable, it will work
          setSessionInfo({
            id: sessionId,
            title: 'Live Session',
            is_discoverable: true,
          });
        } else {
          setError(errorMessage);
        }
      } finally {
        setIsLoadingSession(false);
      }
    }

    fetchSession();
  }, [sessionId, isAuthLoading, isAuthenticated]);

  // redirect to editor once connected (only after user clicks join)
  useEffect(() => {
    if (status === 'connected' && isJoining) {
      router.push('/');
    } else if (status === 'disconnected' && isJoining) {
      setIsJoining(false);
    }
  }, [status, router, isJoining]);

  const handleJoin = () => {
    if (!sessionId) return;

    setIsJoining(true);
    // join as viewer for discoverable sessions
    wsClient.connect({
      sessionId,
      displayName: displayName.trim() || undefined,
    });
  };

  // loading state
  if (isAuthLoading || isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle>Cannot Join Session</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/raves">Browse Raves</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // session not discoverable and user not authenticated
  if (!sessionInfo?.is_discoverable && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Private Session</CardTitle>
            <CardDescription>
              This session requires an invite link to join.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/raves">Browse Raves</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // join form for discoverable sessions
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Radio className="h-5 w-5 text-red-500 animate-pulse" />
            <span className="text-xs bg-red-500/15 text-red-500 px-2 py-0.5 rounded">
              LIVE
            </span>
          </div>
          <CardTitle>{sessionInfo?.title || 'Join Session'}</CardTitle>
          <CardDescription>
            {isAuthenticated
              ? 'Join this live coding session'
              : 'Enter a display name to join as a viewer'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isAuthenticated && (
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium mb-2">
                Display Name
              </label>
              <Input
                id="displayName"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={100}
              />
            </div>
          )}

          {wsError && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
              {wsError}
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleJoin}
            disabled={isJoining || status === 'connecting'}>
            {status === 'connecting' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Session'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
