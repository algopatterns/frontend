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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Strudel, CCSignal } from '@/lib/api/strudels/types';
import { CC_SIGNALS, SIGNAL_RESTRICTIVENESS } from '@/lib/api/strudels/types';
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
    ccSignal,
    setCCSignal,
    error,
    setError,
    isCreate,
    isPending,
    parentCCSignal,
    handleSave,
  } = useStrudelForm(strudel, mode, onClose);

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

        <div className="space-y-2">
          <Label htmlFor="strudel-tags">Tags</Label>
          <Input
            id="strudel-tags"
            placeholder="ambient, chill, beats (comma separated)"
            value={tags}
            onChange={e => setTags(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="strudel-categories">Categories</Label>
          <Input
            id="strudel-categories"
            placeholder="music, experimental (comma separated)"
            value={categories}
            onChange={e => setCategories(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between mt-8">
          <Label htmlFor="strudel-public">Private Strudel</Label>
          <Switch
            id="strudel-public"
            checked={!isPublic}
            onCheckedChange={checked => {
              setIsPublic(!checked);

              if (checked) {
                setCCSignal(null);
              }
            }}
          />
        </div>

        <div className="space-y-4">
          <Label className={!isPublic ? 'text-muted-foreground' : 'text-orange-400'}>CC Signals</Label>
          <RadioGroup
            value={ccSignal || 'no-ai'}
            onValueChange={v => setCCSignal((v as CCSignal) || null)}
            disabled={!isPublic}
            className="space-y-2">
            {CC_SIGNALS.filter(s => {
              if (!parentCCSignal) return true;

              return (
                SIGNAL_RESTRICTIVENESS[s.id] >= SIGNAL_RESTRICTIVENESS[parentCCSignal]
              );
            }).map(signal => (
              <div key={signal.id} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={signal.id}
                  id={`signal-${signal.id}`}
                  disabled={!isPublic}
                />
                <Label
                  htmlFor={`signal-${signal.id}`}
                  className={`text-sm ${!isPublic ? 'text-muted-foreground' : ''}`}>
                  <span className="font-medium uppercase">{signal.id}</span>
                  <span className="text-muted-foreground">
                    {' '}
                    -{' '}
                    {signal.id === 'no-ai'
                      ? 'No preference (AI cannot use)'
                      : signal.label}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>

          {parentCCSignal && (
            <p className="text-xs text-muted-foreground">
              Inherited from parent: minimum {parentCCSignal}
            </p>
          )}
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
