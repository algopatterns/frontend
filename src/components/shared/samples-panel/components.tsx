'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, ChevronDown, Play, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { previewSample } from '../strudel-editor';

const loadedSamples = new Set<string>();

interface SampleItemProps {
  name: string;
}

export function SampleItem({ name }: SampleItemProps) {
  const [copied, setCopied] = useState(false);
  const [isLoaded, setIsLoaded] = useState(() => loadedSamples.has(name));
  const [isLoading, setIsLoading] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(name);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handlePlay = async () => {
    if (!isLoaded) {
      setIsLoading(true);
    }

    const success = await previewSample(name);

    if (success && !isLoaded) {
      loadedSamples.add(name);
      setIsLoaded(true);
    }
    setIsLoading(false);
  };

  return (
    <div
      className="flex items-center justify-between py-1 px-3 hover:bg-muted/50 group cursor-pointer"
      onClick={handleCopy}>
      <code className="text-xs font-mono">{name}</code>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="ghost"
          className="h-5 w-5"
          onClick={e => {
            e.stopPropagation();
            handlePlay();
          }}
          title={isLoaded ? 'Preview sample' : 'Load and preview sample'}
          disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : isLoaded ? (
            <Play className="h-3 w-3" />
          ) : (
            <Download className="h-3 w-3" />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-5 w-5"
          onClick={e => {
            e.stopPropagation();
            handleCopy();
          }}
          title="Copy to clipboard">
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

export function CategorySection({
  title,
  samples,
  isOpen,
  onToggle,
  searchQuery,
}: CategorySectionProps) {
  const filteredSamples = searchQuery
    ? samples.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    : samples;

  if (searchQuery && filteredSamples.length === 0) return null;

  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors text-left',
          isOpen && 'bg-muted/30 border-b'
        )}>
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{title}</span>
          <span className="text-xs text-muted-foreground">
            ({searchQuery ? filteredSamples.length : samples.length})
          </span>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="max-h-64 overflow-y-auto bg-muted/40">
          {filteredSamples.slice(0, 50).map(sample => (
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

export function SubCategorySection({
  title,
  data,
  defaultOpen = null,
  isOpen,
  onToggle,
  searchQuery,
}: SubCategorySectionProps) {
  const [openSubCategory, setOpenSubCategory] = useState<string | null>(defaultOpen);

  const filteredCategories = searchQuery
    ? Object.fromEntries(
        Object.entries(data)
          .map(([cat, samples]) => [
            cat,
            samples.filter((s: string) =>
              s.toLowerCase().includes(searchQuery.toLowerCase())
            ),
          ])
          .filter(([, samples]) => (samples as string[]).length > 0)
      )
    : data;

  const totalCount = Object.values(filteredCategories).flat().length;

  if (searchQuery && totalCount === 0) return null;

  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors text-left',
          isOpen && 'bg-muted/30 border-b'
        )}>
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{title}</span>
          <span className="text-xs text-muted-foreground">({totalCount})</span>
        </div>

        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div>
          {Object.entries(filteredCategories).map(([category, samples], index) => (
            <div key={category}>
              <button
                onClick={() =>
                  setOpenSubCategory(openSubCategory === category ? null : category)
                }
                className={cn(
                  'flex items-center justify-between w-full px-3 py-2 hover:bg-muted/30 text-left border-t border-t-transparent',
                  openSubCategory === category && index > 0 && 'border-t-border',
                  openSubCategory === category && 'bg-muted/20 border-b'
                )}>
                <span className="text-xs font-medium text-muted-foreground">
                  {category}
                </span>

                <ChevronDown
                  className={cn(
                    'h-3 w-3 text-muted-foreground transition-transform',
                    openSubCategory === category && 'rotate-180'
                  )}
                />
              </button>
              {openSubCategory === category && (
                <div className="max-h-48 overflow-y-auto bg-muted/40 border-b">
                  {(samples as readonly string[]).map(sample => (
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
