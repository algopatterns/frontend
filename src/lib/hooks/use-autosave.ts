"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useEditorStore } from "@/lib/stores/editor";
import { useAuthStore } from "@/lib/stores/auth";
import { useUIStore } from "@/lib/stores/ui";
import { useUpdateStrudel } from "@/lib/hooks/use-strudels";

type SaveStatus = "saved" | "saving" | "unsaved";

const AUTOSAVE_DEBOUNCE_MS = 3000;

export function useAutosave() {
  const { isDirty, code, conversationHistory, currentStrudelId, markSaved } = useEditorStore();
  const { token } = useAuthStore();
  const { setLoginModalOpen, setSaveStrudelDialogOpen } = useUIStore();
  const updateStrudel = useUpdateStrudel();
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAuthenticated = !!token;
  const hasStrudel = !!currentStrudelId;

  // Determine save status
  const getSaveStatus = useCallback((): SaveStatus => {
    if (isSaving) return "saving";
    if (!isAuthenticated) return "unsaved"; // Always show unsaved for anonymous
    if (!hasStrudel) return "unsaved"; // No strudel saved yet
    if (isDirty) return "unsaved";
    return "saved";
  }, [isSaving, isAuthenticated, hasStrudel, isDirty]);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>(getSaveStatus);

  // Update save status when dependencies change
  useEffect(() => {
    setSaveStatus(getSaveStatus());
  }, [getSaveStatus]);

  // Autosave for authenticated users with an existing strudel
  useEffect(() => {
    if (!isAuthenticated || !hasStrudel || !isDirty) {
      return;
    }

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce the autosave
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await updateStrudel.mutateAsync({
          id: currentStrudelId,
          data: {
            code,
            conversation_history: conversationHistory.map(h => ({
              role: h.role as "user" | "assistant",
              content: h.content,
              is_actionable: h.is_actionable,
              is_code_response: h.is_code_response,
              clarifying_questions: h.clarifying_questions,
              strudel_references: h.strudel_references,
              doc_references: h.doc_references,
            })),
          },
        });
        markSaved();
      } catch (error) {
        console.error("Autosave failed:", error);
      } finally {
        setIsSaving(false);
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isAuthenticated, hasStrudel, isDirty, currentStrudelId, code, conversationHistory, markSaved, updateStrudel]);

  // Handle manual save click
  const handleSave = useCallback(async () => {
    if (!isAuthenticated) {
      // Prompt login for anonymous users
      setLoginModalOpen(true);
      return;
    }

    if (!hasStrudel) {
      // First time save - open dialog to enter title
      setSaveStrudelDialogOpen(true);
      return;
    }

    // Clear any pending autosave
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Save immediately
    setIsSaving(true);
    try {
      await updateStrudel.mutateAsync({
        id: currentStrudelId,
        data: {
          code,
          conversation_history: conversationHistory.map(h => ({
            role: h.role as "user" | "assistant",
            content: h.content,
            is_actionable: h.is_actionable,
            is_code_response: h.is_code_response,
            clarifying_questions: h.clarifying_questions,
            strudel_references: h.strudel_references,
            doc_references: h.doc_references,
          })),
        },
      });
      markSaved();
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, [isAuthenticated, hasStrudel, currentStrudelId, code, conversationHistory, setLoginModalOpen, setSaveStrudelDialogOpen, markSaved, updateStrudel]);

  return {
    saveStatus,
    handleSave,
    isAuthenticated,
    hasStrudel,
  };
}
