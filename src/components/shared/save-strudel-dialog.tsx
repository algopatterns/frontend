"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUIStore } from "@/lib/stores/ui";
import { useEditorStore } from "@/lib/stores/editor";
import { useCreateStrudel } from "@/lib/hooks/use-strudels";

export function SaveStrudelDialog() {
  const router = useRouter();
  const { isSaveStrudelDialogOpen, setSaveStrudelDialogOpen } = useUIStore();
  const { code, conversationHistory, setCurrentStrudel, markSaved } = useEditorStore();
  const createStrudel = useCreateStrudel();
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const handleClose = () => {
    setSaveStrudelDialogOpen(false);
    setTitle("");
    setError("");
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }

    try {
      const strudel = await createStrudel.mutateAsync({
        title: title.trim(),
        code,
        conversation_history: conversationHistory.map(h => ({
          role: h.role as "user" | "assistant",
          content: h.content,
        })),
      });

      setCurrentStrudel(strudel.id, strudel.title);
      markSaved();

      // Update URL with new strudel ID (enables refresh)
      router.replace(`/?id=${strudel.id}`, { scroll: false });

      handleClose();
    } catch (err) {
      setError("Failed to save strudel. Please try again.");
      console.error("Failed to save strudel:", err);
    }
  };

  return (
    <Dialog open={isSaveStrudelDialogOpen} onOpenChange={setSaveStrudelDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Strudel</DialogTitle>
          <DialogDescription>
            Give your strudel a name to save it to your library.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="My awesome strudel"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave();
                }
              }}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={createStrudel.isPending}>
            {createStrudel.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
