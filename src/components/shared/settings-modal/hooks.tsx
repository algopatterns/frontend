'use client';

import { useState, useMemo, useCallback } from 'react';
import { useUIStore } from '@/lib/stores/ui';
import { useAuth } from '@/lib/hooks/use-auth';
import { useUpdateAIFeaturesEnabled } from '@/lib/hooks/use-users';
import { toast } from 'sonner';

const AI_DISABLED_KEY = 'algorave_ai_disabled';
const ANON_DISPLAY_NAME_KEY = 'algorave_display_name';

function getAnonAIEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(AI_DISABLED_KEY) !== 'true';
}

export function getAnonDisplayName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(ANON_DISPLAY_NAME_KEY) || '';
}

function setAnonDisplayName(name: string): void {
  if (typeof window === 'undefined') return;
  if (name.trim()) {
    localStorage.setItem(ANON_DISPLAY_NAME_KEY, name.trim());
  } else {
    localStorage.removeItem(ANON_DISPLAY_NAME_KEY);
  }
}

export function useSettingsModal() {
  const { isSettingsModalOpen, setSettingsModalOpen } = useUIStore();
  const { user, isAuthenticated } = useAuth();
  const updateAIFeatures = useUpdateAIFeaturesEnabled();

  // track optimistic state for pending updates
  const [optimisticValue, setOptimisticValue] = useState<boolean | null>(null);

  // anonymous display name - save on change, read fresh when modal opens
  const handleDisplayNameChange = useCallback((value: string) => {
    setAnonDisplayName(value);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      // reset optimistic value when modal closes (so next open reads fresh from source)
      setOptimisticValue(null);
    }
    setSettingsModalOpen(open);
  }, [setSettingsModalOpen]);

  // derive the current value from source of truth
  const sourceValue = useMemo(() => {
    if (!isSettingsModalOpen) return true;

    if (isAuthenticated && user) {
      return user.ai_features_enabled;
    }

    return getAnonAIEnabled();
  }, [isSettingsModalOpen, isAuthenticated, user]);

  // use optimistic value if set, otherwise use source value
  const aiEnabled = optimisticValue ?? sourceValue;

  const handleAiToggle = useCallback(async (checked: boolean) => {
    setOptimisticValue(checked);

    if (isAuthenticated) {
      // for auth users, update via API
      try {
        await updateAIFeatures.mutateAsync({ ai_features_enabled: checked });
        toast.success(checked ? 'AI features enabled' : 'AI features disabled');
        setOptimisticValue(null); // clear optimistic state, let source take over
      } catch {
        // revert on error
        setOptimisticValue(null);
        toast.error('Failed to update settings');
      }
    } else {
      // for anon users, update localStorage
      if (typeof window !== 'undefined') {
        if (checked) {
          localStorage.removeItem(AI_DISABLED_KEY);
        } else {
          localStorage.setItem(AI_DISABLED_KEY, 'true');
        }

        // dispatch event for same-tab updates
        window.dispatchEvent(new Event('ai-features-changed'));
      }

      toast.success(checked ? 'AI features enabled' : 'AI features disabled');
      // keep optimistic value for anon - localStorage change won't trigger useMemo re-run
    }
  }, [isAuthenticated, updateAIFeatures]);

  return {
    isSettingsModalOpen,
    handleOpenChange,
    user,
    isAuthenticated,
    aiEnabled,
    handleAiToggle,
    handleDisplayNameChange,
    getAnonDisplayName,
  };
}
