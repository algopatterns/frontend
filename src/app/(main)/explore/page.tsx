"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInfinitePublicStrudels } from "@/lib/hooks/use-strudels";
import { Eye, GitFork, Loader2 } from "lucide-react";

export default function ExplorePage() {
  const router = useRouter();
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfinitePublicStrudels();

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
    router.push(`/?fork=${strudelId}`);
  };

  return (
    <div className="container p-8 w-full max-w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Explore</h1>
        <p className="text-muted-foreground">
          Discover patterns created by the community
        </p>
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
                  {strudel.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {strudel.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-secondary px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
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
            <h3 className="text-lg font-medium mb-2">No public strudels yet</h3>
            <p className="text-muted-foreground text-center">
              Be the first to share your creation!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
