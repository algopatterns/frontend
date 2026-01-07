'use client';

import { useMutation } from '@tanstack/react-query';
import { agentApi } from '@/lib/api/agent';
import { useEditorStore } from '@/lib/stores/editor';
import { useWebSocketStore } from '@/lib/stores/websocket';
import { storage } from '@/lib/utils/storage';
import type { GenerateRequest, GenerateResponse } from '@/lib/api/agent/types';

interface UseAgentGenerateOptions {
  provider?: 'anthropic' | 'openai';
  providerApiKey?: string;
}

export function useAgentGenerate(options: UseAgentGenerateOptions = {}) {
  const {
    code,
    conversationHistory,
    currentStrudelId,
    forkedFromId,
    parentCCSignal,
    setAIGenerating,
    addToHistory,
  } = useEditorStore();
  const { sessionId } = useWebSocketStore();

  return useMutation({
    mutationFn: async (query: string) => {
      // block AI requests if parent strudel has no-ai restriction
      // this takes precedence over any websocket paste lock state
      if (forkedFromId && parentCCSignal === 'no-ai') {
        throw new Error('AI assistant is permanently disabled - the original author restricted AI use for this strudel');
      }

      // for saved strudels: server loads history from DB (strudel_messages table)
      // for drafts: pass history from local store
      const isSavedStrudel = !!currentStrudelId;

      const request: GenerateRequest = {
        user_query: query,
        editor_state: code,
        // only pass conversation_history for drafts - saved strudels use server-side history
        ...(!isSavedStrudel && {
          conversation_history: conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
        ...(options.provider && { provider: options.provider }),
        ...(options.providerApiKey && { provider_api_key: options.providerApiKey }),
        ...(currentStrudelId && { strudel_id: currentStrudelId }),
        ...(forkedFromId && { forked_from_id: forkedFromId }),
        ...(sessionId && { session_id: sessionId }),
      };

      return agentApi.generate(request);
    },

    onMutate: (query: string) => {
      setAIGenerating(true);

      // add user message to conversation history
      addToHistory({
        id: crypto.randomUUID(),
        role: 'user',
        content: query,
        created_at: new Date().toISOString(),
      });

      saveDraft();
    },

    onSuccess: (response: GenerateResponse) => {
      setAIGenerating(false);

      // code is NOT auto-applied to editor
      // user must click "apply to editor" button in aiMessage component

      // add assistant response to conversation history
      const hasContent = response.code || response.clarifying_questions?.length;

      if (hasContent) {
        addToHistory({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.code || '',
          is_actionable: response.is_actionable,
          is_code_response: response.is_code_response,
          clarifying_questions: response.clarifying_questions,
          strudel_references: response.strudel_references,
          doc_references: response.doc_references,
          created_at: new Date().toISOString(),
        });
      }

      saveDraft();
    },

    onError: (error: Error) => {
      setAIGenerating(false);

      // check for ai-blocked errors (403 from server)
      const isPasteLocked = error.message.includes('paste') || error.message.includes('pasted');
      const isNoAIRestricted = error.message.includes('restricted AI use');
      const isParentDeleted = error.message.includes('no longer exists');

      let errorMessage: string;
      if (isPasteLocked) {
        errorMessage = 'AI assistant is temporarily disabled for pasted code. Please make significant edits to the code before using AI assistance.';
      } else if (isNoAIRestricted) {
        errorMessage = 'AI assistant is disabled - the original author has restricted AI use for this strudel.';
      } else if (isParentDeleted) {
        errorMessage = 'AI assistant is disabled - the original strudel this was forked from no longer exists.';
      } else {
        errorMessage = `Error: ${error.message}`;
      }

      // add error message to conversation history
      addToHistory({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: errorMessage,
        is_code_response: false,
        created_at: new Date().toISOString(),
      });
    },
  });

  function saveDraft() {
    const { code, conversationHistory, currentStrudelId, currentDraftId } = useEditorStore.getState();
    const draftId = currentStrudelId || currentDraftId;

    if (draftId) {
      storage.setDraft({
        id: draftId,
        code,
        conversationHistory,
        updatedAt: Date.now(),
      });
    }
  }
}
