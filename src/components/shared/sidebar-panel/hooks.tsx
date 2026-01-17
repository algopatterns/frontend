'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useUIStore } from '@/lib/stores/ui';

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function useSidebarPanel(showChat: boolean, isViewer: boolean) {
  const { sidebarTab, setSidebarTab } = useUIStore();
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const effectiveTab = (() => {
    if (!mounted) {
      return 'samples';
    }

    if (isViewer && showChat) {
      return 'chat';
    }

    return sidebarTab;
  })();

  // Sync effective tab back to store
  useEffect(() => {
    if (mounted && effectiveTab !== sidebarTab) {
      setSidebarTab(effectiveTab as 'samples' | 'chat');
    }
  }, [mounted, effectiveTab, sidebarTab, setSidebarTab]);

  const handleTabChange = (value: string) => {
    if (value === 'samples' || value === 'chat') {
      setSidebarTab(value);
    }
  };

  return {
    setSelectedTab: handleTabChange,
    mounted,
    effectiveTab,
  };
}
