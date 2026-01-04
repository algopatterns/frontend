"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SamplesPanel } from "./samples-panel";
import { SessionChatPanel } from "./session-chat-panel";
import { Music, MessageCircle } from "lucide-react";

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

  // compute effective tab: if viewer has samples selected but can't see it, force chat
  const effectiveTab = (() => {
    // user hasn't selected anything yet - use default
    if (selectedTab === null) {
      return isViewer && showChat ? "chat" : "samples";
    }
    
    // viewer can't see samples tab - force to chat
    if (isViewer && selectedTab === "samples" && showChat) {
      return "chat";
    }
    
    return selectedTab;
  })();

  return (
    <div className="flex flex-col h-full border-l border-t bg-background">
      <Tabs value={effectiveTab} onValueChange={setSelectedTab} className="flex flex-col h-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-12 px-2">
          {!isViewer && (
            <TabsTrigger
              value="samples"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Music className="h-4 w-4 mr-2" />
              Samples
            </TabsTrigger>
          )}
          
          {showChat && (
            <TabsTrigger
              value="chat"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </TabsTrigger>
          )}
        </TabsList>

        {!isViewer && (
          <TabsContent value="samples" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
            <SamplesPanel />
          </TabsContent>
        )}

        {showChat && (
          <TabsContent value="chat" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
            <SessionChatPanel
              onSendMessage={onSendMessage}
              disabled={disabled}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
