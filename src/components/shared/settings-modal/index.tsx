'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, BotMessageSquare, User, Key, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSettingsModal, getAnonDisplayName, getBYOKProvider, getBYOKApiKey, type BYOKProvider } from './hooks';

export { getAnonDisplayName, getBYOKProvider, getBYOKApiKey, type BYOKProvider } from './hooks';

export function SettingsModal() {
  const {
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
  } = useSettingsModal();
  const { theme, setTheme } = useTheme();

  return (
    <Dialog open={isSettingsModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription className="pl-7 text-left !-mt-1">Manage your preferences</DialogDescription>
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
                    Display Name <span className='hidden sm:inline text-xs text-muted-foreground'>(for shared sessions & jams)</span>
                  </Label>
                  <Input
                    id="display-name"
                    placeholder="Anonymous"
                    defaultValue={getAnonDisplayName()}
                    onChange={e => handleDisplayNameChange(e.target.value, false)}
                    maxLength={50}
                  />
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
                  <Label htmlFor="auth-display-name">
                    Display Name <span className='hidden sm:inline text-xs text-muted-foreground'>(for shared sessions & jams)</span>
                  </Label>
                  <Input
                    id="auth-display-name"
                    placeholder="Enter display name"
                    defaultValue={user?.name || ''}
                    onChange={e => handleDisplayNameChange(e.target.value, true)}
                    maxLength={50}
                  />
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
              <Palette className="h-4 w-4" />
              Appearance
            </h3>
            <div className="space-y-4 rounded-lg border p-4">
              <div className="space-y-2">
                <Label htmlFor="theme-select">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme-select" className="w-full">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Default</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="pink">Pink</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <BotMessageSquare className="h-4 w-4" />
              AI Features
            </h3>
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ai-toggle" className="text-base">
                    AI Assistant
                  </Label>
                  <p className="text-sm text-muted-foreground text-left">
                    {byokApiKey ? 'Quick docs retrieval and code snippets' : 'Add your API key below to enable'}
                  </p>
                </div>
                <Switch
                  id="ai-toggle"
                  checked={aiEnabled}
                  onCheckedChange={handleAiToggle}
                  disabled={!byokApiKey}
                />
              </div>

              <div className="pt-4 border-t border-dashed space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Key className="h-4 w-4" />
                  <span>Bring Your Own Key</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="byok-provider">Provider</Label>
                  <Select
                    defaultValue={getBYOKProvider()}
                    onValueChange={(value) => handleBYOKProviderChange(value as BYOKProvider)}
                  >
                    <SelectTrigger id="byok-provider" className="w-full">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="byok-api-key">API Key</Label>
                  <Input
                    id="byok-api-key"
                    type="password"
                    placeholder="sk-..."
                    defaultValue={getBYOKApiKey()}
                    onChange={e => handleBYOKApiKeyChange(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Stored securely in your browser. Requests go directly to the provider.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
