"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAudioStore } from "@/lib/stores/audio";
import { useEditorStore } from "@/lib/stores/editor";
import { useWebSocketStore } from "@/lib/stores/websocket";

interface EditorToolbarProps {
  onPlay: () => void;
  onStop: () => void;
  onSave?: () => void;
  onShare?: () => void;
  showSave?: boolean;
  showShare?: boolean;
}

export function EditorToolbar({
  onPlay,
  onStop,
  onSave,
  onShare,
  showSave = false,
  showShare = false,
}: EditorToolbarProps) {
  const { isPlaying, isInitialized } = useAudioStore();
  const { isAIGenerating, isDirty } = useEditorStore();
  const { status } = useWebSocketStore();

  return (
    <div className="flex items-center gap-2 p-2 border-b bg-background">
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant={isPlaying ? "secondary" : "default"}
          onClick={onPlay}
          disabled={!isInitialized}
          title="Play (Ctrl+Enter)"
        >
          <PlayIcon className="h-4 w-4 mr-1" />
          Play
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onStop}
          disabled={!isPlaying}
          title="Stop (Ctrl+.)"
        >
          <StopIcon className="h-4 w-4 mr-1" />
          Stop
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ConnectionIndicator status={status} />
        {isAIGenerating && (
          <span className="flex items-center gap-1">
            <SpinnerIcon className="h-3 w-3 animate-spin" />
            AI generating...
          </span>
        )}
      </div>

      <div className="flex-1" />

      {showSave && onSave && (
        <Button
          size="sm"
          variant="outline"
          onClick={onSave}
          disabled={!isDirty}
        >
          <SaveIcon className="h-4 w-4 mr-1" />
          Save
        </Button>
      )}

      {showShare && onShare && (
        <Button size="sm" variant="outline" onClick={onShare}>
          <ShareIcon className="h-4 w-4 mr-1" />
          Share
        </Button>
      )}
    </div>
  );
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

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
    >
      <rect x="6" y="6" width="12" height="12" />
    </svg>
  );
}

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
