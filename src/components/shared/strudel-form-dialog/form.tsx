'use client';

import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRightLeft } from 'lucide-react';
import type { Strudel, CCSignal, CCLicense } from '@/lib/api/strudels/types';
import { CC_SIGNALS, CC_LICENSES, SIGNAL_RESTRICTIVENESS, inferSignalFromLicense } from '@/lib/api/strudels/types';
import { useStrudelForm } from './hooks';

interface StrudelFormProps {
  strudel?: Strudel | null;
  mode: 'create' | 'edit';
  onClose: () => void;
}

export function StrudelForm({ strudel, mode, onClose }: StrudelFormProps) {
  const {
    title,
    setTitle,
    description,
    setDescription,
    tags,
    setTags,
    categories,
    setCategories,
    isPublic,
    setIsPublic,
    license,
    handleLicenseChange,
    ccSignal,
    handleSignalChange,
    signalOverridden,
    error,
    setError,
    isCreate,
    isPending,
    parentCCSignal,
    hasAIAssistance,
    handleSave,
  } = useStrudelForm(strudel, mode, onClose);

  // get what signal would be inferred from current license
  const inferredSignal = inferSignalFromLicense(license);

  // determine default signal (can't use no-ai when AI was used)
  const defaultSignal = hasAIAssistance ? 'cc-cr' : 'no-ai';

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isCreate ? 'Save Strudel' : 'Strudel Settings'}</DialogTitle>
        <DialogDescription>
          {isCreate
            ? 'Save your strudel to your library.'
            : 'Update your strudel details and visibility.'}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="strudel-title">Title</Label>
          <Input
            id="strudel-title"
            placeholder="My awesome strudel"
            value={title}
            onChange={e => {
              setTitle(e.target.value);
              setError('');
            }}
            autoFocus
          />
        </div>

        {!isCreate && (
          <div className="space-y-2">
            <Label htmlFor="strudel-description">Description</Label>
            <Textarea
              id="strudel-description"
              placeholder="A brief description of your strudel..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="strudel-tags">Tags</Label>
          <Input
            id="strudel-tags"
            placeholder="ambient, chill, beats (comma separated)"
            value={tags}
            onChange={e => setTags(e.target.value)}
          />
        </div>

        {!isCreate && (
          <div className="space-y-2">
            <Label htmlFor="strudel-categories">Categories</Label>
            <Input
              id="strudel-categories"
              placeholder="music, experimental (comma separated)"
              value={categories}
              onChange={e => setCategories(e.target.value)}
            />
          </div>
        )}

        <div className="flex items-center justify-between py-3 my-4 border-y border-border/50">
          <Label htmlFor="strudel-private">Private Strudel</Label>
          <Switch
            id="strudel-private"
            checked={!isPublic}
            onCheckedChange={checked => setIsPublic(!checked)}
          />
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            <Label>License</Label>
            <Select
              value={license || ''}
              onValueChange={v => handleLicenseChange((v || null) as CCLicense | null)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select license..." />
              </SelectTrigger>
              <SelectContent>
                {CC_LICENSES.map(l => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ArrowRightLeft className="h-4 w-4 text-muted-foreground shrink-0 mt-9" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <Label>AI/CC Signal</Label>
              {license && inferredSignal && !signalOverridden && (
                <span className="text-xs text-muted-foreground leading-0">(inferred from license)</span>
              )}
              {signalOverridden && (
                <span className="text-xs text-orange-400 leading-0">(custom)</span>
              )}
            </div>
            <Select
              value={ccSignal || defaultSignal}
              onValueChange={v => handleSignalChange((v as CCSignal) || null)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="AI/CC signal..." />
              </SelectTrigger>
              <SelectContent>
                {CC_SIGNALS.filter(s => {
                  // filter by parent restrictiveness
                  if (parentCCSignal && SIGNAL_RESTRICTIVENESS[s.id] < SIGNAL_RESTRICTIVENESS[parentCCSignal]) {
                    return false;
                  }
                  return true;
                }).map(signal => {
                  const isDisabled = hasAIAssistance && signal.id === 'no-ai';
                  return (
                    <SelectItem key={signal.id} value={signal.id} disabled={isDisabled}>
                      <span className="font-medium uppercase">{signal.id}</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {isDisabled ? 'Disabled - AI assistance detected' : signal.desc}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving...' : 'Save'}
        </Button>
      </DialogFooter>
    </>
  );
}
