'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Sparkles, User } from 'lucide-react';
import { useSettingsModal, getAnonDisplayName } from './hooks';

export { getAnonDisplayName } from './hooks';

export function SettingsModal() {
  const {
    isSettingsModalOpen,
    handleOpenChange,
    user,
    isAuthenticated,
    aiEnabled,
    handleAiToggle,
    handleDisplayNameChange,
  } = useSettingsModal();

  return (
    <Dialog open={isSettingsModalOpen} onOpenChange={handleOpenChange}>
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
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </h3>
              <div className="space-y-4 rounded-lg border p-4">
                <div className="space-y-2">
                  <Label htmlFor="display-name">
                    Display Name <span className='text-xs text-muted-foreground'>(for shared sessions & raves)</span>
                  </Label>
                  <Input
                    id="display-name"
                    placeholder="Anonymous"
                    defaultValue={getAnonDisplayName()}
                    onChange={e => handleDisplayNameChange(e.target.value)}
                    maxLength={50}
                  />
                </div>
                <div className="pt-2 border-t border-dashed text-center">
                  <p className="text-sm text-muted-foreground">
                    Sign in for more profile options
                  </p>
                </div>
              </div>
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
