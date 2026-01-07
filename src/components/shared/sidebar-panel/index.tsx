'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SamplesPanel } from '../samples-panel';
import { SessionChatPanel } from '../session-chat-panel';
import { Headphones, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarPanel } from './hooks';

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
  const { setSelectedTab, mounted, effectiveTab } = useSidebarPanel(showChat, isViewer);

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
