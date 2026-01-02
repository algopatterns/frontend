"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { wsClient } from "@/lib/websocket/client";
import { useWebSocketStore } from "@/lib/stores/websocket";

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [displayName, setDisplayName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const { status, error } = useWebSocketStore();

  const inviteToken = searchParams.get("invite");

  useEffect(() => {
    // Redirect to editor once connected
    if (status === "connected") {
      router.push("/");
    }
  }, [status, router]);

  const handleJoin = () => {
    if (!inviteToken) return;

    setIsJoining(true);
    wsClient.connect({
      inviteToken,
      displayName: displayName.trim() || undefined,
    });
  };

  if (!inviteToken) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Invalid Invite</CardTitle>
          <CardDescription>
            This invite link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <a href="/">Go to Homepage</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Join Session</CardTitle>
        <CardDescription>
          You've been invited to collaborate on a live coding session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label
            htmlFor="displayName"
            className="block text-sm font-medium mb-2"
          >
            Display Name (optional)
          </label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your name..."
            maxLength={100}
          />
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
            {error}
          </div>
        )}

        <Button
          className="w-full"
          onClick={handleJoin}
          disabled={isJoining || status === "connecting"}
        >
          {status === "connecting" ? "Joining..." : "Join Session"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function JoinPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Suspense
        fallback={
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-32 mb-2" />
              <div className="h-4 bg-muted rounded w-64" />
            </CardHeader>
            <CardContent>
              <div className="h-10 bg-muted rounded" />
            </CardContent>
          </Card>
        }
      >
        <JoinContent />
      </Suspense>
    </div>
  );
}
