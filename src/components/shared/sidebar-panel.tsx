'use client';

import { useState, useSyncExternalStore } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SamplesPanel } from './samples-panel';
import { SessionChatPanel } from './session-chat-panel';
import { Headphones, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// hydration-safe mount detection using useSyncExternalStore
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

interface SidebarPanelProps {
  showChat: boolean;
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  isViewer?: boolean;
}

export function SidebarPanel({
  showChat,
  onSendMessage,
  disabled = false,
  isViewer = false,
}: SidebarPanelProps) {
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  // returns false on server, true on client - avoids hydration mismatch
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // compute effective tab: if viewer has samples selected but can't see it, force chat
  // use stable default ('samples') until mounted to avoid hydration mismatch
  const effectiveTab = (() => {
    if (!mounted) {
      return 'samples'; // stable default for SSR
    }

    // user hasn't selected anything yet - use default based on role
    if (selectedTab === null) {
      return isViewer && showChat ? 'chat' : 'samples';
    }

    // viewer can't see samples tab - force to chat
    if (isViewer && selectedTab === 'samples' && showChat) {
      return 'chat';
    }

    return selectedTab;
  })();

  return (
    <div className="flex flex-col h-full border-l bg-background">
      <Tabs
        value={effectiveTab}
        onValueChange={setSelectedTab}
        className="flex flex-col h-full">
        <TabsList
          className={cn('w-full rounded-none border-b bg-transparent h-12', {
            'flex items-center px-1.5 gap-1.5': mounted && !isViewer && showChat,
            'p-0': mounted && (isViewer || !showChat),
          })}>
          {(!mounted || !isViewer) && (
            <TabsTrigger
              value="samples"
              className={cn('flex-1 rounded-none border-none shadow-none', {
                'data-[state=active]:bg-transparent data-[state=active]:h-9':
                  mounted && !isViewer && showChat,
              })}>
              <Headphones className="h-4 w-4 mr-1" />
              Samples
            </TabsTrigger>
          )}

          {(!mounted || showChat) && (
            <TabsTrigger
              value="chat"
              className={cn('flex-1 rounded-none border-none shadow-none', {
                'data-[state=active]:bg-transparent data-[state=active]:h-9':
                  mounted && !isViewer && showChat,
              })}>
              <MessageCircle className="h-4 w-4 mr-1" />
              Chat
            </TabsTrigger>
          )}
        </TabsList>

        {/* Always render both TabsContent to avoid hydration mismatch */}
        {(!mounted || !isViewer) && (
          <TabsContent
            value="samples"
            className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
            <SamplesPanel />
          </TabsContent>
        )}

        {(!mounted || showChat) && (
          <TabsContent
            value="chat"
            className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
            <SessionChatPanel onSendMessage={onSendMessage} disabled={disabled} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
