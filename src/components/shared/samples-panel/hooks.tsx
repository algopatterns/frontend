'use client';

import { useState, useMemo } from 'react';
import { ALL_SAMPLES } from '@/lib/data/samples';

export function useSamplesPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['samples']));

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);

      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }

      return next;
    });
  };

  const searchResults = useMemo(() => {
    if (!searchQuery) return null;

    return ALL_SAMPLES.filter(s =>
      s.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 50);
  }, [searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    openCategories,
    toggleCategory,
    searchResults,
  };
}

export function useSampleItem(name: string) {
  const [copied, setCopied] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(name);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return {
    copied,
    isLoaded,
    setIsLoaded,
    isLoading,
    setIsLoading,
    handleCopy,
  };
}

export function useCategorySection(
  samples: readonly string[],
  searchQuery: string
) {
  const filteredSamples = useMemo(() => {
    if (!searchQuery) return samples;
    return samples.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [samples, searchQuery]);

  return { filteredSamples };
}

export function useSubCategorySection(
  data: Record<string, readonly string[]>,
  searchQuery: string,
  defaultOpen: string | null = null
) {
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

  return {
    openSubCategory,
    setOpenSubCategory,
    filteredCategories,
    totalCount,
  };
}
