'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { useUIStore } from '@/lib/stores/ui';
import { useAuth } from '@/lib/hooks/use-auth';
import { useUpdateAIFeaturesEnabled, useUpdateDisplayName } from '@/lib/hooks/use-users';
import { toast } from 'sonner';

const AI_DISABLED_KEY = 'algopatterns_ai_disabled';
const ANON_DISPLAY_NAME_KEY = 'algopatterns_display_name';
const BYOK_PROVIDER_KEY = 'algopatterns_byok_provider';
const BYOK_API_KEY = 'algopatterns_byok_api_key';

export type BYOKProvider = 'anthropic' | 'openai';

function getAnonAIEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  // Default to disabled - user must explicitly enable after configuring BYOK
  const stored = localStorage.getItem(AI_DISABLED_KEY);
  if (stored === null) return false; // no preference stored = default off
  return stored !== 'true';
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

export function getBYOKProvider(): BYOKProvider {
  if (typeof window === 'undefined') return 'anthropic';
  return (localStorage.getItem(BYOK_PROVIDER_KEY) as BYOKProvider) || 'anthropic';
}

export function getBYOKApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(BYOK_API_KEY) || '';
}

function setBYOKProvider(provider: BYOKProvider): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BYOK_PROVIDER_KEY, provider);
}

function setBYOKApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (key.trim()) {
    localStorage.setItem(BYOK_API_KEY, key.trim());
  } else {
    localStorage.removeItem(BYOK_API_KEY);
  }
}

export function useSettingsModal() {
  const { isSettingsModalOpen, setSettingsModalOpen } = useUIStore();
  const { user, isAuthenticated } = useAuth();
  const updateAIFeatures = useUpdateAIFeaturesEnabled();
  const updateDisplayName = useUpdateDisplayName();

  // track optimistic state for pending updates
  const [optimisticValue, setOptimisticValue] = useState<boolean | null>(null);

  // track BYOK API key reactively for enabling/disabling toggle
  const [byokApiKey, setBYOKApiKeyState] = useState<string>(() => getBYOKApiKey());

  // debounce timer for display name updates
  const displayNameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // anonymous display name - save on change, read fresh when modal opens
  const handleDisplayNameChange = useCallback((value: string, isAuth: boolean) => {
    if (isAuth) {
      // debounce API calls for authenticated users
      if (displayNameDebounceRef.current) {
        clearTimeout(displayNameDebounceRef.current);
      }
      displayNameDebounceRef.current = setTimeout(async () => {
        try {
          await updateDisplayName.mutateAsync({ display_name: value.trim() });
          toast.success('Display name updated');
        } catch {
          toast.error('Failed to update display name');
        }
      }, 500);
    } else {
      setAnonDisplayName(value);
    }
  }, [updateDisplayName]);

  // BYOK handlers
  const handleBYOKProviderChange = useCallback((provider: BYOKProvider) => {
    setBYOKProvider(provider);
  }, []);

  const handleBYOKApiKeyChange = useCallback((key: string) => {
    setBYOKApiKey(key);
    setBYOKApiKeyState(key);
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
        localStorage.setItem(AI_DISABLED_KEY, checked ? 'false' : 'true');

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
    handleBYOKProviderChange,
    handleBYOKApiKeyChange,
    byokApiKey,
  };
}
