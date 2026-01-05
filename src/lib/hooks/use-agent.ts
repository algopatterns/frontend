'use client';

import { useMutation } from '@tanstack/react-query';
import { agentApi } from '@/lib/api/agent';
import { useEditorStore } from '@/lib/stores/editor';
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
    setCode,
    setAIGenerating,
    addToHistory,
  } = useEditorStore();

  return useMutation({
    mutationFn: async (query: string) => {
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

      // update editor if code response
      if (response.code && response.is_code_response) {
        setCode(response.code, false);
      }

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
          created_at: new Date().toISOString(),
        });
      }

      saveDraft();
    },

    onError: (error: Error) => {
      setAIGenerating(false);

      // add error message to conversation history
      addToHistory({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${error.message}`,
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
