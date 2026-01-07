'use client';

import { Cloud, Loader2, Activity } from 'lucide-react';
import type { SaveStatus } from './hooks';

export function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'saving') {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  if (status === 'unsaved') {
    return <Cloud className="h-4 w-4 text-yellow-500" />;
  }

  return <Cloud className="h-4 w-4 text-green-500" />;
}

export function ConnectionIndicator({
  status,
}: {
  status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
}) {
  const statusConfig = {
    connected: {
      icon: <Activity className="h-3.5 w-3.5" />,
      className: 'text-muted-foreground',
    },

    connecting: {
      icon: <Activity className="h-3.5 w-3.5 animate-pulse" />,
      className: 'text-yellow-500',
    },

    reconnecting: {
      icon: <Activity className="h-3.5 w-3.5 animate-pulse" />,
      className: 'text-yellow-500',
    },

    disconnected: {
      icon: <Activity className="h-3.5 w-3.5" />,
      className: 'text-red-500',
    },
  };

  const { icon, className } = statusConfig[status];

  return <span className={className}>{icon}</span>;
}
