"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEditorStore } from "@/lib/stores/editor";

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
  const [message, setMessage] = useState("");
  const [isAIMode, setIsAIMode] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isAIGenerating } = useEditorStore();

  const handleSubmit = () => {
    if (!message.trim() || disabled || isAIGenerating) return;

    if (isAIMode) {
      onSendAIRequest(message.trim());
    } else {
      onSendMessage(message.trim());
    }

    setMessage("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t p-3 bg-background">
      <div className="flex gap-2 mb-2">
        <Button
          size="sm"
          variant={isAIMode ? "default" : "outline"}
          onClick={() => setIsAIMode(true)}
          className="text-xs"
        >
          Ask AI
        </Button>
        <Button
          size="sm"
          variant={!isAIMode ? "default" : "outline"}
          onClick={() => setIsAIMode(false)}
          className="text-xs"
        >
          Chat
        </Button>
      </div>
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isAIMode
              ? "Ask AI to help with your pattern..."
              : "Send a message..."
          }
          disabled={disabled || isAIGenerating}
          className="flex-1"
        />
        <Button
          onClick={handleSubmit}
          disabled={!message.trim() || disabled || isAIGenerating}
        >
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

function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
