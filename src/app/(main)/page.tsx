'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { StrudelEditor } from '@/components/shared/strudel-editor';
import { EditorToolbar } from '@/components/shared/editor-toolbar';
import { SidebarPanel } from '@/components/shared/sidebar-panel';
import { SyncPlaybackOverlay } from '@/components/shared/sync-playback-overlay';
import { AIInput } from '@/components/shared/ai-input';
import { Button } from '@/components/ui/button';
import { MessageCircle, Headphones } from 'lucide-react';
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

  // open sidebar on desktop (default closed for mobile), re-open when resizing to desktop
  useEffect(() => {
    // open on desktop on initial mount
    if (window.innerWidth >= MD_BREAKPOINT) {
      setChatPanelOpen(true);
    }

    const handleResize = () => {
      if (window.innerWidth >= MD_BREAKPOINT && !isChatPanelOpen) {
        setChatPanelOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoLive = () => {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }

    setInviteDialogOpen(true);
  };

  return (
    <div className={cn("flex h-full overflow-hidden pl-3 pr-3 md:pr-0 transition-[padding] duration-200 ease-out", !(canEdit && aiEnabled) && "pb-3", playerStrudel && "pb-16")}>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className={cn("flex-1 flex flex-col min-w-0 overflow-hidden rounded-xl md:rounded-l-xl md:rounded-r-none border border-border bg-background relative transition-[border-radius] duration-200 ease-out", sidebarTab === 'samples' && "md:rounded-br-xl")}>
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
        className={cn(
          "fixed right-8 z-50 md:hidden rounded-full h-12 w-12 shadow-lg !bg-background",
          canEdit && aiEnabled ? "bottom-20" : "bottom-6"
        )}
        onClick={toggleChatPanel}
        aria-label={isChatPanelOpen ? 'Close panel' : 'Open panel'}>
        {sidebarTab === 'chat' ? (
          <MessageCircle className="h-5 w-5" />
        ) : (
          <Headphones className="h-5 w-5" />
        )}
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
        <div className="fixed inset-0 z-[60] md:hidden">
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
