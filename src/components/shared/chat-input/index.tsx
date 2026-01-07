'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SendIcon, SpinnerIcon } from '@/components/ui/icons';
import { useChatInput } from './hooks';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onSendAIRequest: (query: string) => void;
  disabled?: boolean;
}

export function ChatInput({
  onSendMessage,
  onSendAIRequest,
  disabled = false,
}: ChatInputProps) {
  const {
    message,
    setMessage,
    isAIMode,
    setIsAIMode,
    inputRef,
    isAIGenerating,
    handleSubmit,
    handleKeyDown,
  } = useChatInput(onSendMessage, onSendAIRequest, disabled);

  return (
    <div className="border-t p-3 bg-background">
      <div className="flex gap-2 mb-2">
        <Button
          size="sm"
          variant={isAIMode ? 'default' : 'outline'}
          onClick={() => setIsAIMode(true)}
          className="text-xs">
          Ask AI
        </Button>
        <Button
          size="sm"
          variant={!isAIMode ? 'default' : 'outline'}
          onClick={() => setIsAIMode(false)}
          className="text-xs">
          Chat
        </Button>
      </div>
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isAIMode ? 'Ask AI to help with your pattern...' : 'Send a message...'
          }
          disabled={disabled || isAIGenerating}
          className="flex-1"
        />
        <Button
          onClick={handleSubmit}
          disabled={!message.trim() || disabled || isAIGenerating}>
          {isAIGenerating ? (
            <SpinnerIcon className="h-4 w-4 animate-spin" />
          ) : (
            <SendIcon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
