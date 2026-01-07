"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInfinitePublicStrudels, usePublicTags } from "@/lib/hooks/use-strudels";
import { Eye, GitFork, Loader2, Search, Filter, X, Sparkles, BarChart3 } from "lucide-react";
import { StrudelStatsDialog } from "@/components/shared/strudel-stats-dialog";
import type { Strudel } from "@/lib/api/strudels/types";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useEditorStore } from "@/lib/stores/editor";
import { useUIStore } from "@/lib/stores/ui";
import { EDITOR } from "@/lib/constants";

export default function ExplorePage() {
  const router = useRouter();
  const { isDirty, code, currentStrudelId } = useEditorStore();
  const { setPendingForkId } = useUIStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [statsStrudel, setStatsStrudel] = useState<Strudel | null>(null);

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
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfinitePublicStrudels(filters);

  // Flatten pages into single array
  const strudels = data?.pages.flatMap(page => page.strudels) ?? [];

  // Intersection observer for infinite scroll
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

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleFork = (strudelId: string) => {
    const hasUnsavedChanges = isDirty || (!currentStrudelId && code !== EDITOR.DEFAULT_CODE);

    if (hasUnsavedChanges) {
      // Show confirmation dialog
      setPendingForkId(strudelId);
    } else {
      // Fork directly
      router.push(`/?fork=${strudelId}`);
    }
  };

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
    <div className="container p-8 w-full max-w-full">
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
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
            {strudels.map((strudel) => (
              <Card key={strudel.id} className="rounded-md">
                <CardHeader className="relative">
                  <div className="absolute -top-1 right-4 flex gap-1">
                    <Button
                      size="icon-round-sm"
                      variant="outline"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setStatsStrudel(strudel)}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button size="icon-round-sm" variant="outline" className="text-muted-foreground hover:text-foreground">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon-round-sm" variant="outline" className="text-muted-foreground hover:text-foreground" onClick={() => handleFork(strudel.id)}>
                      <GitFork className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>{new Date(strudel.updated_at).toLocaleDateString()}</CardDescription>
                  <CardTitle className="text-lg truncate max-w-[70%]">{strudel.title}</CardTitle>
                  <CardDescription className="line-clamp-1 max-w-[75%] -mt-1">{strudel.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-2 rounded overflow-hidden text-ellipsis whitespace-nowrap mb-3">
                    {strudel.code.slice(0, 100)}
                    {strudel.code.length > 100 && "..."}
                  </pre>
                  <div className="flex flex-wrap gap-1">
                    {strudel.ai_assist_count > 0 && (
                      <span className="text-xs bg-violet-500/15 text-violet-400 px-2 py-0.5 rounded flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI Assisted ({strudel.ai_assist_count})
                      </span>
                    )}
                    {strudel.tags?.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-secondary px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div ref={loadMoreRef} className="flex justify-center pt-8">
            {isFetchingNextPage && (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            )}
          </div>
        </>
      ) : (
        <Card>
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
    </div>
  );
}
