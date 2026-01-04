"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAudioStore } from "@/lib/stores/audio";
import { useEditorStore } from "@/lib/stores/editor";
import { useWebSocketStore } from "@/lib/stores/websocket";
import {
  Play,
  Square,
  Cloud,
  Loader2,
  FilePlus,
  Share2,
} from "lucide-react";

type SaveStatus = "saved" | "saving" | "unsaved";

interface EditorToolbarProps {
  onPlay: () => void;
  onStop: () => void;
  onSave?: () => void;
  onNew?: () => void;
  onShare?: () => void;
  showSave?: boolean;
  showNew?: boolean;
  showShare?: boolean;
  saveStatus?: SaveStatus;
  isViewer?: boolean;
}

export function EditorToolbar({
  onPlay,
  onStop,
  onSave,
  onNew,
  onShare,
  showSave = false,
  showNew = false,
  showShare = false,
  saveStatus = "saved",
  isViewer = false,
}: EditorToolbarProps) {
  const { isPlaying, isInitialized } = useAudioStore();
  const { isAIGenerating } = useEditorStore();
  const { status } = useWebSocketStore();

  return (
    <div className="flex items-center gap-2 p-2 border-b bg-background h-12">
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant={isPlaying ? "secondary" : "default"}
          onClick={onPlay}
          disabled={!isInitialized || isViewer}
          title={isViewer ? "Only hosts can control playback" : "Play (Ctrl+Enter)"}
        >
          <Play className="h-4 w-4 mr-1" />
          Play
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onStop}
          disabled={!isPlaying || isViewer}
          title={isViewer ? "Only hosts can control playback" : "Stop (Ctrl+.)"}
        >
          <Square className="h-4 w-4 mr-1" />
          Stop
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ConnectionIndicator status={status} />
        {isAIGenerating && (
          <span className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            AI generating...
          </span>
        )}
      </div>

      <div className="flex-1" />

      {showSave && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={onSave}
              disabled={saveStatus === "saving"}
              className="h-8 w-8"
            >
              <SaveIndicator status={saveStatus} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {saveStatus === "saved" && "All changes saved"}
            {saveStatus === "saving" && "Saving..."}
            {saveStatus === "unsaved" && "Unsaved changes"}
          </TooltipContent>
        </Tooltip>
      )}

      {showNew && onNew && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={onNew}
              className="h-8 w-8"
            >
              <FilePlus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Strudel</TooltipContent>
        </Tooltip>
      )}

      {showShare && onShare && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={onShare}
              className="h-8 w-8"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "saving") {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  if (status === "unsaved") {
    return (
      <div className="relative">
        <Cloud className="h-4 w-4" />
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-yellow-500" />
      </div>
    );
  }

  // saved
  return <Cloud className="h-4 w-4 text-green-500" />;
}

function ConnectionIndicator({
  status,
}: {
  status: "connected" | "connecting" | "disconnected" | "reconnecting";
}) {
  const statusConfig = {
    connected: { color: "bg-green-500", text: "Connected" },
    connecting: { color: "bg-yellow-500", text: "Connecting..." },
    reconnecting: { color: "bg-yellow-500", text: "Reconnecting..." },
    disconnected: { color: "bg-red-500", text: "Disconnected" },
  };

  const { color, text } = statusConfig[status];

  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-xs">{text}</span>
    </span>
  );
}
