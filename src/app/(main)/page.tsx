"use client";

import { useCallback } from "react";
import { StrudelEditor } from "@/components/shared/strudel-editor";
import { EditorToolbar } from "@/components/shared/editor-toolbar";
import { ChatPanel } from "@/components/shared/chat-panel";
import { useStrudelAudio } from "@/lib/hooks/use-strudel-audio";
import { useWebSocket } from "@/lib/hooks/use-websocket";
import { useUIStore } from "@/lib/stores/ui";
import { useAuthStore } from "@/lib/stores/auth";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { evaluate, stop } = useStrudelAudio();
  const { token } = useAuthStore();
  const { isChatPanelOpen, toggleChatPanel } = useUIStore();
  const {
    sendCode,
    sendAgentRequest,
    sendChatMessage,
    isConnected,
    canEdit,
    sessionId,
  } = useWebSocket({
    autoConnect: true,
  });

  const handleCodeChange = useCallback(
    (newCode: string) => {
      if (isConnected && canEdit) {
        sendCode(newCode);
      }
    },
    [isConnected, canEdit, sendCode]
  );

  const handlePlay = useCallback(() => {
    evaluate();
  }, [evaluate]);

  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  const handleSendAIRequest = useCallback(
    (query: string) => {
      sendAgentRequest(query);
    },
    [sendAgentRequest]
  );

  const handleSendMessage = useCallback(
    (message: string) => {
      sendChatMessage(message);
    },
    [sendChatMessage]
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Editor Section */}
      <div className="flex-1 flex flex-col min-w-0">
        <EditorToolbar
          onPlay={handlePlay}
          onStop={handleStop}
          showSave={!!token}
          showShare={!!sessionId && !!token}
        />
        <div className="flex-1 overflow-hidden">
          <StrudelEditor
            onCodeChange={handleCodeChange}
            readOnly={!canEdit && isConnected}
          />
        </div>
      </div>

      {/* Chat Panel Toggle Button (Mobile) */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-50 md:hidden rounded-full h-12 w-12 shadow-lg"
        onClick={toggleChatPanel}
      >
        <ChatIcon className="h-5 w-5" />
      </Button>

      {/* Chat Panel */}
      <div
        className={`
          ${isChatPanelOpen ? "w-80" : "w-0"}
          transition-all duration-300
          overflow-hidden
          hidden md:block
        `}
      >
        {isChatPanelOpen && (
          <ChatPanel
            onSendMessage={handleSendMessage}
            onSendAIRequest={handleSendAIRequest}
            disabled={!isConnected}
          />
        )}
      </div>

      {/* Mobile Chat Panel Overlay */}
      {isChatPanelOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={toggleChatPanel}
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-background">
            <ChatPanel
              onSendMessage={handleSendMessage}
              onSendAIRequest={handleSendAIRequest}
              disabled={!isConnected}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ChatIcon({ className }: { className?: string }) {
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
