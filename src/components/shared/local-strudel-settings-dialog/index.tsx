'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { storage } from '@/lib/utils/storage';
import type { Strudel } from '@/lib/api/strudels/types';

interface LocalStrudelSettingsDialogProps {
  strudel: Strudel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
}

export function LocalStrudelSettingsDialog({
  strudel,
  open,
  onOpenChange,
  onSave,
}: LocalStrudelSettingsDialogProps) {
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (strudel) {
      setTitle(strudel.title);
    }
  }, [strudel]);

  const handleSave = () => {
    if (!strudel) return;

    const localStrudel = storage.getLocalStrudel(strudel.id);
    if (localStrudel) {
      storage.setLocalStrudel({
        ...localStrudel,
        title: title.trim() || 'Untitled',
        updated_at: new Date().toISOString(),
      });
      onSave?.();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Strudel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Untitled"
            />
          </div>

          <p className="text-sm text-muted-foreground">
            This strudel is saved locally in your browser. Sign in to sync across devices and access more features.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
