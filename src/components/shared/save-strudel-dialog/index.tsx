'use client';

import { StrudelFormDialog } from '../strudel-form-dialog';
import { useSaveStrudelDialog } from './hooks';

export function SaveStrudelDialog() {
  const { isSaveStrudelDialogOpen, setSaveStrudelDialogOpen } = useSaveStrudelDialog();

  return (
    <StrudelFormDialog
      open={isSaveStrudelDialogOpen}
      onOpenChange={setSaveStrudelDialogOpen}
      mode="create"
    />
  );
}
