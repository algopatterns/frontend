'use client';

import { useState } from 'react';
import { AlertTriangle, AlertCircle, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useAudioStore } from '@/lib/stores/audio';
import { cn } from '@/lib/utils';

export function EditorToast() {
  const toasts = useAudioStore(state => state.editorToasts);
  const dismissToast = useAudioStore(state => state.dismissEditorToast);
  const clearToasts = useAudioStore(state => state.clearEditorToasts);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDismiss = (id: string) => {
    dismissToast(id);
    if (toasts.length <= 2) setIsExpanded(false);
  };

  const handleDismissAll = () => {
    clearToasts();
    setIsExpanded(false);
  };

  if (toasts.length === 0) return null;

  const errorCount = toasts.filter(t => t.type === 'error').length;
  const warningCount = toasts.filter(t => t.type === 'warning').length;
  const latestToast = toasts[toasts.length - 1];

  // collapsed view - show only the latest with a count badge
  if (!isExpanded && toasts.length > 1) {
    return (
      <div className="absolute bottom-3 left-3 z-50 max-w-md">
        <button
          onClick={() => setIsExpanded(true)}
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 shadow-lg backdrop-blur-sm w-full text-left transition-colors',
            latestToast.type === 'error'
              ? 'bg-destructive/10 border border-destructive/30 hover:bg-destructive/20'
              : 'bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20'
          )}>
          <div className="flex items-center gap-1.5 shrink-0">
            {errorCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                {errorCount}
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-500">
                <AlertTriangle className="h-3.5 w-3.5" />
                {warningCount}
              </span>
            )}
          </div>
          <p
            className={cn(
              'text-sm flex-1 truncate',
              latestToast.type === 'error' ? 'text-destructive' : 'text-amber-500'
            )}>
            {latestToast.message}
          </p>
          <ChevronUp
            className={cn(
              'h-4 w-4 shrink-0',
              latestToast.type === 'error' ? 'text-destructive/70' : 'text-amber-500/70'
            )}
          />
        </button>
      </div>
    );
  }

  // expanded view or single toast
  return (
    <div className="absolute bottom-3 left-3 z-50 flex flex-col gap-2 max-w-md">
      {toasts.length > 1 && (
        <div className="flex items-center justify-between px-1">
          <button
            onClick={() => setIsExpanded(false)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className="h-3.5 w-3.5" />
            Collapse
          </button>
          <button
            onClick={handleDismissAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Dismiss all
          </button>
        </div>
      )}
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={cn(
            'flex items-start gap-2 rounded-lg px-3 py-2 shadow-lg backdrop-blur-sm animate-in slide-in-from-bottom-2 fade-in duration-200',
            toast.type === 'error'
              ? 'bg-destructive/10 border border-destructive/30'
              : 'bg-amber-500/10 border border-amber-500/30'
          )}>
          {toast.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          )}
          <p
            className={cn(
              'text-sm flex-1 break-words',
              toast.type === 'error' ? 'text-destructive' : 'text-amber-500'
            )}>
            {toast.message}
          </p>
          <button
            onClick={() => handleDismiss(toast.id)}
            className={cn(
              'shrink-0 mt-0.5 transition-colors',
              toast.type === 'error'
                ? 'text-destructive/70 hover:text-destructive'
                : 'text-amber-500/70 hover:text-amber-500'
            )}>
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
