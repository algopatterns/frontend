'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { StrudelEditor } from '@/components/shared/strudel-editor';
import { EditorToolbar } from '@/components/shared/editor-toolbar';
import { ChatPanel } from '@/components/shared/chat-panel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEditor } from './hooks';
import { useUIStore } from '@/lib/stores/ui';

function HomePageContent() {
  const searchParams = useSearchParams();
  const strudelId = searchParams.get('id');
  const forkStrudelId = searchParams.get('fork');

  const { setInviteDialogOpen } = useUIStore();

  const {
    handleCodeChange,
    handlePlay,
    handleStop,
    handleSendAIRequest,
    handleSendMessage,
    handleSave,
    handleNewStrudel,
    isChatPanelOpen,
    toggleChatPanel,
    isConnected,
    canEdit,
    sessionId,
    saveStatus,
    isLoadingStrudel,
  } = useEditor({ strudelId, forkStrudelId });

  const handleShare = () => {
    setInviteDialogOpen(true);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div className="flex-1 flex flex-col min-w-0">
        <EditorToolbar
          onPlay={handlePlay}
          onStop={handleStop}
          onSave={handleSave}
          onNew={handleNewStrudel}
          onShare={handleShare}
          showSave={true}
          showNew={true}
          showShare={!!sessionId}
          saveStatus={saveStatus}
        />
        <div className="flex-1 overflow-hidden">
          <StrudelEditor
            onCodeChange={handleCodeChange}
            readOnly={!canEdit && isConnected}
          />
        </div>
      </div>

      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-50 md:hidden rounded-full h-12 w-12 shadow-lg"
        onClick={toggleChatPanel}>
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </Button>

      <div
        className={cn('transition-all duration-300 overflow-hidden md:block', {
          'w-80': isChatPanelOpen,
          'translate-x-full': !isChatPanelOpen,
        })}>
        {isChatPanelOpen && (
          <ChatPanel
            onSendMessage={handleSendMessage}
            onSendAIRequest={handleSendAIRequest}
            disabled={!isConnected}
          />
        )}
      </div>

      {isChatPanelOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={toggleChatPanel} />
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

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
