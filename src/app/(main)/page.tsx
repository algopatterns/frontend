'use client';

import { Suspense, useEffect, useCallback } from 'react';
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
    desktopSidebarOpen,
    setDesktopSidebarOpen,
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
    handleFormat,
    isChatPanelOpen,
    toggleChatPanel,
    isConnected,
    isViewer,
    isHost,
    canEdit,
    sessionId,
    saveStatus,
    hasRestorableVersion,
    showChat,
    isAuthenticated,
    isLive,
    isEndingLive,
    isFormatting,
  } = useEditor({
    strudelId,
    forkStrudelId,
    urlSessionId,
    urlInviteToken,
    urlDisplayName,
  });

  // sync sidebar state with desktop preference on mount and resize
  useEffect(() => {
    // on desktop, use persisted preference; on mobile, start closed
    if (window.innerWidth >= MD_BREAKPOINT) {
      setChatPanelOpen(desktopSidebarOpen);
    }

    const handleResize = () => {
      if (window.innerWidth >= MD_BREAKPOINT) {
        setChatPanelOpen(desktopSidebarOpen);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [desktopSidebarOpen, setChatPanelOpen]);

  const handleGoLive = () => {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }

    setInviteDialogOpen(true);
  };

  const handleToggleDesktopSidebar = () => {
    const newState = !isChatPanelOpen;
    setChatPanelOpen(newState);
    setDesktopSidebarOpen(newState);
  };

  // keyboard shortcut for format (Alt+Shift+F)
  useEffect(() => {
    if (!canEdit) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        handleFormat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canEdit, handleFormat]);

  // when sidebar is collapsed on desktop, use mobile-like styling
  const sidebarVisible = isChatPanelOpen;

  return (
    <div className={cn("flex h-full overflow-hidden pl-3 pr-3 transition-[padding] duration-200 ease-out", sidebarVisible && "md:pr-0", !(canEdit && aiEnabled) && "pb-3", playerStrudel && "pb-16")}>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className={cn("flex-1 flex flex-col min-w-0 overflow-hidden rounded-xl border border-border bg-background relative transition-[border-radius] duration-200 ease-out", sidebarVisible && "md:rounded-l-xl md:rounded-r-none", sidebarVisible && sidebarTab === 'samples' && "md:rounded-br-xl", playerStrudel && !(canEdit && aiEnabled) && "border-b-0 !rounded-bl-none !rounded-br-none")}>
          <EditorToolbar
            onPlay={handlePlay}
            onStop={handleStop}
            onUpdate={handleUpdate}
            onSave={handleSave}
            onRestore={handleRestore}
            onNew={handleNewStrudel}
            onGoLive={handleGoLive}
            onEndLive={isHost ? handleEndLive : undefined}
            onToggleSidebar={handleToggleDesktopSidebar}
            onFormat={canEdit ? handleFormat : undefined}
            showSave={canEdit}
            showNew={canEdit}
            showGoLive={!!sessionId && canEdit}
            isLive={isLive}
            isEndingLive={isEndingLive}
            isSidebarOpen={sidebarVisible}
            saveStatus={saveStatus}
            hasRestorableVersion={hasRestorableVersion()}
            isViewer={isViewer}
            isFormatting={isFormatting}
          />
          <div className="flex-1 overflow-hidden">
            <StrudelEditor onCodeChange={handleCodeChange} readOnly={isViewer} />
          </div>
          {sidebarVisible && (
            <div
              onMouseDown={handleSidebarMouseDown}
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-10 hidden md:block"
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
          "fixed right-7 z-50 md:hidden rounded-full h-12 w-12 shadow-lg !bg-background",
          canEdit && aiEnabled
            ? playerStrudel ? "bottom-36" : "bottom-20"
            : playerStrudel ? "bottom-20" : "bottom-6"
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
