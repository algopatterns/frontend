"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useCreateStrudel, useUpdateStrudel } from "@/lib/hooks/use-strudels";
import { useEditorStore } from "@/lib/stores/editor";
import type { Strudel } from "@/lib/api/strudels/types";

interface StrudelFormDialogProps {
  strudel?: Strudel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
}

export function StrudelFormDialog({
  strudel,
  open,
  onOpenChange,
  mode,
}: StrudelFormDialogProps) {
  const router = useRouter();
  const createStrudel = useCreateStrudel();
  const updateStrudel = useUpdateStrudel();
  const { code, conversationHistory, setCurrentStrudel, markSaved } = useEditorStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [categories, setCategories] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState("");

  const isCreate = mode === "create";
  const isPending = isCreate ? createStrudel.isPending : updateStrudel.isPending;

  useEffect(() => {
    if (strudel && mode === "edit") {
      setTitle(strudel.title);
      setDescription(strudel.description || "");
      setTags(strudel.tags?.join(", ") || "");
      setCategories(strudel.categories?.join(", ") || "");
      setIsPublic(strudel.is_public);
    } else if (mode === "create") {
      setTitle("");
      setDescription("");
      setTags("");
      setCategories("");
      setIsPublic(false);
    }
  }, [strudel, mode, open]);

  const handleClose = () => {
    onOpenChange(false);
    setError("");
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }

    const formData = {
      title: title.trim(),
      description: description.trim() || undefined,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      categories: categories
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      is_public: isPublic,
    };

    try {
      if (isCreate) {
        const newStrudel = await createStrudel.mutateAsync({
          ...formData,
          code,
          conversation_history: conversationHistory.map((h) => ({
            role: h.role as "user" | "assistant",
            content: h.content,
          })),
        });

        setCurrentStrudel(newStrudel.id, newStrudel.title);
        markSaved();
        router.replace(`/?id=${newStrudel.id}`, { scroll: false });
      } else if (strudel) {
        await updateStrudel.mutateAsync({
          id: strudel.id,
          data: formData,
        });
      }

      handleClose();
    } catch (err) {
      setError(`Failed to ${isCreate ? "save" : "update"} strudel. Please try again.`);
      console.error(`Failed to ${isCreate ? "save" : "update"} strudel:`, err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isCreate ? "Save Strudel" : "Strudel Settings"}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? "Save your strudel to your library."
              : "Update your strudel details and visibility."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="strudel-title">Title</Label>
            <Input
              id="strudel-title"
              placeholder="My awesome strudel"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError("");
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
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strudel-tags">Tags</Label>
            <Input
              id="strudel-tags"
              placeholder="ambient, chill, beats (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strudel-categories">Categories</Label>
            <Input
              id="strudel-categories"
              placeholder="music, experimental (comma separated)"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="strudel-public">Make public</Label>
            <Switch
              id="strudel-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
