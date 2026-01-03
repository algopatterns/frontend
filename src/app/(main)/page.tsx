'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { StrudelEditor } from '@/components/shared/strudel-editor';
import { EditorToolbar } from '@/components/shared/editor-toolbar';
import { SidebarPanel } from '@/components/shared/sidebar-panel';
import { AIInput } from '@/components/shared/ai-input';
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
    sessionId,
    saveStatus,
    isLive,
  } = useEditor({ strudelId, forkStrudelId });

  const handleShare = () => {
    setInviteDialogOpen(true);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Main editor area */}
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
          />
        </div>
        {/* AI Input at bottom of editor */}
        <AIInput
          onSendAIRequest={handleSendAIRequest}
          disabled={!isConnected}
        />
      </div>

      {/* Mobile toggle button for sidebar */}
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
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </Button>

      {/* Desktop sidebar */}
      <div
        className={cn('transition-all duration-300 overflow-hidden hidden md:block', {
          'w-80': isChatPanelOpen,
          'w-0': !isChatPanelOpen,
        })}>
        {isChatPanelOpen && (
          <SidebarPanel
            isLive={isLive}
            onSendMessage={handleSendMessage}
            disabled={!isConnected}
          />
        )}
      </div>

      {/* Mobile sidebar overlay */}
      {isChatPanelOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={toggleChatPanel} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-background">
            <SidebarPanel
              isLive={isLive}
              onSendMessage={handleSendMessage}
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
