'use client';

import { Loader2 } from 'lucide-react';
import { useStrudelEditor } from './hooks';
import { RemoteCursors } from '@/components/shared/remote-cursors';
import { EditorToast } from './editor-toast';
import { EditorErrorBoundary } from './error-boundary';

export {
  isAudioContextSuspended,
  resumeAudioContext,
  evaluateStrudel,
  stopStrudel,
  previewSample,
} from './hooks';

interface StrudelEditorProps {
  initialCode?: string;
  onCodeChange?: (code: string) => void;
  readOnly?: boolean;
}

export function StrudelEditor({
  initialCode = '',
  onCodeChange,
  readOnly = false,
}: StrudelEditorProps) {
  const { containerRef, isLoadingStrudel } = useStrudelEditor(
    initialCode,
    onCodeChange,
    readOnly
  );

  return (
    <EditorErrorBoundary>
      <div className="relative h-full w-full">
        <div
          ref={containerRef}
          className="strudel-editor h-full w-full overflow-auto rounded-none"
        />
        <RemoteCursors />
        <EditorToast />
        {isLoadingStrudel && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading strudel...</p>
            </div>
          </div>
        )}
      </div>
    </EditorErrorBoundary>
  );
}
