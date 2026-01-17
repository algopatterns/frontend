'use client';

import { Suspense, useEffect } from 'react';
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
import { usePlayerStore } from '@/lib/stores/player';
import { useAIFeaturesEnabled } from '@/lib/hooks/use-ai-features';
import { useResizable } from '@/lib/hooks/use-resizable';

const MD_BREAKPOINT = 768;

function HomePageContent() {
  const searchParams = useSearchParams();
  const strudelId = searchParams.get('id');
  const forkStrudelId = searchParams.get('fork');
  const urlSessionId = searchParams.get('session_id');
  const urlInviteToken = searchParams.get('invite');
  const urlDisplayName = searchParams.get('name');

  const {
    setInviteDialogOpen,
    setLoginModalOpen,
    setChatPanelOpen,
    chatPanelWidth,
    setChatPanelWidth,
    sidebarTab,
  } = useUIStore();
  const { currentStrudel: playerStrudel } = usePlayerStore();
  const aiEnabled = useAIFeaturesEnabled();

  const { handleMouseDown: handleSidebarMouseDown } = useResizable({
    initialSize: chatPanelWidth,
    onResize: setChatPanelWidth,
    direction: 'left',
  });

  const {
    handleCodeChange,
    handlePlay,
    handleStop,
    handleUpdate,
    handleSendAIRequest,
    handleSendMessage,
    handleSave,
    handleRestore,
    handleNewStrudel,
    handleEndLive,
    isChatPanelOpen,
    toggleChatPanel,
    isConnected,
    isViewer,
    canEdit,
    sessionId,
    saveStatus,
    hasRestorableVersion,
    showChat,
    isAuthenticated,
    isLive,
    isEndingLive,
  } = useEditor({
    strudelId,
    forkStrudelId,
    urlSessionId,
    urlInviteToken,
    urlDisplayName,
  });

  // re-open sidebar when switching from mobile to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= MD_BREAKPOINT && !isChatPanelOpen) {
        setChatPanelOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isChatPanelOpen, setChatPanelOpen]);

  const handleGoLive = () => {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }

    setInviteDialogOpen(true);
  };

  return (
    <div className={cn("flex h-full overflow-hidden pl-3", !(canEdit && aiEnabled) && "pb-3", playerStrudel && "pb-16")}>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className={cn("flex-1 flex flex-col min-w-0 overflow-hidden rounded-l-xl border border-border bg-background relative", ((canEdit && aiEnabled) || sidebarTab === 'samples') && "rounded-br-xl")}>
          <EditorToolbar
            onPlay={handlePlay}
            onStop={handleStop}
            onUpdate={handleUpdate}
            onSave={handleSave}
            onRestore={handleRestore}
            onNew={handleNewStrudel}
            onGoLive={handleGoLive}
            onEndLive={handleEndLive}
            showSave={canEdit}
            showNew={canEdit}
            showGoLive={!!sessionId && canEdit}
            isLive={isLive}
            isEndingLive={isEndingLive}
            saveStatus={saveStatus}
            hasRestorableVersion={hasRestorableVersion()}
            isViewer={isViewer}
          />
          <div className="flex-1 overflow-hidden">
            <StrudelEditor onCodeChange={handleCodeChange} readOnly={isViewer} />
          </div>
          {isChatPanelOpen && (
            <div
              onMouseDown={handleSidebarMouseDown}
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-10"
            />
          )}
        </div>

        {canEdit && aiEnabled && (
          <AIInput onSendAIRequest={handleSendAIRequest} disabled={!isConnected} />
        )}
      </div>

      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-20 right-3 z-50 md:hidden rounded-full h-12 w-12 shadow-lg !bg-background"
        onClick={toggleChatPanel}
        aria-label={isChatPanelOpen ? 'Close samples panel' : 'Open samples panel'}>
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
        className={cn('overflow-hidden hidden md:flex', {
          'w-0': !isChatPanelOpen,
        })}
        style={{ width: isChatPanelOpen ? chatPanelWidth : 0 }}>
        {isChatPanelOpen && (
          <div className="flex-1 min-w-0 overflow-hidden">
            <SidebarPanel
              showChat={showChat}
              onSendMessage={handleSendMessage}
              disabled={!isConnected}
              isViewer={isViewer}
            />
          </div>
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
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">Loading...</div>
      }>
      <HomePageContent />
    </Suspense>
  );
}
