'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { BarChart3, Users, Clock, ExternalLink, GitFork } from 'lucide-react';
import Link from 'next/link';
import { useStrudelStatsDialog, formatDate } from './hooks';

interface StrudelStatsDialogProps {
  strudelId: string | null;
  strudelTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StrudelStatsDialog({
  strudelId,
  strudelTitle,
  open,
  onOpenChange,
}: StrudelStatsDialogProps) {
  const { data, isLoading } = useStrudelStatsDialog(strudelId, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Usage Stats
          </DialogTitle>
          {strudelTitle && (
            <DialogDescription className="truncate">
              {strudelTitle}
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="h-16 bg-muted rounded animate-pulse" />
              <div className="h-16 bg-muted rounded animate-pulse" />
              <div className="h-16 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-32 bg-muted rounded animate-pulse" />
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <BarChart3 className="h-3 w-3" />
                  AI Uses
                </div>
                <div className="text-xl font-semibold">
                  {data.stats.total_uses}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <GitFork className="h-3 w-3" />
                  Forks
                </div>
                <div className="text-xl font-semibold">
                  {data.stats.fork_count}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Users className="h-3 w-3" />
                  Users
                </div>
                <div className="text-xl font-semibold">
                  {data.stats.unique_users}
                </div>
              </div>
            </div>

            {data.stats.last_used_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Last used {formatDate(data.stats.last_used_at)}
              </div>
            )}

            {data.recent_uses.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Inspired these strudels
                </h4>
                <div className="space-y-2">
                  {data.recent_uses.map((use) => (
                    <Link
                      key={use.id}
                      href={`/?fork=${use.target_strudel_id}`}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors group"
                      onClick={() => onOpenChange(false)}
                    >
                      <div className="truncate flex-1">
                        <span className="text-sm">
                          {use.target_strudel_title || 'Untitled'}
                        </span>
                        {use.requesting_display_name && (
                          <span className="text-xs text-muted-foreground ml-2">
                            by {use.requesting_display_name}
                          </span>
                        )}
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {data.stats.total_uses === 0 && data.stats.fork_count === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <p>No usage data yet</p>
                <p className="text-xs mt-1">
                  Stats appear when your strudel is forked or helps others learn
                </p>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
