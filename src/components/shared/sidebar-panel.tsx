"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SamplesPanel } from "./samples-panel";
import { SessionChatPanel } from "./session-chat-panel";
import { Music, MessageCircle } from "lucide-react";

interface SidebarPanelProps {
  isLive: boolean;
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function SidebarPanel({
  isLive,
  onSendMessage,
  disabled = false,
}: SidebarPanelProps) {
  const [activeTab, setActiveTab] = useState("samples");

  return (
    <div className="flex flex-col h-full border-l border-t bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        {/* Tab headers - matches editor toolbar height */}
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-12 px-2">
          <TabsTrigger
            value="samples"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <Music className="h-4 w-4 mr-2" />
            Samples
          </TabsTrigger>
          {isLive && (
            <TabsTrigger
              value="chat"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab content */}
        <TabsContent value="samples" className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden">
          <SamplesPanel />
        </TabsContent>
        {isLive && (
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
