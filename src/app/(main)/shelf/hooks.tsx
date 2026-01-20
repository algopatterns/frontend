'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useInfiniteStrudels } from '@/lib/hooks/use-strudels';
import { useAuthStore } from '@/lib/stores/auth';
import { storage, type LocalStrudel } from '@/lib/utils/storage';
import type { Strudel } from '@/lib/api/strudels/types';

// convert local strudel to strudel-like object for display
function localToStrudel(local: LocalStrudel): Strudel {
  return {
    ...local,
    user_id: 'local',
    author_name: 'You',
    categories: [],
    ai_assist_count: 0,
  };
}

export const useDashboard = () => {
  const router = useRouter();
  const token = useAuthStore(state => state.token);
  const isAuthenticated = !!token;

  // for authenticated users, use API
  const {
    data,
    isLoading: apiLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteStrudels();

  // for anonymous users, use localStorage
  const [localStrudels, setLocalStrudels] = useState<LocalStrudel[]>([]);
  const [localLoading, setLocalLoading] = useState(true);

  // load local strudels on mount (for anon users)
  useEffect(() => {
    if (!isAuthenticated) {
      setLocalStrudels(storage.getAllLocalStrudels());
      setLocalLoading(false);
    }
  }, [isAuthenticated]);

  // refresh local strudels (can be called after save/delete)
  const refreshLocalStrudels = useCallback(() => {
    setLocalStrudels(storage.getAllLocalStrudels());
  }, []);

  // combined strudels list
  const strudels = useMemo(() => {
    if (isAuthenticated) {
      return data?.pages.flatMap(page => page.strudels).filter(Boolean) ?? [];
    }
    return localStrudels.map(localToStrudel);
  }, [isAuthenticated, data, localStrudels]);

  const total = isAuthenticated
    ? (data?.pages[0]?.pagination.total ?? 0)
    : localStrudels.length;

  const isLoading = isAuthenticated ? apiLoading : localLoading;

  // intersection observer for infinite scroll (only for authenticated)
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!isAuthenticated || isFetchingNextPage) return;

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
    [isAuthenticated, isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  // cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    strudels,
    total,
    isLoading,
    isFetchingNextPage: isAuthenticated ? isFetchingNextPage : false,
    hasNextPage: isAuthenticated ? hasNextPage : false,
    loadMoreRef,
    router,
    isAuthenticated,
    refreshLocalStrudels,
  };
};
