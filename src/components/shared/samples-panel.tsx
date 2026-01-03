"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, ChevronDown, Search, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { SAMPLE_DATA, ALL_SAMPLES } from "@/lib/data/samples";

interface SampleItemProps {
  name: string;
}

function SampleItem({ name }: SampleItemProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(name);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handlePlay = () => {
    // TODO: Implement sample preview playback
    console.log(`Preview sample: ${name}`);
  };

  return (
    <div
      className="flex items-center justify-between py-1 px-3 hover:bg-muted/50 group cursor-pointer"
      onClick={handleCopy}
    >
      <code className="text-xs font-mono">{name}</code>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="ghost"
          className="h-5 w-5"
          onClick={(e) => {
            e.stopPropagation();
            handlePlay();
          }}
          title="Preview sample"
        >
          <Play className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-5 w-5"
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  );
}

interface CategorySectionProps {
  title: string;
  samples: readonly string[];
  isOpen: boolean;
  onToggle: () => void;
  searchQuery: string;
}

function CategorySection({ title, samples, isOpen, onToggle, searchQuery }: CategorySectionProps) {
  const filteredSamples = useMemo(() => {
    if (!searchQuery) return samples;
    return samples.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [samples, searchQuery]);

  if (searchQuery && filteredSamples.length === 0) return null;

  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors text-left",
          isOpen && "bg-muted/30 border-b"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{title}</span>
          <span className="text-xs text-muted-foreground">
            ({searchQuery ? filteredSamples.length : samples.length})
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div className="max-h-64 overflow-y-auto bg-muted/40">
          {filteredSamples.slice(0, 50).map((sample) => (
            <SampleItem key={sample} name={sample} />
          ))}
          {filteredSamples.length > 50 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              + {filteredSamples.length - 50} more (use search to filter)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface SubCategorySectionProps {
  title: string;
  data: Record<string, readonly string[]>;
  defaultOpen?: string | null;
  isOpen: boolean;
  onToggle: () => void;
  searchQuery: string;
}

function SubCategorySection({ title, data, defaultOpen = null, isOpen, onToggle, searchQuery }: SubCategorySectionProps) {
  const [openSubCategory, setOpenSubCategory] = useState<string | null>(defaultOpen);

  const filteredCategories = useMemo((): Record<string, readonly string[]> => {
    if (!searchQuery) return data;
    const filtered: Record<string, string[]> = {};
    for (const [cat, samples] of Object.entries(data)) {
      const matchingSamples = samples.filter((s: string) =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matchingSamples.length > 0) {
        filtered[cat] = matchingSamples;
      }
    }
    return filtered;
  }, [data, searchQuery]);

  const totalCount = Object.values(filteredCategories).flat().length;

  if (searchQuery && totalCount === 0) return null;

  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors text-left",
          isOpen && "bg-muted/30 border-b"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{title}</span>
          <span className="text-xs text-muted-foreground">
            ({totalCount})
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div>
          {Object.entries(filteredCategories).map(([category, samples], index) => (
            <div key={category}>
              <button
                onClick={() => setOpenSubCategory(openSubCategory === category ? null : category)}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2 hover:bg-muted/30 text-left border-t border-t-transparent",
                  openSubCategory === category && index > 0 && "border-t-border",
                  openSubCategory === category && "bg-muted/20 border-b"
                )}
              >
                <span className="text-xs font-medium text-muted-foreground">{category}</span>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 text-muted-foreground transition-transform",
                    openSubCategory === category && "rotate-180"
                  )}
                />
              </button>
              {openSubCategory === category && (
                <div className="max-h-48 overflow-y-auto bg-muted/40 border-b">
                  {samples.map((sample) => (
                    <SampleItem key={sample} name={sample} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SamplesPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(["samples"]));

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // When searching, show all matching results in a flat list
  const searchResults = useMemo(() => {
    if (!searchQuery) return null;
    return ALL_SAMPLES.filter(s =>
      s.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 50);
  }, [searchQuery]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b space-y-2">
        <h2 className="font-medium text-sm">Samples</h2>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search samples..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {searchQuery && searchResults ? (
          <div className="p-2 space-y-0.5">
            {searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No samples found
              </p>
            ) : (
              <>
                {searchResults.map((sample) => (
                  <SampleItem key={sample} name={sample} />
                ))}
                {ALL_SAMPLES.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase())).length > 50 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Showing first 50 results. Refine your search for more.
                  </p>
                )}
              </>
            )}
          </div>
        ) : (
          <>
            <CategorySection
              title="Samples"
              samples={SAMPLE_DATA.samples}
              isOpen={openCategories.has("samples")}
              onToggle={() => toggleCategory("samples")}
              searchQuery={searchQuery}
            />
            <SubCategorySection
              title="Drum Machines"
              data={SAMPLE_DATA.drums}
              defaultOpen="Basic"
              isOpen={openCategories.has("drums")}
              onToggle={() => toggleCategory("drums")}
              searchQuery={searchQuery}
            />
            <SubCategorySection
              title="Synths"
              data={SAMPLE_DATA.synths}
              defaultOpen="Basic Waveforms"
              isOpen={openCategories.has("synths")}
              onToggle={() => toggleCategory("synths")}
              searchQuery={searchQuery}
            />
            <CategorySection
              title="Wavetables"
              samples={SAMPLE_DATA.wavetables}
              isOpen={openCategories.has("wavetables")}
              onToggle={() => toggleCategory("wavetables")}
              searchQuery={searchQuery}
            />
          </>
        )}
      </div>

      <div className="p-2 border-t">
        <p className="text-xs text-muted-foreground text-center">
          Click sample to copy
        </p>
      </div>
    </div>
  );
}
