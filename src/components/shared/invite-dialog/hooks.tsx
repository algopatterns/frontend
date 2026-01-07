'use client';

import { useState } from 'react';
import { useUIStore } from '@/lib/stores/ui';
import { useWebSocketStore } from '@/lib/stores/websocket';
import {
  useCreateInvite,
  useSessionInvites,
  useRevokeInvite,
  useSession,
  useSetDiscoverable,
} from '@/lib/hooks/use-sessions';
import type { SessionRole } from '@/lib/api/sessions/types';

type InviteRole = 'co-author' | 'viewer';

export function useInviteDialog() {
  const { isInviteDialogOpen, setInviteDialogOpen } = useUIStore();
  const { sessionId } = useWebSocketStore();

  const [role, setRole] = useState<InviteRole>('co-author');
  const [maxUses, setMaxUses] = useState<string>('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const createInvite = useCreateInvite();
  const revokeInvite = useRevokeInvite();
  const setDiscoverable = useSetDiscoverable();
  const { data: session } = useSession(sessionId || '');
  const { data: invitesData, isLoading: invitesLoading } = useSessionInvites(
    sessionId || ''
  );

  const isLive = session?.is_discoverable ?? false;
  const invites = invitesData?.tokens || [];

  const handleToggleLive = async () => {
    if (!sessionId) return;
    try {
      await setDiscoverable.mutateAsync({
        sessionId,
        data: { is_discoverable: !isLive },
      });
    } catch (err) {
      console.error('Failed to toggle live status:', err);
    }
  };

  const handleCreateInvite = async () => {
    if (!sessionId) return;

    try {
      await createInvite.mutateAsync({
        sessionId,
        data: {
          role,
          max_uses: maxUses ? parseInt(maxUses, 10) : undefined,
        },
      });
      setMaxUses('');
    } catch (err) {
      console.error('Failed to create invite:', err);
    }
  };

  const handleCopyLink = async (token: string) => {
    const inviteUrl = `${window.location.origin}/join?session_id=${sessionId}&invite=${token}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRevoke = async (tokenId: string) => {
    if (!sessionId) return;
    try {
      await revokeInvite.mutateAsync({ sessionId, tokenId });
    } catch (err) {
      console.error('Failed to revoke invite:', err);
    }
  };

  return {
    isInviteDialogOpen,
    setInviteDialogOpen,
    sessionId,
    role,
    setRole,
    maxUses,
    setMaxUses,
    copiedToken,
    isLive,
    invites,
    invitesLoading,
    createInvite,
    revokeInvite,
    setDiscoverable,
    handleToggleLive,
    handleCreateInvite,
    handleCopyLink,
    handleRevoke,
  };
}

export function getRoleIcon(r: SessionRole) {
  return r === 'viewer' ? 'viewer' : 'users';
}

export function getRoleLabel(r: SessionRole) {
  return r === 'viewer' ? 'Viewer' : r === 'co-author' ? 'Co-author' : 'Host';
}
