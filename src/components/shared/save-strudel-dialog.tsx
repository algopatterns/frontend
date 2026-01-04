"use client";

import { useUIStore } from "@/lib/stores/ui";
import { StrudelFormDialog } from "./strudel-form-dialog";

export function SaveStrudelDialog() {
  const { isSaveStrudelDialogOpen, setSaveStrudelDialogOpen } = useUIStore();

  return (
    <StrudelFormDialog
      open={isSaveStrudelDialogOpen}
      onOpenChange={setSaveStrudelDialogOpen}
      mode="create"
    />
  );
}
