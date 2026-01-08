'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { StrudelEditor } from '@/components/shared/strudel-editor';
import { EditorToolbar } from '@/components/shared/editor-toolbar';
import { SidebarPanel } from '@/components/shared/sidebar-panel';
import { SyncPlaybackOverlay } from '@/components/shared/sync-playback-overlay';
import { AIInput } from '@/components/shared/ai-input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEditor } from './hooks';
import { useUIStore } from '@/lib/stores/ui';
import { useAIFeaturesEnabled } from '@/lib/hooks/use-ai-features';

function HomePageContent() {
  const searchParams = useSearchParams();
  const strudelId = searchParams.get('id');
  const forkStrudelId = searchParams.get('fork');
  const urlSessionId = searchParams.get('session_id');
  const urlInviteToken = searchParams.get('invite');
  const urlDisplayName = searchParams.get('name');

  const { setInviteDialogOpen, setLoginModalOpen } = useUIStore();
  const aiEnabled = useAIFeaturesEnabled();

  const {
    handleCodeChange,
    handlePlay,
    handleStop,
    handleSendAIRequest,
    handleSendMessage,
    handleSave,
    handleNewStrudel,
    handleEndLive,
    isChatPanelOpen,
    toggleChatPanel,
    isConnected,
    isViewer,
    canEdit,
    sessionId,
    saveStatus,
    showChat,
    isAuthenticated,
    isLive,
    isEndingLive,
  } = useEditor({ strudelId, forkStrudelId, urlSessionId, urlInviteToken, urlDisplayName });

  const handleGoLive = () => {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }

    setInviteDialogOpen(true);
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <EditorToolbar
          onPlay={handlePlay}
          onStop={handleStop}
          onSave={handleSave}
          onNew={handleNewStrudel}
          onGoLive={handleGoLive}
          onEndLive={handleEndLive}
          showSave={canEdit}
          showNew={canEdit}
          showGoLive={!!sessionId && canEdit}
          isLive={isLive}
          isEndingLive={isEndingLive}
          saveStatus={saveStatus}
          isViewer={isViewer}
        />
        <div className="flex-1 overflow-hidden">
          <StrudelEditor
            onCodeChange={handleCodeChange}
            readOnly={isViewer}
          />
        </div>
        
        {canEdit && aiEnabled && (
          <AIInput
            onSendAIRequest={handleSendAIRequest}
            disabled={!isConnected}
          />
        )}
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
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </Button>

      <div
        className={cn('transition-all duration-300 overflow-hidden hidden md:block', {
          'w-80': isChatPanelOpen,
          'w-0': !isChatPanelOpen,
        })}>
        {isChatPanelOpen && (
          <SidebarPanel
            showChat={showChat}
            onSendMessage={handleSendMessage}
            disabled={!isConnected}
            isViewer={isViewer}
          />
        )}
      </div>

      {isChatPanelOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={toggleChatPanel} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-background">
            <SidebarPanel
              showChat={showChat}
              onSendMessage={handleSendMessage}
              disabled={!isConnected}
              isViewer={isViewer}
            />
          </div>
        </div>
      )}

      <SyncPlaybackOverlay />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center">Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
