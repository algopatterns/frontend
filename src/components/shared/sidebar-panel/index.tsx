'use client';

import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SamplesPanel } from '../samples-panel';
import { SessionChatPanel, useSessionChatPanel } from '../session-chat-panel';
import { Headphones, MessageCircle, ArrowUp } from 'lucide-react';
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
  const { input, setInput, handleSend, handleKeyDown } = useSessionChatPanel(
    onSendMessage,
    disabled
  );

  // both tabs visible when user is not a viewer and chat is enabled
  const bothTabsVisible = mounted && showChat && !isViewer;

  return (
    <div className="flex flex-col h-full">
      {/* Main content */}
      <div
        className={cn(
          'flex-1 min-h-0 bg-background overflow-hidden',
          effectiveTab === 'samples' && 'rounded-bl-xl'
        )}>
        <Tabs
          value={effectiveTab}
          onValueChange={setSelectedTab}
          className="flex flex-col h-full">
          <TabsList className="w-full rounded-none bg-transparent h-12 p-0 flex border-t border-b">
            {(!mounted || !isViewer) && (
              <TabsTrigger
                value="samples"
                className={cn(
                  "flex-1 h-full rounded-none !border-none shadow-none",
                  bothTabsVisible ? "!bg-transparent data-[state=active]:!bg-foreground data-[state=active]:!text-background" : ""
                )}>
                <Headphones className="h-4 w-4 mr-1" />
                Samples
              </TabsTrigger>
            )}

            {(!mounted || showChat) && (
              <TabsTrigger
                value="chat"
                className={cn(
                  "flex-1 h-full rounded-none !border-none shadow-none",
                  bothTabsVisible ? "!bg-transparent data-[state=active]:!bg-foreground data-[state=active]:!text-background" : ""
                )}>
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

      {/* Footer */}
      <div
        className={cn(
          'h-16 shrink-0 bg-background flex items-stretch justify-stretch transition-[border] duration-200 ease-out',
          {
            'border-b': effectiveTab === 'chat',
          }
        )}>
        {effectiveTab === 'samples' ? (
          <div className="p-3 flex items-center justify-center w-full">
            <div className="flex items-center gap-4 opacity-80">
              <Link
                href="/about"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                ABOUT
              </Link>
              <a
                href="https://codeberg.org/algorave"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                CODEBERG
              </a>
              <a
                href="https://strudel.cc/workshop/getting-started"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                STRUDEL
              </a>
            </div>
          </div>
        ) : (
          <div className="p-3 flex items-center w-full">
            <div className="bg-muted/50 border border-muted rounded-lg px-3 py-2 flex items-center gap-2 w-full">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Send a message..."
                disabled={disabled}
                className="flex-1 bg-transparent text-sm focus:outline-none disabled:opacity-50"
              />
              <Button
                size="icon"
                className="h-7 w-7 rounded-md bg-primary hover:bg-primary/90 shrink-0"
                onClick={handleSend}
                disabled={disabled || !input.trim()}>
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
