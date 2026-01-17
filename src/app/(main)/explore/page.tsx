"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { StrudelListItem } from "@/components/shared/strudel-list-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInfinitePublicStrudels, usePublicTags } from "@/lib/hooks/use-strudels";
import { Loader2, Search, Filter, X, AlertTriangle, RefreshCw } from "lucide-react";
import { StrudelStatsDialog } from "@/components/shared/strudel-stats-dialog";
import { StrudelPreviewModal } from "@/components/shared/strudel-preview-modal";
import type { Strudel } from "@/lib/api/strudels/types";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { usePlayerStore } from "@/lib/stores/player";

export default function ExplorePage() {
  const { currentStrudel: playerStrudel } = usePlayerStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [statsStrudel, setStatsStrudel] = useState<Strudel | null>(null);
  const [previewStrudel, setPreviewStrudel] = useState<Strudel | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 500);

  const filters = useMemo(() => ({
    search: debouncedSearch || undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
  }), [debouncedSearch, selectedTags]);

  const { data: tagsData } = usePublicTags();
  const availableTags = tagsData?.tags ?? [];

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfinitePublicStrudels(filters);

  // flatten pages into single array (filter out any null values)
  const strudels = data?.pages.flatMap(page => page.strudels).filter(Boolean) ?? [];

  // intersection observer for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) {
        observerRef.current.observe(node);
      }
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  // cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
    setIsSearchOpen(false);
  };

  const hasActiveFilters = searchQuery || selectedTags.length > 0;

  return (
    <div className={`container p-8 w-full max-w-full ${playerStrudel ? 'pb-24' : ''}`}>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Explore</h1>
          <p className="text-muted-foreground">
            Discover patterns created by the community
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 h-9 w-[280px] justify-end">
            {isSearchOpen ? (
              <>
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-full"
                    autoFocus
                  />
                </div>
                <Button
                  size="icon-round-sm"
                  variant="secondary"
                  className="shrink-0"
                  onClick={() => {
                    setSearchQuery("");
                    setIsSearchOpen(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                size="icon-round-sm"
                variant="outline"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon-round-sm"
                variant="outline"
                className={selectedTags.length > 0 ? "border-primary" : ""}
              >
                <Filter className="h-4 w-4" />
                {selectedTags.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {selectedTags.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-md max-h-64 overflow-y-auto">
              {availableTags.length > 0 ? (
                availableTags.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={() => toggleTag(tag)}
                    className="py-1 pl-7"
                  >
                    {tag}
                  </DropdownMenuCheckboxItem>
                ))
              ) : (
                <div className="px-2 py-1 text-sm text-muted-foreground">
                  No tags available
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasActiveFilters && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearFilters}
              className="text-muted-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col border rounded-lg divide-y">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
              <div className="hidden md:flex items-center gap-1">
                <div className="h-5 w-12 bg-muted rounded" />
                <div className="h-5 w-12 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <Card className="rounded-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to load strudels</h3>
            <p className="text-muted-foreground text-center mb-4">
              Something went wrong. Please try again.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : strudels.length > 0 ? (
        <>
          <div className="flex flex-col border rounded-lg divide-y">
            {strudels.map((strudel) => (
              <StrudelListItem
                key={strudel.id}
                strudel={strudel}
                onView={() => setPreviewStrudel(strudel)}
                onStats={() => setStatsStrudel(strudel)}
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
            {hasActiveFilters ? (
              <>
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Try adjusting your search or filters
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium mb-2">No public strudels yet</h3>
                <p className="text-muted-foreground text-center">
                  Be the first to share your creation!
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <StrudelStatsDialog
        strudelId={statsStrudel?.id ?? null}
        strudelTitle={statsStrudel?.title}
        open={!!statsStrudel}
        onOpenChange={(open) => !open && setStatsStrudel(null)}
      />

      <StrudelPreviewModal
        strudel={previewStrudel}
        open={!!previewStrudel}
        onOpenChange={(open) => !open && setPreviewStrudel(null)}
      />
    </div>
  );
}
