"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePublicStrudels } from "@/lib/hooks/use-strudels";

export default function ExplorePage() {
  const { data, isLoading } = usePublicStrudels({ limit: 20 });

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
      ) : data?.strudels && data.strudels.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.strudels.map((strudel) => (
            <Card key={strudel.id}>
              <CardHeader>
                <CardTitle className="text-lg">{strudel.title}</CardTitle>
                <CardDescription>{strudel.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-2 rounded overflow-hidden text-ellipsis whitespace-nowrap mb-3">
                  {strudel.code.slice(0, 100)}
                  {strudel.code.length > 100 && "..."}
                </pre>
                {strudel.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
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
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    Preview
                  </Button>
                  <Button size="sm" className="flex-1">
                    Fork
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
