"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/lib/websocket/types";

interface ChatMessageProps {
  message: ChatMessageType;
  compact?: boolean;
}

export function ChatMessage({ message, compact = false }: ChatMessageProps) {
  const { type, content, displayName, clarifyingQuestions, timestamp } = message;

  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (type === "system") {
    return (
      <div className={cn(
        "text-center text-muted-foreground",
        compact ? "text-[10px] py-0.5" : "text-xs py-1"
      )}>
        {content}
      </div>
    );
  }

  if (type === "assistant") {
    return (
      <div className={cn(
        "bg-primary/10 rounded-none",
        compact ? "p-2 mb-1" : "p-3 mb-2"
      )}>
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(
            "font-medium text-primary",
            compact ? "text-[10px]" : "text-xs"
          )}>AI</span>
          {!compact && (
            <span className="text-xs text-muted-foreground">{formattedTime}</span>
          )}
        </div>
        {content && (
          <pre className={cn(
            "whitespace-pre-wrap font-mono bg-background/50 rounded-none overflow-x-auto",
            compact ? "text-xs p-1.5 mt-1" : "text-sm p-2 mt-2"
          )}>
            {content}
          </pre>
        )}
        {clarifyingQuestions && clarifyingQuestions.length > 0 && (
          <div className={cn("space-y-1", compact ? "mt-1" : "mt-2")}>
            <p className={cn(
              "text-muted-foreground",
              compact ? "text-[10px]" : "text-xs"
            )}>
              I need more information:
            </p>
            <ul className={cn(
              "list-disc list-inside space-y-1",
              compact ? "text-xs" : "text-sm"
            )}>
              {clarifyingQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-none",
        compact ? "p-2 mb-1" : "p-3 mb-2",
        type === "user" ? "bg-secondary" : "bg-muted"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={cn(
          "font-medium",
          compact ? "text-[10px]" : "text-xs"
        )}>{displayName || "You"}</span>
        {!compact && (
          <span className="text-xs text-muted-foreground">{formattedTime}</span>
        )}
      </div>
      <p className={compact ? "text-xs" : "text-sm"}>{content}</p>
    </div>
  );
}
