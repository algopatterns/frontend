'use client';

import { useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { agentApi } from '@/lib/api/agent';
import { useEditorStore } from '@/lib/stores/editor';
import { useWebSocketStore } from '@/lib/stores/websocket';
import { storage } from '@/lib/utils/storage';
import { getBYOKProvider, getBYOKApiKey } from '@/components/shared/settings-modal/hooks';
import type { GenerateRequest, GenerateResponse, StreamEvent } from '@/lib/api/agent/types';

export function useAgentGenerate() {
  const {
    code,
    conversationHistory,
    currentStrudelId,
    forkedFromId,
    parentCCSignal,
    setAIGenerating,
    addToHistory,
    updateMessage,
  } = useEditorStore();
  const { sessionId } = useWebSocketStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  return useMutation({
    meta: { skipGlobalErrorToast: true }, // errors shown in conversation UI instead
    mutationFn: async (query: string) => {
      // block AI requests if forked and parent has no signal or no-ai restriction
      // default to restrictive (no-ai) when signal is missing
      const parentSignalBlocksAI = !parentCCSignal || parentCCSignal === 'no-ai';
      if (forkedFromId && parentSignalBlocksAI) {
        throw new Error('AI assistant is disabled - the original strudel does not permit AI use');
      }

      // for saved strudels: server loads history from DB (strudel_messages table)
      // for drafts: pass history from local store
      const isSavedStrudel = !!currentStrudelId;

      // get BYOK settings from localStorage
      const byokApiKey = getBYOKApiKey();
      const byokProvider = byokApiKey ? getBYOKProvider() : undefined;

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
        ...(byokProvider && { provider: byokProvider }),
        ...(byokApiKey && { provider_api_key: byokApiKey }),
        ...(currentStrudelId && { strudel_id: currentStrudelId }),
        ...(forkedFromId && { forked_from_id: forkedFromId }),
        ...(sessionId && { session_id: sessionId }),
      };

      // use streaming for BYOK users
      if (byokApiKey) {
        return streamGenerate(request);
      }

      // fall back to non-streaming for platform API
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

      // for non-streaming responses, add to history
      // streaming responses are already added during the stream
      if (!response._streamed) {
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
      }

      saveDraft();
    },

    onError: (error: Error) => {
      setAIGenerating(false);

      // check for specific error types
      const isPasteLocked = error.message.includes('paste') || error.message.includes('pasted');
      const isNoAIRestricted = error.message.includes('restricted AI use');
      const isParentDeleted = error.message.includes('no longer exists');
      const isRateLimited = error.message.includes('rate_limit') || error.message.includes('Daily AI limit');

      let errorMessage: string;
      if (isRateLimited) {
        errorMessage = "You've reached your daily AI limit. Try again tomorrow, or add your own API key in Settings for unlimited access.";
      } else if (isPasteLocked) {
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

  // streaming generation for BYOK users
  async function streamGenerate(request: GenerateRequest): Promise<GenerateResponse & { _streamed?: boolean }> {
    // create abort controller for this request
    abortControllerRef.current = new AbortController();

    // create placeholder message for streaming
    const messageId = crypto.randomUUID();
    let streamedContent = '';
    let refs: { strudel_references?: StreamEvent['strudel_references']; doc_references?: StreamEvent['doc_references'] } = {};
    let finalContent = '';
    let finalIsCode = false;
    let finalModel = '';

    // add streaming message to history
    addToHistory({
      id: messageId,
      role: 'assistant',
      content: '',
      is_streaming: true,
      created_at: new Date().toISOString(),
    });

    try {
      await agentApi.generateStream(
        request,
        (event: StreamEvent) => {
          switch (event.type) {
            case 'refs':
              // store refs for later
              refs = {
                strudel_references: event.strudel_references,
                doc_references: event.doc_references,
              };
              // update message with refs
              updateMessage(messageId, refs);
              break;

            case 'chunk':
              // append chunk to content
              streamedContent += event.content || '';
              updateMessage(messageId, { content: streamedContent });
              break;

            case 'done':
              finalContent = event.content || streamedContent;
              finalIsCode = event.is_code_response || false;
              finalModel = event.model || '';
              // update with final processed content and metadata
              updateMessage(messageId, {
                content: finalContent,
                is_streaming: false,
                is_code_response: finalIsCode,
                strudel_references: event.strudel_references || refs.strudel_references,
                doc_references: event.doc_references || refs.doc_references,
              });
              break;

            case 'error':
              updateMessage(messageId, {
                content: `Error: ${event.error}`,
                is_streaming: false,
              });
              throw new Error(event.error);
          }
        },
        abortControllerRef.current.signal
      );

      // return response in expected format
      return {
        code: finalContent || streamedContent,
        is_actionable: true,
        is_code_response: finalIsCode,
        docs_retrieved: 0,
        examples_retrieved: 0,
        strudel_references: refs.strudel_references,
        doc_references: refs.doc_references,
        model: finalModel,
        _streamed: true, // flag to skip adding to history in onSuccess
      };
    } catch (error) {
      // update message with error if not already updated
      updateMessage(messageId, {
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        is_streaming: false,
      });
      throw error;
    }
  }

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
