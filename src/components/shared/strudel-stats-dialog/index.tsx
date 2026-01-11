'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BarChart3, Users, Clock, Eye, GitFork } from 'lucide-react';
import { useStrudelStatsDialog, formatDate } from './hooks';
import { StrudelPreviewModal } from '@/components/shared/strudel-preview-modal';

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
  const {
    data,
    isLoading,
    previewStrudel,
    isPreviewOpen,
    handleOpenPreview,
    handleClosePreview,
  } = useStrudelStatsDialog(strudelId, open);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Usage Stats
            </DialogTitle>
            {strudelTitle && (
              <DialogDescription className="truncate">{strudelTitle}</DialogDescription>
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
                    AI References
                  </div>
                  <div className="text-xl font-semibold">{data.stats.total_uses}</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <GitFork className="h-3 w-3" />
                    {data.stats.fork_count === 1 ? 'Fork' : 'Forks'}
                  </div>
                  <div className="text-xl font-semibold">{data.stats.fork_count}</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Users className="h-3 w-3" />
                    {data.stats.unique_users === 1 ? 'Unique User' : 'Unique Users'}
                  </div>
                  <div className="text-xl font-semibold">{data.stats.unique_users}</div>
                </div>
              </div>

              {data.stats.last_used_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-3 border-y border-border/50">
                  <Clock className="h-4 w-4" />
                  Last used {formatDate(data.stats.last_used_at)}
                </div>
              )}

              {data.recent_uses.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Inspired these strudels</h4>
                  <div className="space-y-2">
                    {data.recent_uses.map(use => (
                      <div
                        key={use.id}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                        <div className="truncate flex-1 min-w-0">
                          <span className="text-sm">
                            {use.target_strudel_title || 'Untitled'}
                          </span>
                          {use.requesting_display_name && (
                            <span className="text-xs text-muted-foreground ml-2">
                              by {use.requesting_display_name}
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-2 shrink-0"
                          onClick={() =>
                            use.target_strudel_id &&
                            handleOpenPreview(use.target_strudel_id)
                          }>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <StrudelPreviewModal
        strudel={previewStrudel}
        open={isPreviewOpen}
        onOpenChange={open => !open && handleClosePreview()}
      />
    </>
  );
}
