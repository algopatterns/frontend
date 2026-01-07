'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Copy, Check, Trash2, Users, Eye, Loader2 } from 'lucide-react';
import type { SessionRole } from '@/lib/api/sessions/types';
import { useInviteDialog, getRoleLabel } from './hooks';

function getRoleIcon(r: SessionRole) {
  return r === 'viewer' ? (
    <Eye className="h-3 w-3" />
  ) : (
    <Users className="h-3 w-3" />
  );
}

export function InviteDialog() {
  const {
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
  } = useInviteDialog();

  return (
    <Dialog open={isInviteDialogOpen} onOpenChange={setInviteDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Collaborators</DialogTitle>
          <DialogDescription>
            Create invite links to let others join your session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between p-3 rounded-none border bg-muted/30">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${isLive ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-medium">
                  {isLive ? 'Live' : 'Go Live'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {isLive
                  ? 'Your session is visible in Explore'
                  : 'Make your session discoverable'}
              </p>
            </div>
            <Button
              size="sm"
              variant={isLive ? 'destructive' : 'default'}
              onClick={handleToggleLive}
              disabled={setDiscoverable.isPending || !sessionId}
            >
              {setDiscoverable.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isLive ? (
                'End Live'
              ) : (
                'Go Live'
              )}
            </Button>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={role === 'co-author' ? 'default' : 'outline'}
                  onClick={() => setRole('co-author')}
                  className="flex-1"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Co-author
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={role === 'viewer' ? 'default' : 'outline'}
                  onClick={() => setRole('viewer')}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Viewer
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {role === 'co-author'
                  ? 'Can edit code and chat'
                  : 'Can only view and chat'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxUses">Max uses (optional)</Label>
              <Input
                id="maxUses"
                type="number"
                min="1"
                placeholder="Unlimited"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
              />
            </div>

            <Button
              onClick={handleCreateInvite}
              disabled={createInvite.isPending || !sessionId}
              className="w-full"
            >
              {createInvite.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Invite Link'
              )}
            </Button>
          </div>

          {invites.length > 0 && (
            <div className="space-y-2">
              <Label>Active Invites</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center gap-2 p-2 rounded-none bg-muted/50 text-sm"
                  >
                    <span className="flex items-center gap-1 text-muted-foreground">
                      {getRoleIcon(invite.role)}
                      {getRoleLabel(invite.role)}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">
                      {invite.max_uses > 0
                        ? `${invite.uses_count}/${invite.max_uses} uses`
                        : `${invite.uses_count} uses`}
                    </span>
                    <div className="flex-1" />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleCopyLink(invite.token)}
                    >
                      {copiedToken === invite.token ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleRevoke(invite.id)}
                      disabled={revokeInvite.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {invitesLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
