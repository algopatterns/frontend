'use client';

import { useState, useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function useSidebarPanel(showChat: boolean, isViewer: boolean) {
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const effectiveTab = (() => {
    if (!mounted) {
      return 'samples';
    }

    if (selectedTab === null) {
      return isViewer && showChat ? 'chat' : 'samples';
    }

    if (isViewer && selectedTab === 'samples' && showChat) {
      return 'chat';
    }

    return selectedTab;
  })();

  return {
    selectedTab,
    setSelectedTab,
    mounted,
    effectiveTab,
  };
}
