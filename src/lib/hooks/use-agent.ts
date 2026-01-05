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
    setCode,
    setAIGenerating,
    addToHistory,
  } = useEditorStore();

  const { addMessage } = useWebSocketStore();

  return useMutation({
    mutationFn: async (query: string) => {
      // build request
      // for saved strudels: server loads history from DB (strudel_messages table)
      // for drafts: pass history from local store
      const isSavedStrudel = !!currentStrudelId;

      const request: GenerateRequest = {
        user_query: query,
        editor_state: code,
        // only pass conversation_history for drafts - saved strudels use server-side history
        ...(!isSavedStrudel && { conversation_history: conversationHistory }),
        ...(options.provider && { provider: options.provider }),
        ...(options.providerApiKey && { provider_api_key: options.providerApiKey }),
        ...(currentStrudelId && { strudel_id: currentStrudelId }),
      };

      return agentApi.generate(request);
    },

    onMutate: (query: string) => {
      setAIGenerating(true);

      // add user message to conversation history
      addToHistory('user', query);

      // add user message to chat UI
      addMessage({
        id: crypto.randomUUID(),
        type: 'user',
        content: query,
        isAIRequest: true,
        timestamp: new Date().toISOString(),
      });

      // save draft with updated conversation
      saveDraft();
    },

    onSuccess: (response: GenerateResponse) => {
      setAIGenerating(false);

      // if response has code and is a code response, update editor
      if (response.code && response.is_code_response) {
        setCode(response.code, false);
        addToHistory('assistant', response.code);
      }

      // add assistant message to chat UI
      addMessage({
        id: crypto.randomUUID(),
        type: 'assistant',
        content: response.code || '',
        isCodeResponse: response.is_code_response,
        isActionable: response.is_actionable,
        clarifyingQuestions: response.clarifying_questions,
        timestamp: new Date().toISOString(),
      });

      // save draft with updated conversation
      saveDraft();
    },

    onError: (error: Error) => {
      setAIGenerating(false);

      // add error message to chat UI
      addMessage({
        id: crypto.randomUUID(),
        type: 'system',
        content: `AI error: ${error.message}`,
        timestamp: new Date().toISOString(),
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
