'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLiveSessions, useLastSession } from '@/lib/hooks/use-sessions';
import { Users, Radio, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils/date';
import { useAuth } from '@/lib/hooks/use-auth';

export default function LivePage() {
  const { data, isLoading } = useLiveSessions();
  const { isAuthenticated } = useAuth();
  const { data: lastSession, isLoading: isLoadingLastSession } = useLastSession();

  // check if last session is already in the live sessions list
  const lastSessionInList = data?.sessions?.some(s => s.id === lastSession?.id);

  // show recovery card if:
  // 1. User is authenticated
  // 2. Has a last session
  // 3. Last session is NOT already in the live sessions list
  const showRecoveryCard = isAuthenticated && lastSession && !lastSessionInList;

  return (
    <div className="container p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Radio className="h-6 w-6 text-red-500 animate-pulse" />
          <h1 className="text-3xl font-bold">Live Sessions</h1>
        </div>
        <p className="text-muted-foreground">
          Join live coding sessions happening right now
        </p>
      </div>

      {/* Recovery card for user's last session */}
      {showRecoveryCard && (
        <div className="mb-6">
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {lastSession.title}
                    <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded font-normal">
                      Your Session
                    </span>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {lastSession.participant_count}{' '}
                      {lastSession.participant_count === 1 ? 'participant' : 'participants'}
                    </span>
                    <span>Active {formatRelativeTime(lastSession.last_activity)}</span>
                  </CardDescription>
                </div>
                <Button asChild>
                  <Link href={`/?session_id=${lastSession.id}`} className="gap-2">
                    Resume Session
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>
      )}

      {isLoading || (isAuthenticated && isLoadingLastSession) ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.sessions && data.sessions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.sessions.map(session => (
            <Card key={session.id} className={`relative overflow-hidden ${session.is_member ? "border-primary/50" : ""}`}>
              <div className="absolute top-6 right-6 flex items-center gap-2">
                {session.is_member && (
                  <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded">
                    Member
                  </span>
                )}
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
              </div>
              <CardHeader>
                <CardTitle className="text-lg pr-12">{session.title}</CardTitle>
                <CardDescription className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {session.participant_count}{' '}
                    {session.participant_count === 1 ? 'participant' : 'participants'}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-4">
                  Active {formatRelativeTime(session.last_activity)}
                </p>
                <Button asChild className="w-full" variant={session.is_member ? "secondary" : "default"}>
                  <Link href={`/sessions/${session.id}`}>
                    {session.is_member ? "Rejoin Session" : "Join Session"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Radio className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No live sessions right now</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start your own session and go live to appear here!
            </p>
            <Button asChild>
              <Link href="/">Start Coding</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
