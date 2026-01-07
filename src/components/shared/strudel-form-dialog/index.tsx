'use client';

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import type { Strudel } from '@/lib/api/strudels/types';
import { StrudelForm } from './components';

interface StrudelFormDialogProps {
  strudel?: Strudel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
}

export function StrudelFormDialog({
  strudel,
  open,
  onOpenChange,
  mode,
}: StrudelFormDialogProps) {
  const handleClose = () => onOpenChange(false);

  const formKey = `${strudel?.id ?? 'new'}-${mode}-${open}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <StrudelForm key={formKey} strudel={strudel} mode={mode} onClose={handleClose} />
      </DialogContent>
    </Dialog>
  );
}
