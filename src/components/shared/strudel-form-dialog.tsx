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
import { useCreateStrudel, useUpdateStrudel } from '@/lib/hooks/use-strudels';
import { useEditorStore } from '@/lib/stores/editor';
import { useUIStore } from '@/lib/stores/ui';
import { storage } from '@/lib/utils/storage';
import type { Strudel } from '@/lib/api/strudels/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

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

  // check if parent strudel restricts training (for forks)
  const draft = currentDraftId ? storage.getDraft(currentDraftId) : null;
  const parentRestrictsTraining = draft?.parentAllowTraining === false;

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
  const [allowTraining, setAllowTraining] = useState(
    mode === 'edit' && strudel ? strudel.allow_training : false
  );
  const [error, setError] = useState('');

  const isCreate = mode === 'create';
  const isPending = isCreate ? createStrudel.isPending : updateStrudel.isPending;

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
      allow_training: isPublic && allowTraining && !parentRestrictsTraining,
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
      console.error(`Failed to ${isCreate ? 'save' : 'update'} strudel:`, err);
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
                setAllowTraining(false);
              }
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label
            htmlFor="strudel-training"
            className={!isPublic || parentRestrictsTraining ? 'text-muted-foreground' : ''}>
            CC Signals
          </Label>

          <Tooltip>
            <TooltipTrigger>
              <Switch
                id="strudel-training"
                checked={parentRestrictsTraining ? false : allowTraining}
                onCheckedChange={setAllowTraining}
                disabled={!isPublic || parentRestrictsTraining}
              />
            </TooltipTrigger>

            <TooltipContent side="left">
              {parentRestrictsTraining
                ? 'Original author disabled AI training for this strudel'
                : isPublic
                  ? 'Let AI assistant learn from this strudel to help others'
                  : 'Only available for public strudels'}
            </TooltipContent>
          </Tooltip>
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
