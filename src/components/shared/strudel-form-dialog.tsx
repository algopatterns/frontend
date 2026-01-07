'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCreateStrudel, useUpdateStrudel } from '@/lib/hooks/use-strudels';
import { useEditorStore } from '@/lib/stores/editor';
import { useUIStore } from '@/lib/stores/ui';
import { storage } from '@/lib/utils/storage';
import type { Strudel, CCSignal } from '@/lib/api/strudels/types';
import { CC_SIGNALS, SIGNAL_RESTRICTIVENESS } from '@/lib/api/strudels/types';

interface StrudelFormDialogProps {
  strudel?: Strudel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
}

// inner form component that remounts when key changes to reset state
function StrudelForm({
  strudel,
  mode,
  onClose,
}: {
  strudel?: Strudel | null;
  mode: 'create' | 'edit';
  onClose: () => void;
}) {
  const router = useRouter();
  const createStrudel = useCreateStrudel();
  const updateStrudel = useUpdateStrudel();

  const {
    code,
    conversationHistory,
    currentDraftId,
    forkedFromId,
    parentCCSignal,
    setCurrentStrudel,
    setCurrentDraftId,
    markSaved,
  } = useEditorStore();

  const {
    pendingForkId,
    setPendingForkId,
    pendingOpenStrudelId,
    setPendingOpenStrudelId,
  } = useUIStore();

  // initialize state from props (only runs on mount due to key pattern)
  const [title, setTitle] = useState(mode === 'edit' && strudel ? strudel.title : '');
  const [description, setDescription] = useState(
    mode === 'edit' && strudel ? strudel.description || '' : ''
  );

  const [tags, setTags] = useState(
    mode === 'edit' && strudel ? strudel.tags?.join(', ') || '' : ''
  );

  const [categories, setCategories] = useState(
    mode === 'edit' && strudel ? strudel.categories?.join(', ') || '' : ''
  );

  const [isPublic, setIsPublic] = useState(
    mode === 'edit' && strudel ? strudel.is_public : false
  );

  const [ccSignal, setCCSignal] = useState<CCSignal | null>(
    mode === 'edit' && strudel ? strudel.cc_signal ?? null : null
  );

  const [error, setError] = useState('');

  const isCreate = mode === 'create';
  const isPending = isCreate ? createStrudel.isPending : updateStrudel.isPending;

  // compute effective signal considering parent restriction
  const getEffectiveSignal = (): CCSignal | null => {
    if (!isPublic) return null;
    if (!ccSignal) return null;

    // if parent has a signal, child must be at least as restrictive
    if (parentCCSignal) {
      const parentLevel = SIGNAL_RESTRICTIVENESS[parentCCSignal];
      const childLevel = SIGNAL_RESTRICTIVENESS[ccSignal];
      
      if (childLevel < parentLevel) {
        return parentCCSignal; // enforce parent's minimum
      }
    }

    return ccSignal;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    const formData = {
      title: title.trim(),
      description: description.trim() || undefined,
      tags: tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
      categories: categories
        .split(',')
        .map(c => c.trim())
        .filter(Boolean),
      is_public: isPublic,
      cc_signal: getEffectiveSignal(),
    };

    try {
      if (isCreate) {
        const newStrudel = await createStrudel.mutateAsync({
          ...formData,
          code,
          forked_from: forkedFromId || undefined,
          conversation_history: conversationHistory.map(h => ({
            role: h.role as 'user' | 'assistant',
            content: h.content,
          })),
        });

        // clean up old draft now that it's saved as a strudel
        if (currentDraftId) {
          storage.deleteDraft(currentDraftId);
          setCurrentDraftId(null);
        }

        setCurrentStrudel(newStrudel.id, newStrudel.title);
        markSaved();

        // if we have a pending action, navigate to that instead of saved strudel
        if (pendingForkId) {
          setPendingForkId(null);
          router.push(`/?fork=${pendingForkId}`);
        } else if (pendingOpenStrudelId) {
          setPendingOpenStrudelId(null);
          router.push(`/?id=${pendingOpenStrudelId}`);
        } else {
          router.replace(`/?id=${newStrudel.id}`, { scroll: false });
        }
      } else if (strudel) {
        await updateStrudel.mutateAsync({
          id: strudel.id,
          data: formData,
        });
      }

      onClose();
    } catch (err) {
      setError(`Failed to ${isCreate ? 'save' : 'update'} strudel. Please try again.`);
      console.error(`failed to ${isCreate ? 'save' : 'update'} strudel:`, err);
    }
  };

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
              // filter out signals less restrictive than parent
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

export function StrudelFormDialog({
  strudel,
  open,
  onOpenChange,
  mode,
}: StrudelFormDialogProps) {
  const handleClose = () => onOpenChange(false);

  // key resets form state when strudel or mode changes, or when dialog reopens
  const formKey = `${strudel?.id ?? 'new'}-${mode}-${open}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <StrudelForm key={formKey} strudel={strudel} mode={mode} onClose={handleClose} />
      </DialogContent>
    </Dialog>
  );
}
