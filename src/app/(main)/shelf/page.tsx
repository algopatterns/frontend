'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StrudelCard } from '@/components/shared/strudel-card';
import { Button } from '@/components/ui/button';
import { AuthGuard } from '@/components/shared/auth-guard';
import { StrudelFormDialog } from '@/components/shared/strudel-form-dialog';
import { StrudelStatsDialog } from '@/components/shared/strudel-stats-dialog';
import { StrudelPreviewModal } from '@/components/shared/strudel-preview-modal';
import { useDashboard } from './hooks';
import { Settings, Pencil, Loader2, BarChart3, Eye } from 'lucide-react';
import type { Strudel } from '@/lib/api/strudels/types';
import { useEditorStore } from '@/lib/stores/editor';
import { useUIStore } from '@/lib/stores/ui';
import { usePlayerStore } from '@/lib/stores/player';
import { EDITOR } from '@/lib/constants';

function DashboardContent() {
  const { strudels, isLoading, isFetchingNextPage, loadMoreRef, router } = useDashboard();
  const [selectedStrudel, setSelectedStrudel] = useState<Strudel | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statsStrudel, setStatsStrudel] = useState<Strudel | null>(null);
  const [previewStrudel, setPreviewStrudel] = useState<Strudel | null>(null);

  const { isDirty, code, currentStrudelId } = useEditorStore();
  const { setPendingOpenStrudelId } = useUIStore();
  const { currentStrudel: playerStrudel } = usePlayerStore();

  const handleOpenStrudel = (strudelId: string) => {
    // if opening the same strudel, just navigate
    if (strudelId === currentStrudelId) {
      router.push(`/?id=${strudelId}`);
      return;
    }

    const hasUnsavedChanges =
      isDirty || (!currentStrudelId && code !== EDITOR.DEFAULT_CODE);

    if (hasUnsavedChanges) {
      setPendingOpenStrudelId(strudelId);
    } else {
      router.push(`/?id=${strudelId}`);
    }
  };

  return (
    <AuthGuard>
      <div className={`container p-8 w-full max-w-full ${playerStrudel ? 'pb-24' : ''}`}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Shelf</h1>
            <p className="text-muted-foreground">Your creations and live sessions</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Card key={i} className={`animate-pulse rounded-md ${i > 6 ? 'hidden 2xl:block' : ''}`}>
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : strudels.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {strudels.map(strudel => (
                <StrudelCard
                  key={strudel.id}
                  strudel={strudel}
                  showCodePreview
                  maxTags={4}
                  actions={
                    <>
                      {strudel.is_public && (
                        <Button
                          size="icon-round-sm"
                          variant="outline"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => setStatsStrudel(strudel)}>
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon-round-sm"
                        variant="outline"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setSelectedStrudel(strudel);
                          setSettingsOpen(true);
                        }}>
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon-round-sm"
                        variant="outline"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => setPreviewStrudel(strudel)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon-round-sm"
                        variant="outline"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => handleOpenStrudel(strudel.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </>
                  }
                />
              ))}
            </div>

            <div ref={loadMoreRef} className="flex justify-center pt-8">
              {isFetchingNextPage && (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              )}
            </div>
          </>
        ) : (
          <Card className="rounded-lg">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-12 w-12 text-muted-foreground mb-4">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>

              <h3 className="text-lg font-medium mb-2">No strudels yet</h3>

              <p className="text-muted-foreground text-center mb-4">
                Start creating music patterns with AI assistance
              </p>

              <Button asChild>
                <Link href="/">Create your first strudel</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <StrudelFormDialog
          strudel={selectedStrudel}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          mode="edit"
        />

        <StrudelStatsDialog
          strudelId={statsStrudel?.id ?? null}
          strudelTitle={statsStrudel?.title}
          open={!!statsStrudel}
          onOpenChange={open => !open && setStatsStrudel(null)}
        />

        <StrudelPreviewModal
          strudel={previewStrudel}
          open={!!previewStrudel}
          onOpenChange={open => !open && setPreviewStrudel(null)}
        />
      </div>
    </AuthGuard>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-4" />
            <div className="h-4 bg-muted rounded w-64" />
          </div>
        </div>
      }>
      <DashboardContent />
    </Suspense>
  );
}
