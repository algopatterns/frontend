'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Sparkles, User } from 'lucide-react';
import { useUIStore } from '@/lib/stores/ui';
import { useAuth } from '@/lib/hooks/use-auth';
import { useUpdateAIFeaturesEnabled } from '@/lib/hooks/use-users';
import { toast } from 'sonner';

const AI_DISABLED_KEY = 'algorave_ai_disabled';

function getAnonAIEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(AI_DISABLED_KEY) !== 'true';
}

export function SettingsModal() {
  const { isSettingsModalOpen, setSettingsModalOpen } = useUIStore();
  const { user, isAuthenticated } = useAuth();
  const updateAIFeatures = useUpdateAIFeaturesEnabled();

  // track optimistic state for pending updates
  const [optimisticValue, setOptimisticValue] = useState<boolean | null>(null);

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

  const handleAiToggle = async (checked: boolean) => {
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
      setOptimisticValue(null);
    }
  };

  return (
    <Dialog open={isSettingsModalOpen} onOpenChange={setSettingsModalOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription>Manage your preferences</DialogDescription>
        </DialogHeader>

        <div className="space-y-7 py-4">
          {!isAuthenticated && (
            <div className="rounded-lg border border-dashed p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Sign in to view profile information
              </p>
            </div>
          )}

          {isAuthenticated && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </h3>
              <div className="space-y-4 rounded-lg border p-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="text-sm">{user?.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="text-sm">{user?.email}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Features
            </h3>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="ai-toggle" className="text-base">
                  AI Assistant
                </Label>
                <p className="text-sm text-muted-foreground">
                  Quick docs retrieval and code snippets
                </p>
              </div>
              <Switch
                id="ai-toggle"
                checked={aiEnabled}
                onCheckedChange={handleAiToggle}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
